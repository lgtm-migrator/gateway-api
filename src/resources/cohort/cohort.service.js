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
		let uuid = '';
		while (uuid === '') {
			uuid = uuidv4();
			if ((await this.cohortRepository.getCohorts({ pid: uuid })).length > 0) uuid = '';
		}

		let uniqueId = '';
		while (uniqueId === '') {
			uniqueId = parseInt(Math.random().toString().replace('0.', ''));
			if ((await this.cohortRepository.getCohorts({ id: uniqueId }).length) > 0) uniqueId = '';
		}

		let pids = []; //TODO: Extract Pids from cohort object

		let relatedObjects = [];
		pids.forEach(pid => {
			relatedObjects.push({
				objectType: 'dataset',
				pid,
				isLocked: true,
			});
		});

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
			relatedObjects,
		};
		return this.cohortRepository.addCohort(document);
	}
}
