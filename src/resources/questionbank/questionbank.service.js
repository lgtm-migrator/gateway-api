import { isEmpty, has } from 'lodash';

export default class QuestionbankService {
	constructor(publisherService, globalService, dataRequestRepository, datasetService) {
		this.publisherService = publisherService;
		this.globalService = globalService;
		this.dataRequestRepository = dataRequestRepository;
		this.datasetService = datasetService;
	}

	async getQuestionBankInfo(publisherId) {
		const publisher = await this.publisherService.getPublisher(publisherId);
		const global = await this.globalService.getGlobal({ localeId: 'en-gb' });
		const masterSchema = global.masterSchema;

		let dataRequestSchemas = await this.dataRequestRepository.getApplicationFormSchemas(publisher);

		if (isEmpty(dataRequestSchemas)) {
			let questionStatus = {};

			//create the questionStatus from the master schema
			masterSchema.questionSets.forEach(questionSet => {
				questionSet.questions.forEach(question => {
					questionStatus[question.questionId] = question.defaultQuestion;
				});
			});

			const newSchema = {
				publisher: publisher.name,
				status: 'draft',
				isCloneable: true,
				questionStatus,
				guidance: {},
				countOfChanges: 0,
			};

			const schema = await this.dataRequestRepository.createApplicationFormSchema(newSchema);

			return {
				masterSchema,
				questionStatus: schema.questionStatus,
				guidance: schema.guidance,
				countOfChanges: schema.countOfChanges,
				schemaId: schema._id,
			};
		}

		const latestSchemaVersion = dataRequestSchemas[0];
		if (latestSchemaVersion.status === 'draft') {
			let newQuestionStatus = latestSchemaVersion.questionStatus;
			let newQuestionsAdded = this.addQuestionsFromMasterSchema(masterSchema, latestSchemaVersion, newQuestionStatus);

			//Add new questions from the master schema if any
			if (newQuestionsAdded)
				await this.dataRequestRepository.updateApplicationFormSchemaById(latestSchemaVersion._id, { questionStatus: newQuestionStatus });

			return {
				masterSchema,
				questionStatus: newQuestionStatus,
				guidance: latestSchemaVersion.guidance,
				countOfChanges: latestSchemaVersion.countOfChanges,
				schemaId: latestSchemaVersion._id,
			};
		}

		if (latestSchemaVersion.status === 'active') {
			if (!isEmpty(latestSchemaVersion.questionStatus)) {
				let newQuestionStatus = latestSchemaVersion.questionStatus;

				//Add new questions from the master schema if any
				this.addQuestionsFromMasterSchema(masterSchema, latestSchemaVersion, newQuestionStatus);

				const newSchema = {
					publisher: publisher.name,
					status: 'draft',
					isCloneable: true,
					questionStatus: newQuestionStatus,
					guidance: latestSchemaVersion.guidance,
					version: latestSchemaVersion.version + 1,
					countOfChanges: 0,
				};

				const schema = await this.dataRequestRepository.createApplicationFormSchema(newSchema);

				return {
					masterSchema,
					questionStatus: newSchema.questionStatus,
					guidance: newSchema.guidance,
					countOfChanges: newSchema.countOfChanges,
					schemaId: schema._id,
				};
			} else {
				let questionStatus = {};

				//Add questions from the publisher schema
				this.addQuestionsFromPublisherSchema(latestSchemaVersion, questionStatus);

				//Add question from master schema if not in the publisher schema
				this.addQuestionsFromMasterSchema(masterSchema, latestSchemaVersion, questionStatus);

				const newSchema = {
					publisher: publisher.name,
					status: 'draft',
					isCloneable: true,
					questionStatus,
					guidance: {},
					countOfChanges: 0,
					version: latestSchemaVersion.version + 1,
				};

				const schema = await this.dataRequestRepository.createApplicationFormSchema(newSchema);

				return {
					masterSchema,
					questionStatus: newSchema.questionStatus,
					guidance: newSchema.guidance,
					countOfChanges: newSchema.countOfChanges,
					schemaId: schema._id,
				};
			}
		}
	}

	async publishSchema(schema) {
		const global = await this.globalService.getGlobal({ localeId: 'en-gb' });
		const masterSchema = global.masterSchema;
		const { guidance, questionStatus } = schema;

		masterSchema.questionSets.forEach((questionSet, questionSetIndex) => {
			let questionsArray = masterSchema.questionSets[questionSetIndex].questions;
			questionSet.questions.forEach(question => {
				if (questionStatus[question.questionId] === 0) {
					questionsArray = questionsArray.filter(q => q.questionId !== question.questionId);
				} else {
					if (has(guidance, question.questionId)) {
						question.guidance = guidance[question.questionId];
					}
					delete question.lockedQuestion;
					delete question.defaultQuestion;
				}
			});
			masterSchema.questionSets[questionSetIndex].questions = questionsArray;
		});

		const jsonSchema = masterSchema;

		const publishedSchema = await this.dataRequestRepository.updateApplicationFormSchemaById(schema._id, { jsonSchema, status: 'active' });

		//if its not already a 5 safes publisher then set the flags to true on the publisher and also on the datasets
		const publisher = await this.publisherService.getPublisher(schema.publisher, { lean: true });
		if (!has(publisher, 'uses5Safes')) {
			await this.publisherService.update(publisher._id, {
				allowsMessaging: true,
				workflowEnabled: true,
				allowAccessRequestManagement: true,
				uses5Safes: true,
			});

			await this.datasetService.updateMany({ 'datasetfields.publisher': schema.publisher }, { is5Safes: true });
		}

		return publishedSchema;
	}

	addQuestionsFromPublisherSchema(publisherSchema, questionStatus) {
		const jsonSchema = publisherSchema.jsonSchema;
		jsonSchema.questionSets.forEach(questionSet => {
			questionSet.questions.forEach(question => {
				questionStatus[question.questionId] = 1;
			});
		});
	}

	addQuestionsFromMasterSchema(masterSchema, publisherSchema, questionStatus) {
		let newQuestionsAdded = false;

		//Add new questions from the master schema if any
		masterSchema.questionSets.forEach(questionSet => {
			questionSet.questions.forEach(question => {
				if (!has(publisherSchema.questionStatus, question.questionId)) {
					questionStatus[question.questionId] = question.defaultQuestion;
					newQuestionsAdded = true;
				}
			});
		});

		return newQuestionsAdded;
	}
}
