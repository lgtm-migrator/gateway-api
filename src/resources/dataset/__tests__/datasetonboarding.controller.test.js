import dbHandler from '../../../config/in-memory-db';
import { getDatasetsByPublisher } from '../datasetonboarding.controller';
import { datasetSearchStub } from '../__mocks__/datasets';
import constants from '../../utilities/constants.util';

beforeAll(async () => {
	await dbHandler.connect();
	await dbHandler.loadData({ tools: datasetSearchStub });
});

afterAll(async () => await dbHandler.closeDatabase());

describe('Dataset onboarding controller', () => {
	const mockedRequest = () => {
		const req = {};
		return req;
	};

	const mockedResponse = () => {
		const res = {};
		res.status = jest.fn().mockReturnValue(res);
		res.json = jest.fn().mockReturnValue(res);
		return res;
	};
	describe('getDatasetsByPublisher', () => {
		describe('As an admin team user', () => {
			it('A search for inReview datasets should only return inReview datasets', async () => {
				let req = mockedRequest();
				let res = mockedResponse();

				req.params = {
					publisherID: 'admin',
				};

				req.query = {
					search: '',
					datasetIndex: 0,
					maxResults: 10,
					datasetSort: 'recentActivityAsc',
					status: 'inReview',
				};

				const response = await getDatasetsByPublisher(req, res);

				const formattedDatasets = response.json.mock.calls[0][0].data.listOfDatasets;

				formattedDatasets.forEach(dataset => {
					expect(dataset.activeflag).toEqual('inReview');
				});
			});

			it('Should return the correct number of inReview datasets with a search parameter', async () => {
				let req = mockedRequest();
				let res = mockedResponse();

				req.params = {
					publisherID: 'admin',
				};

				req.query = {
					search: 'abstract3',
					datasetIndex: 0,
					maxResults: 10,
					datasetSort: 'recentActivityAsc',
					status: 'inReview',
				};

				const response = await getDatasetsByPublisher(req, res);

				const formattedDatasets = response.json.mock.calls[0][0].data.listOfDatasets;

				expect(formattedDatasets.length).toEqual(1);
			});
		});
		describe('As a publisher team user', () => {
			const statuses = ['active', 'inReview', 'draft', 'rejected', 'archive'];
			const sortOptions = constants.datasetSortOptions;

			test.each(statuses)('Each status should only return datasets with the supplied status', async status => {
				let res = mockedResponse();
				let req = mockedRequest();

				req.params = {
					publisherID: 'TestPublisher',
				};

				req.query = {
					search: '',
					datasetIndex: 0,
					maxResults: 10,
					datasetSort: 'recentActivityAsc',
					status: status,
				};

				const response = await getDatasetsByPublisher(req, res);

				const formattedDatasets = response.json.mock.calls[0][0].data.listOfDatasets;

				formattedDatasets.forEach(dataset => {
					expect(dataset.activeflag).toEqual(status);
				});
			});

			test.each(Object.keys(sortOptions))('Each sort option should lead to correctly sorted results', async sortOption => {
				let res = mockedResponse();
				let req = mockedRequest();

				req.params = {
					publisherID: 'TestPublisher',
				};

				req.query = {
					search: '',
					datasetIndex: 0,
					maxResults: 10,
					datasetSort: sortOptions[sortOption],
					status: 'inReview',
				};

				const response = await getDatasetsByPublisher(req, res);

				const formattedDatasets = response.json.mock.calls[0][0].data.listOfDatasets;

				if (sortOption.key === 'recentActivityAsc') {
					let arr = formattedDatasets.map(dataset => dataset.timestamps.updated);
					expect(arr[0]).toBeLessThan(arr[1]);
				}
				if (sortOption === 'recentActivityDesc') {
					let arr = formattedDatasets.map(dataset => dataset.timestamps.updated);
					expect(arr[0]).toBeGreaterThan(arr[1]);
				}
				if (sortOption === 'alphabeticAsc') {
					let arr = formattedDatasets.map(dataset => dataset.name);
					expect(arr[0]).toEqual('A test1 v2');
					expect(arr[1]).toEqual('B test2 v1');
				}
				if (sortOption === 'alphabeticDesc') {
					let arr = formattedDatasets.map(dataset => dataset.name);
					expect(arr[1]).toEqual('A test1 v2');
					expect(arr[0]).toEqual('B test2 v1');
				}
				if (sortOption === 'recentlyPublishedAsc') {
					let arr = formattedDatasets.map(dataset => dataset.timestamps.created);
					expect(arr[0]).toBeLessThan(arr[1]);
				}
				if (sortOption === 'recentlyPublishedDesc') {
					let arr = formattedDatasets.map(dataset => dataset.timestamps.created);
					expect(arr[0]).toBeGreaterThan(arr[1]);
				}
				if (sortOption === 'metadataQualityAsc') {
					let arr = formattedDatasets.map(dataset => dataset.percentageCompleted.summary);
					expect(arr[0]).toBeLessThan(arr[1]);
				}
				if (sortOption === 'metadataQualityDesc') {
					let arr = formattedDatasets.map(dataset => dataset.percentageCompleted.summary);
					expect(arr[0]).toBeGreaterThan(arr[1]);
				}
			});
		});
	});
});
