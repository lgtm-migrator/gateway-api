import Repository from '../base/repository';
import { CohortProfiling } from './cohortprofiling.model';
import { isEmpty, isNil, escapeRegExp } from 'lodash';

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
		const sortPathName =
			customSort.charAt(0) === '-'
				? `dataClasses.dataElements.frequencies.${customSort.substring(1)}`
				: `dataClasses.dataElements.frequencies.${customSort}`;
		const sortOrder = customSort.charAt(0) === '-' ? -1 : 1;
		return { [sortPathName]: sortOrder };
	}

	buildMatchQuery(value) {
		return !isEmpty(value)
			? { 'dataClasses.dataElements.frequencies.value': new RegExp(`${escapeRegExp(value)}`, 'i') }
			: { 'dataClasses.dataElements.frequencies.value': { $ne: '' } };
	}

	async getCohortProfilingByVariable(pid, tableName, variable, value, sort) {
		const matchQuery = CohortProfilingRepository.buildMatchQuery(value);
		const sortQuery = CohortProfilingRepository.buildSortQuery(sort);

		let cohortProfiling = await CohortProfiling.aggregate([
			{
				$match: { pid },
			},
			{
				$unwind: {
					path: '$dataClasses',
				},
			},
			{
				$match: {
					'dataClasses.name': tableName,
				},
			},
			{
				$unwind: {
					path: '$dataClasses.dataElements',
				},
			},
			{
				$match: { 'dataClasses.dataElements.field': variable },
			},
			{
				$unwind: {
					path: '$dataClasses.dataElements.frequencies',
				},
			},
			{
				$match: matchQuery,
			},
			{
				$sort: sortQuery,
			},
			{
				$group: {
					_id: '$_id',
					name: { $first: '$dataClasses.dataElements.field' },
					maxLength: { $first: '$dataClasses.dataElements.length' },
					numRows: { $first: '$dataClasses.dataElements.rows' },
					completeness: { $first: '$dataClasses.dataElements.completeness' },
					values: { $push: '$dataClasses.dataElements.frequencies' },
				},
			},
		]).allowDiskUse(true);

		return cohortProfiling;
	}

	// getDataClassesWithNamesCleansed(dataClasses) {
	// 	return dataClasses.map(dataClass => {
	// 		const index = dataClass.name.indexOf('dbo.');
	// 		dataClass.name = index > -1 ? dataClass.name.substring(index + 4) : dataClass.name;
	// 		dataClass.name = dataClass.name.replace(/#/g, '');

	// 		return dataClass;
	// 	});
	// }

	async applyTransformedProfilingData(pid, dataClasses) {
		return await this.cohortProfiling.updateOne({ pid: { $eq: pid } }, { $set: { dataClasses } }, { upsert: true });
	}
}
