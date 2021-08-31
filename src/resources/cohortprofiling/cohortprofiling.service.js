import _ from 'lodash';

export default class CohortProfilingService {
	constructor(cohortProfilingRepository) {
		this.cohortProfilingRepository = cohortProfilingRepository;
	}

	async getCohortProfiling(query = {}, options = {}) {
		return this.cohortProfilingRepository.getCohortProfiling(query, options);
	}

	async getCohortProfilingByVariable(pid, tableName, variable, value, sort, limit) {
		return this.cohortProfilingRepository.getCohortProfilingByVariable(pid, tableName, variable, value, sort, limit);
	}

	async saveCohortProfiling(req, res) {
		return this.cohortProfilingRepository.saveCohortProfiling(req, res);
	}
}
