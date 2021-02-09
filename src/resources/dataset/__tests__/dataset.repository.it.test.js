import dbHandler from '../../../config/in-memory-db';
import DatasetRepository from '../dataset.repository';
import { datasets } from '../__mocks__/datasets';
import { dataAccessRequests } from '../__mocks__/dataaccessreequests';

//const amendmentController = require('../amendment.controller');
//const amendmentModel = require('../amendment.model');

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
	await dbHandler.connect();
	await dbHandler.loadData({ tools: datasets, data_requests: dataAccessRequests });
});

/**
 * Revert to initial test data after every test.
 */
afterEach(async () => {
	await dbHandler.clearDatabase();
	await dbHandler.loadData({ tools: datasets });
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => await dbHandler.closeDatabase());

describe('DatasetRepository', function () {
	describe('getUser', () => {
		it('should return a dataset by a specified id', async function () {
			const datasetRepository = new DatasetRepository();
			const dataset = await datasetRepository.getDataset("dfb21b3b-7fd9-40c4-892e-810edd6dfc25");
			expect(dataset).toEqual(datasets[0]);
		});
	});
});
