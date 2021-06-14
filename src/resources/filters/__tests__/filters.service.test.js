import FilterRepository from '../filters.repository';
import FiltersService from '../filters.service';
import { datasets_commercial, datasets_commercial_expected } from '../__mocks__/filters.mocks';

describe('Filter service tests', () => {
	test('Test Commerical usage filter for datasets, returns updated filter status for commerical usage for a dataset', () => {
		// Arrange
		let commericalOutput = [];
		const filterRepository = new FilterRepository();
		const filterService = new FiltersService(filterRepository);
		// Format and call our function computCommericalUse
		for (let dataset of datasets_commercial) {
			let { datautility = {}, datasetv2 = {} } = dataset;
			let commercialUse = filterService.computeCommericalUse(datautility, datasetv2);
			commericalOutput.push({ ...dataset, commercialUse });
		}
		// Assert
		expect(commericalOutput).toEqual(datasets_commercial_expected);
	});
});
