import { isEmpty, has } from 'lodash';

export default class QuestionbankService {
	constructor(questionbankRepository, publisherService, globalService, dataRequestRepository) {
		this.questionbankRepository = questionbankRepository;
		this.publisherService = publisherService;
		this.globalService = globalService;
		this.dataRequestRepository = dataRequestRepository;
	}

	getQuestionbank(id, query = {}, options = {}) {
		// Protect for no id passed
		if (!id) return;

		query = { ...query, id };
		return this.questionbankRepository.getQuestionbank(query, options);
	}

	getQuestionbanks(query = {}) {
		return this.questionbankRepository.getQuestionbanks(query);
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

			await this.dataRequestRepository.createApplicationFormSchema(newSchema);

			return {
				masterSchema,
				questionStatus: newSchema.questionStatus,
				guidance: newSchema.guidance,
				countOfChanges: newSchema.countOfChanges,
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

				await this.dataRequestRepository.createApplicationFormSchema(newSchema);

				return {
					masterSchema,
					questionStatus: newSchema.questionStatus,
					guidance: newSchema.guidance,
					countOfChanges: newSchema.countOfChanges,
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

				await this.dataRequestRepository.createApplicationFormSchema(newSchema);

				return {
					masterSchema,
					questionStatus: newSchema.questionStatus,
					guidance: newSchema.guidance,
					countOfChanges: newSchema.countOfChanges,
				};
			}
		}
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
