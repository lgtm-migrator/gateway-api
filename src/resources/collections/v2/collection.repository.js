import Repository from '../../base/repository';
import { Collections } from '../collections.model';

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

	async getCollections(query) {
		const options = { lean: true };
		if (query.mode === 'Aggregate') {
			const aggregateQuery = [
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
						return (obj = { ...obj, [key]: 1 });
					}, {}),
				});
			}
			return Collections.aggregate(aggregateQuery);
		} else {
			return this.find(query, options);
		}
	}
}
