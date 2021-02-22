import dbHandler from '../../../config/in-memory-db';
import DatasetRepository from '../dataset.repository';
import { datasetsStub } from '../__mocks__/datasets';
import { dataAccessRequests } from '../__mocks__/dataaccessreequests';

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
	await dbHandler.connect();
	await dbHandler.loadData({ tools: datasetsStub, data_requests: dataAccessRequests });
});

/**
 * Revert to initial test data after every test.
 */
afterEach(async () => {
	await dbHandler.clearDatabase();
	await dbHandler.loadData({ tools: datasetsStub, data_requests: dataAccessRequests });
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => await dbHandler.closeDatabase());

describe('DatasetRepository', function () {
	describe('getDataset', () => {
		it('should return a dataset by a specified id', async function () {
			const datasetRepository = new DatasetRepository();
			const dataset = await datasetRepository.getDataset({datasetid: "dfb21b3b-7fd9-40c4-892e-810edd6dfc25"});
			expect(dataset.toObject()).toEqual(datasetsStub[0]);
		});
	});

	describe('getDatasets', () => {
		it('should return an array of datasets', async function () {
			const datasetRepository = new DatasetRepository();
			const datasets = await datasetRepository.getDatasets();
			expect(datasets.length).toBeGreaterThan(0);
		});
	});
});
