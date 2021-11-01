import Repository from '../base/repository';
import { DataUseRegister } from './dataUseRegister.model';
import { isNil } from 'lodash';

export default class DataUseRegisterRepository extends Repository {
	constructor() {
		super(DataUseRegister);
		this.dataUseRegister = DataUseRegister;
	}

	getDataUseRegister(query, options) {
		return this.findOne(query, options);
	}

	async getDataUseRegisters(query, options = {}) {
		if (options.aggregate) {
			const searchTerm = (query && query['$and'] && query['$and'].find(exp => !isNil(exp['$text']))) || {};

			if (searchTerm) {
				query['$and'] = query['$and'].filter(exp => !exp['$text']);
			}

			const aggregateQuery = [
				{ $match: searchTerm },
				{
					$lookup: {
						from: 'publishers',
						localField: 'publisher',
						foreignField: '_id',
						as: 'publisherDetails',
					},
				},
				{
					$addFields: {
						publisherDetails: {
							$map: {
								input: '$publisherDetails',
								as: 'row',
								in: {
									name: '$$row.name',
								},
							},
						},
					},
				},
				{ $match: { $and: [...query['$and']] } },
			];

			if (query.fields) {
				aggregateQuery.push({
					$project: query.fields.split(',').reduce((obj, key) => {
						return { ...obj, [key]: 1 };
					}, {}),
				});
			}
			return DataUseRegister.aggregate(aggregateQuery);
		} else {
			const options = { lean: true };
			return this.find(query, options);
		}
	}

	getDataUseRegisterByApplicationId(applicationId) {
		return this.dataUseRegister.findOne({ projectId: applicationId }, 'id').lean();
	}

	updateDataUseRegister(id, body) {
		body.updatedon = Date.now();
		body.lastActivity = Date.now();

		return this.update(id, body);
	}

	uploadDataUseRegisters(dataUseRegisters) {
		return this.dataUseRegister.insertMany(dataUseRegisters);
	}

	async createDataUseRegister(dataUseRegister) {
		await this.linkRelatedDataUseRegisters(dataUseRegister);
		return await this.create(dataUseRegister);
	}

	async linkRelatedDataUseRegisters(dataUseRegister) {
		const { relatedObjects = [], userName } = dataUseRegister;
		const dataUseRegisterIds = relatedObjects.filter(el => el.objectType === 'dataUseRegister').map(el => el.objectId);
		const relatedObject = {
			objectId: dataUseRegister.id,
			objectType: 'dataUseRegister',
			user: userName,
			updated: Date.now(),
			isLocked: true,
			reason: `This data use register was added automatically as it was derived from a newer approved version of the same data access request`,
		};

		await this.dataUseRegister.updateMany(
			{ id: { $in: dataUseRegisterIds } },
			{
				$push: {
					relatedObjects: relatedObject,
				},
			}
		);
	}

	async checkDataUseRegisterExists(projectIdText, projectTitle, organisationName, datasetTitles) {
		const duplicatesFound = await this.dataUseRegister.countDocuments({
			$or: [
				{ projectIdText },
				{
					projectTitle,
					organisationName,
					datasetTitles,
				},
			],
		});

		return duplicatesFound > 0;
	}
}
