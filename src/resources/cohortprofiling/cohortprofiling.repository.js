import Repository from '../base/repository';
import { CohortProfiling } from './cohortProfiling.model';
import { isEmpty, isNil } from 'lodash';

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
			? { 'dataClasses.dataElements.frequencies.value': new RegExp(`${value}`, 'i') }
			: { 'dataClasses.dataElements.frequencies.value': { $ne: '' } };
	}

	async getCohortProfilingByVariable(pid, tableName, variable, value, sort, limit) {
		const matchQuery = this.buildMatchQuery(value);
		const sortQuery = this.buildSortQuery(sort);
		const customLimit = !isEmpty(limit) ? parseInt(limit) : 10;

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
				$limit: customLimit,
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
		]);

		return cohortProfiling;
	}

	getDataClassesWithNamesCleansed(dataClasses) {
		return dataClasses.map(dataClass => {
			const index = dataClass.name.indexOf('dbo.');
			dataClass.name = index > -1 ? dataClass.name.substring(index + 4) : dataClass.name;
			dataClass.name = dataClass.name.replace(/#/g, '');

			return dataClass;
		});
	}

	getTransformedDataElements(dataClasses) {
		return dataClasses.map(dataClass => {
			return dataClass.dataElements.map(dataElement => {
				// Calculate total frequency & completeness for the current Data Element
				const totalFrequency = Object.values(dataElement.frequencies).reduce((a, b) => a + b, 0);
				const completeness = totalFrequency / dataElement.rows;
				dataElement.completeness = parseFloat(completeness.toFixed(5));

				// Transform frequencies into array of objects with frequencyAsPercentage values
				let frequenciesTransformed = [];
				Object.keys(dataElement.frequencies).forEach(key => {
					if (!isNil(dataElement.frequencies[key])) {
						frequenciesTransformed.push({
							_id: false,
							value: key,
							frequency: dataElement.frequencies[key],
							frequencyAsPercentage: parseFloat((dataElement.frequencies[key] / totalFrequency).toFixed(5)),
						});
					}
				});
				dataElement.frequencies = frequenciesTransformed;

				return dataElement;
			});
		})[0];
	}

	async saveCohortProfiling(profilingData) {
		return new Promise(async (resolve, reject) => {
			let dataClassesTransformed = this.getDataClassesWithNamesCleansed(profilingData.dataClasses);
			dataClassesTransformed.dataElements = this.getTransformedDataElements(dataClassesTransformed);

			const newDataObj = await CohortProfiling.updateOne(
				{ pid: profilingData.pid },
				{ $set: { dataClasses: dataClassesTransformed } },
				{ upsert: true }
			);
			if (!newDataObj) reject(new Error(`Can't persist data object to DB.`));

			resolve({ pid: profilingData.pid });
		});
	}
}
