import Repository from '../../base/repository';
import { Collections } from '../collections.model';
import { isNil } from 'lodash'

export default class CollectionRepository extends Repository {
	constructor() {
		super(Collections);
		this.collection = Collections;
	}

	async getCollection(id, query) {
		query = { ...query, id };
		const options = { lean: true };
		return this.findOne(query, options);
	}

	async getCollections(query, options = {}) {
		if (options.aggregate) {
			const searchTerm = (query && query['$and'] && query['$and'].find(exp => !isNil(exp['$text']))) || {};

			if (searchTerm) {
				query['$and'] = query['$and'].filter(exp => !exp['$text']);
			}

			const aggregateQuery = [
				{ $match: searchTerm },
				{ $lookup: { from: 'tools', localField: 'authors', foreignField: 'id', as: 'persons' } },
				{
					$addFields: {
						persons: {
							$map: {
								input: '$persons',
								as: 'row',
								in: {
									id: '$$row.id',
									firstname: '$$row.firstname',
									lastname: '$$row.lastname',
									fullName: { $concat: ['$$row.firstname', ' ', '$$row.lastname'] },
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
			return Collections.aggregate(aggregateQuery);
		} else {
			return this.find(query, options);
		}
	}
}
