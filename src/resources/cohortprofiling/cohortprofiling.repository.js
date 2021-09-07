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

	static buildSortQuery(sort) {
		const customSort = !isEmpty(sort) ? sort : '-frequency';
		const sortPathName =
			customSort.charAt(0) === '-'
				? `dataClasses.dataElements.frequencies.${customSort.substring(1)}`
				: `dataClasses.dataElements.frequencies.${customSort}`;
		const sortOrder = customSort.charAt(0) === '-' ? -1 : 1;
		return { [sortPathName]: sortOrder };
	}

	static buildMatchQuery(value) {
		return !isEmpty(value)
			? { 'dataClasses.dataElements.frequencies.value': new RegExp(`${escapeRegExp(value)}`, 'i') }
			: { 'dataClasses.dataElements.frequencies.value': { $ne: '' } };
	}

	static async getCohortProfilingByVariable(pid, tableName, variable, value, sort) {
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

	static getTransformedDataElements(dataClasses) {
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
			let dataClassesTransformed = profilingData.dataClasses;
			dataClassesTransformed.dataElements = this.getTransformedDataElements(dataClassesTransformed);

			// Remove data elements where an empty frequency array was supplied
			const dataClassesWithEmptyFrequenciesRemoved = dataClassesTransformed.map(dataClass => {
				return {
					...dataClass,
					dataElements: dataClass.dataElements.filter(dataElement => {
						return !isEmpty(dataElement.frequencies);
					}),
				};
			});

			// Remove data classes that are now empty due to empty data elements being removed
			const dataClassesComplete = dataClassesWithEmptyFrequenciesRemoved.filter(dataClass => {
				return !isEmpty(dataClass.dataElements);
			});

			const newDataObj = await CohortProfiling.updateOne(
				{ pid: { $eq: profilingData.pid } },
				{ $set: { dataClasses: dataClassesComplete } },
				{ upsert: true }
			);
			if (!newDataObj) reject(new Error(`Can't persist data object to DB.`));

			resolve({ pid: profilingData.pid });
		});
	}
}
