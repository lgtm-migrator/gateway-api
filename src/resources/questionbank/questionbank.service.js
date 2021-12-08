import { isEmpty, has } from 'lodash';

export default class QuestionbankService {
	constructor(publisherService, globalService, dataRequestRepository) {
		this.publisherService = publisherService;
		this.globalService = globalService;
		this.dataRequestRepository = dataRequestRepository;
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
			questionSet.questions.forEach((question, questionIndex) => {
				if (questionStatus[question.questionId] === 0) {
					delete masterSchema.questionSets[questionSetIndex].questions[questionIndex];
				} else {
					if (has(guidance, question.questionId)) question.guidance = guidance[question.questionId];
					delete masterSchema.questionSets[questionSetIndex].questions[questionIndex].lockedQuestion;
					delete masterSchema.questionSets[questionSetIndex].questions[questionIndex].defaultQuestion;
				}
			});
		});

		const jsonSchema = masterSchema;

		const publishedSchema = await this.dataRequestRepository.updateApplicationFormSchemaById(schema._id, { jsonSchema });

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
