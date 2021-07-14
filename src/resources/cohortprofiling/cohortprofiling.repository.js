import Repository from '../base/repository';
import { CohortProfiling } from './cohortProfiling.model';
import { isEmpty } from 'lodash';

export default class CohortProfilingRepository extends Repository {
	constructor() {
		super(CohortProfiling);
		this.cohortProfiling = CohortProfiling;
	}

	async getCohortProfiling(query, options) {
		return this.find(query, options);
	}

	buildSortQuery(sort) {
		const customSort = !isEmpty(sort) ? sort : '-frequency';
		const sortPathName = customSort.charAt(0) === '-' ? `variables.values.${customSort.substring(1)}` : `variables.values.${customSort}`;
		const sortOrder = customSort.charAt(0) === '-' ? -1 : 1;
		return { [sortPathName]: sortOrder };
	}

	buildMatchQuery(pid, tableName, value) {
		let matchQuery = {
			pids: pid,
			tableName,
		};

		if (!isEmpty(value)) {
			matchQuery['variables.values.value'] = new RegExp(`${value}`, 'i');
		}

		return matchQuery;
	}

	async calculateTotalFrequency(pid, tableName, variable) {
		const matchQuery = this.buildMatchQuery(pid, tableName);

		let frequencyData = await CohortProfiling.aggregate([
			{
				$match: matchQuery,
			},
			{
				$unwind: {
					path: '$variables',
				},
			},
			{
				$match: {
					'variables.name': variable,
				},
			},
			{
				$unwind: {
					path: '$variables.values',
				},
			},
			{
				$match: matchQuery,
			},

			{
				$group: {
					_id: '',
					totalFrequency: { $sum: '$variables.values.frequency' },
				},
			},
		]);

		return frequencyData[0].totalFrequency;
	}

	async getCohortProfilingByVariable(pid, tableName, variable, value, sort, limit) {
		const sortQuery = this.buildSortQuery(sort);
		const customLimit = !isEmpty(limit) ? parseInt(limit) : 10;
		const matchQuery = this.buildMatchQuery(pid, tableName, value);
		const totalFrequency = await this.calculateTotalFrequency(pid, tableName, variable);

		let cohortProfiling = await CohortProfiling.aggregate([
			{
				$match: matchQuery,
			},
			{
				$unwind: {
					path: '$variables',
				},
			},
			{
				$match: {
					'variables.name': variable,
				},
			},
			{
				$unwind: {
					path: '$variables.values',
				},
			},
			{
				$match: matchQuery,
			},
			{
				$addFields: {
					'variables.values.frequencyAsPercentage': { $divide: ['$variables.values.frequency', totalFrequency] },
				},
			},
			{
				$sort: sortQuery,
			},

			{
				$limit: customLimit,
			},
			{
				$group: {
					_id: '$_id',
					name: { $first: '$variables.name' },
					maxLength: { $first: '$variables.maxLength' },
					numRows: { $first: '$variables.numRows' },
					completeness: { $first: '$variables.completeness' },
					values: { $push: '$variables.values' },
				},
			},
		]);

		return cohortProfiling;
	}
}
