import Repository from '../base/repository';
import { Cohort } from './cohort.model';
import { isNil } from 'lodash';

export default class CohortRepository extends Repository {
	constructor() {
		super(Cohort);
		this.cohort = Cohort;
	}

	async getCohort(query, options = {}) {
		return this.findOne(query, options);
	}

	async getCohorts(query, options = {}) {
		if (options.aggregate) {
			const searchTerm = (query && query['$and'] && query['$and'].find(exp => !isNil(exp['$text']))) || {};

			if (searchTerm) {
				query['$and'] = query['$and'].filter(exp => !exp['$text']);
			}

			const aggregateQuery = [
				{ $match: searchTerm },
				{
					$lookup: {
						from: 'tools',
						let: {
							datasetPids: '$datasetPids',
						},
						pipeline: [
							{
								$match: {
									$expr: {
										$and: [
											{
												$in: ['$pid', '$$datasetPids'],
											},
											{
												$eq: ['$activeflag', 'active'],
											},
										],
									},
								},
							},
						],
						as: 'datasets',
					},
				},
				{
					$addFields: {
						datasets: {
							$map: {
								input: '$datasets',
								as: 'row',
								in: {
									pid: '$$row.pid',
									name: '$$row.name',
									activeflag: '$$row.activeflag',
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
			return Cohort.aggregate(aggregateQuery);
		} else {
			const options = { lean: true };
			return this.find(query, options);
		}
	}

	async addCohort(body) {
		return this.create(body);
	}

	async editCohort(query, body = {}) {
		let updatedCohort = await this.updateByQuery(query, body);
		return updatedCohort;
	}
}
