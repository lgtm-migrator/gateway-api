import { v4 as uuidv4 } from 'uuid';

export default class CohortService {
	constructor(cohortRepository) {
		this.cohortRepository = cohortRepository;
	}

	getCohort(id, query = {}, options = {}) {
		// Protect for no id passed
		if (!id) return;

		query = { ...query, id };
		return this.cohortRepository.getCohort(query, options);
	}

	getCohorts(query = {}) {
		return this.cohortRepository.getCohorts(query);
	}

	async addCohort(body = {}) {
		// 1. Generate uuid for Cohort PID
		let uuid = '';
		while (uuid === '') {
			uuid = uuidv4();
			if ((await this.cohortRepository.getCohorts({ pid: uuid })).length > 0) uuid = '';
		}
		// 2. Generate uniqueId for Cohort so we can differentiate between versions
		let uniqueId = '';
		while (uniqueId === '') {
			uniqueId = parseInt(Math.random().toString().replace('0.', ''));
			if ((await this.cohortRepository.getCohorts({ id: uniqueId }).length) > 0) uniqueId = '';
		}

		// 3. Extract PIDs from cohort object so we can build up related objects
		let pids = body.cohort.input.collections.map(collection => {
			return collection.external_id;
		});
		let relatedObjects = [];
		pids.forEach(pid => {
			relatedObjects.push({
				objectType: 'dataset',
				pid,
				isLocked: true,
			});
		});

		// 4. Extract filter criteria used in query
		let filterCriteria = [];
		body.cohort.input.cohorts.forEach(cohort => {
			cohort.groups.forEach(group => {
				group.rules.forEach(rule => {
					filterCriteria.push(rule.value);
				});
			});
		});

		// 5. Build document object and save to DB
		const document = {
			id: uniqueId,
			pid: uuid,
			type: 'cohort',
			name: body.description,
			activeflag: 'draft',
			userId: body.user_id,
			uploaders: [parseInt(body.user_id)],
			updatedAt: Date.now(),
			lastRefresh: Date.now(),
			request_id: body.request_id,
			cohort: body.cohort,
			items: body.items,
			rquestRelatedObjects: body.relatedObjects,
			datasetPids,
			filterCriteria,
			relatedObjects,
			description: '',
			publicflag: true,
		};
		return this.cohortRepository.addCohort(document);
	}
}
