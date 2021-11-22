import { isNull, isEmpty } from 'lodash';
import { DataRequestSchemaModel } from '../datarequest/schema/datarequest.schemas.model';

export default class QuestionbankService {
	constructor(questionbankRepository, publisherService, globalService) {
		this.questionbankRepository = questionbankRepository;
		this.publisherService = publisherService;
		this.globalService = globalService;
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

		let dataRequestSchemas = await DataRequestSchemaModel.find({ publisher: publisher.name }).sort({ version: -1 });

		if (isEmpty(dataRequestSchemas)) {
			let questionStatus = {};

			masterSchema.questionSets.forEach(questionSet => {
				questionSet.questions.forEach(question => {
					questionStatus[question.questionId] = question.defaultQuestion;
				});
			});

			const newSchema = new DataRequestSchemaModel({
				publisher: publisher.name,
				status: 'draft',
				isCloneable: true,
				questionStatus,
			});

			await DataRequestSchemaModel.create(newSchema);

			return {
				masterSchema,
				questionStatus: newSchema.questionStatus,
				guidance: newSchema.guidance,
				countOfChanges: newSchema.countOfChanges,
			};
		}

		const latestSchemaVersion = dataRequestSchemas[0];
		if (latestSchemaVersion.status === 'draft') {
			//check if new questions added in the masterSchema
			let newQuestionStatus = latestSchemaVersion.questionStatus;
			let newQuestionsAdded = false;

			masterSchema.questionSets.forEach(questionSet => {
				questionSet.questions.forEach(question => {
					if (!Object.keys(latestSchemaVersion.questionStatus).includes(question.questionId)) {
						newQuestionStatus[question.questionId] = question.defaultQuestion;
						newQuestionsAdded = true;
					}
				});
			});

			if (newQuestionsAdded)
				await DataRequestSchemaModel.findOneAndUpdate({ _id: latestSchemaVersion._id }, { $set: { questionStatus: newQuestionStatus } });

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

				//check for new questions in the master schema and add those
				masterSchema.questionSets.forEach(questionSet => {
					questionSet.questions.forEach(question => {
						if (!Object.keys(latestSchemaVersion.questionStatus).includes(question.questionId)) {
							newQuestionStatus[question.questionId] = question.defaultQuestion;
						}
					});
				});

				const newSchema = new DataRequestSchemaModel({
					publisher: publisher.name,
					status: 'draft',
					isCloneable: true,
					questionStatus: newQuestionStatus,
					guidance: latestSchemaVersion.guidance,
					version: latestSchemaVersion.version + 1,
				});

				await DataRequestSchemaModel.create(newSchema);

				return {
					masterSchema,
					questionStatus: newSchema.questionStatus,
					guidance: newSchema.guidance,
					countOfChanges: newSchema.countOfChanges,
				};
			} else {
				//need to create the question status from the current jsonSchema
				let questionStatus = {};
				const guidance = {};
				const jsonSchema = latestSchemaVersion.jsonSchema;

				let questionIds = [];
				jsonSchema.questionSets.forEach(questionSet => {
					questionIds = [...questionIds, ...questionSet.questions.map(question => question.questionId)];
				});

				masterSchema.questionSets.forEach(questionSet => {
					questionSet.questions.forEach(question => {
						if (questionIds.includes(question.questionId)) {
							questionStatus[question.questionId] = 1;
						} else {
							questionStatus[question.questionId] = question.defaultQuestion;
						}
					});
				});

				const newSchema = new DataRequestSchemaModel({
					publisher: publisher.name,
					status: 'draft',
					isCloneable: true,
					questionStatus,
					guidance,
					version: latestSchemaVersion.version + 1,
				});

				await DataRequestSchemaModel.create(newSchema);

				return {
					masterSchema,
					questionStatus,
					guidance: {},
					countOfChanges: 0,
					version: latestSchemaVersion.version + 1,
				};
			}
		}
	}
}
