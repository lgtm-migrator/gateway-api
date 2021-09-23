import FilterRepository from '../filters.repository';
import DatasetRepository from '../../dataset/dataset.repository';
import FiltersService from '../filters.service';
import { datasets_commercial, datasets_commercial_expected, mock_datasets } from '../__mocks__/filters.mocks';

import sinon from 'sinon';

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

	test('Test filter optimisation, require that publisher name filters are CAPITALISED and contain no "ALLIANCE >" or "HUB >" in the string', async () => {
		// Setup
		const filterRepository = new FilterRepository();
		const datasetRepository = new DatasetRepository();
		const filterService = new FiltersService(filterRepository, datasetRepository);
		const datasetStub = sinon.stub(datasetRepository, 'getDatasets').returns(mock_datasets);

		// Call the build filters function, while mocking the datasetRepository.getDatasets(...) function
		let sortedFilters = await filterService.buildFilters('dataset', { $and: [{ activeflag: 'active' }] }, false);

		// Assert
		expect(datasetStub.calledOnce).toBe(true);
		expect(sortedFilters).toHaveProperty('publisher');
		sortedFilters.publisher.forEach(name => {
			expect(name).not.toContain("ALLIANCE >" || "HUB >");
			expect(name === name.toUpperCase()).toBe(true);
		});
	});
});