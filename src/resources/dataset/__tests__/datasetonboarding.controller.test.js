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
					sortBy: 'recentActivity',
					sortDirection: 'asc',
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
					sortBy: 'recentActivity',
					sortDirection: 'asc',
					status: 'inReview',
				};

				const response = await getDatasetsByPublisher(req, res);

				const formattedDatasets = response.json.mock.calls[0][0].data.listOfDatasets;

				expect(formattedDatasets.length).toEqual(1);
			});
		});
		describe('As a publisher team user', () => {
			const statuses = Object.values(constants.datatsetStatuses);

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
					sortBy: 'recentActivity',
					sortDirection: 'asc',
					status: status,
				};

				const response = await getDatasetsByPublisher(req, res);

				const formattedDatasets = response.json.mock.calls[0][0].data.listOfDatasets;

				formattedDatasets.forEach(dataset => {
					expect(dataset.activeflag).toEqual(status);
				});
			});

			it('Should return the correct counts', async () => {
				let req = mockedRequest();
				let res = mockedResponse();

				req.params = {
					publisherID: 'TestPublisher',
				};

				req.query = {
					search: '',
					datasetIndex: 0,
					maxResults: 10,
					sortBy: 'recentActivity',
					sortDirection: 'asc',
					status: 'inReview',
				};

				const response = await getDatasetsByPublisher(req, res);

				const counts = response.json.mock.calls[0][0].data.counts;

				Object.keys(counts).forEach(status => {
					expect(counts[status]).toBeGreaterThan(0);
				});
			});

			it('Should return all dataset activeflag types if no status parameter is supplied', async () => {
				let req = mockedRequest();
				let res = mockedResponse();

				req.params = {
					publisherID: 'TestPublisher',
				};

				req.query = {
					search: '',
					datasetIndex: 0,
					maxResults: 10,
					sortBy: 'recentActivity',
					sortDirection: 'asc',
				};

				const expectedResponse = datasetSearchStub
					.filter(dataset => dataset.datasetv2.summary.publisher.identifier === 'TestPublisher')
					.map(dataset => dataset.activeflag);

				const response = await getDatasetsByPublisher(req, res);

				const formattedDatasets = response.json.mock.calls[0][0].data.listOfDatasets;

				expect([...new Set(formattedDatasets.map(dataset => dataset.activeflag))]).toEqual([...new Set(expectedResponse)]);
			});
		});
	});
});
