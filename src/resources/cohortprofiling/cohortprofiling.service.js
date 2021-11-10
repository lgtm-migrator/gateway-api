import { isEmpty, isNil } from 'lodash';
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

			const newDataObj = await this.cohortProfilingRepository.applyTransformedProfilingData(profilingData.pid, dataClassesComplete);

			if (!newDataObj) reject(new Error(`Can't persist data object to DB.`));

			resolve({ pid: profilingData.pid });
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
}
