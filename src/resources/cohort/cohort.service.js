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
}
