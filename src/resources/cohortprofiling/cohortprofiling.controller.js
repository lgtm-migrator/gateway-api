import Controller from '../base/controller';
import { isEmpty } from 'lodash';

export default class CohortProfilingController extends Controller {
	constructor(cohortProfilingService) {
		super(cohortProfilingService);
		this.cohortProfilingService = cohortProfilingService;
	}

	async getCohortProfilingByVariable(req, res) {
		try {
			// Extract parameters from query string
			const { pid, tableName, variable } = req.params;
			const { value, sort, limit } = req.query;
			// If pid, tableName and variable provided, it is a bad request
			if (!pid || !tableName || !variable) {
				return res.status(400).json({
					success: false,
					message: 'You must provide a pid, table name and variable name',
				});
			}
			// Find Cohort Profiling data
			const cohortProfiling = await this.cohortProfilingService.getCohortProfilingByVariable(pid, tableName, variable, value, sort, limit);
			// Return if no cohortProfiling found
			if (isEmpty(cohortProfiling)) {
				return res.status(404).json({
					success: false,
					message: 'Cohort Profiling data could not be found with the provided parameters',
				});
			}
			// Return Cohort Profiling data
			return res.status(200).json({
				success: true,
				cohortProfiling,
			});
		} catch (err) {
			// Return error response if something goes wrong
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: 'A server error occurred, please try again',
			});
		}
	}

	async getCohortProfiling(req, res) {
		try {
			// 1. Get Cohort Profiling data from the database
			const options = { lean: true };
			let cohortProfiling = await this.cohortProfilingService.getCohortProfiling(req.query, options);

			// 2. Return Cohort Profiling data
			return res.status(200).json({ success: true, cohortProfiling });
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({ success: false, message: err.message });
		}
	}
}
