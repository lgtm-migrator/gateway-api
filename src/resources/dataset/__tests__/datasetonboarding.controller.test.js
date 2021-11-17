import dbHandler from '../../../config/in-memory-db';
import { getDatasetsByPublisher } from '../datasetonboarding.controller';
import { datasetSearchStub } from '../__mocks__/datasets';

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
		describe('An admin team user', () => {
			it('Should return the correct number of inReview datasets', async () => {
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

				expect(formattedDatasets.length).toEqual(3);
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
		describe('A publisher team user', () => {
			const statuses = ['active', 'inReview', 'draft', 'rejected', 'archive'];
			const sortOptions = [
				'recentActivityAsc',
				'recentActivityDesc',
				'alphabeticAsc',
				'alphabeticDesc',
				'recentlyPublishedAsc',
				'recentlyPublishedDesc',
				'metadataQualityAsc',
				'metadataQualityDesc',
			];

			test.each(statuses)(
				'Each should return the correct number of datasets for different statuses for a given publisher',
				async status => {
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

					if (status === 'active' || status === 'draft' || status === 'archive') {
						expect(formattedDatasets.length).toEqual(1);
					} else {
						expect(formattedDatasets.length).toEqual(2);
					}
				}
			);

			test.each(sortOptions)('Each response should be correctly formatted', async sortOption => {
				let res = mockedResponse();
				let req = mockedRequest();

				req.params = {
					publisherID: 'TestPublisher',
				};

				req.query = {
					search: '',
					datasetIndex: 0,
					maxResults: 10,
					datasetSort: sortOption,
					status: 'inReview',
				};

				const response = await getDatasetsByPublisher(req, res);

				const formattedDatasets = response.json.mock.calls[0][0].data.listOfDatasets;

				expect(formattedDatasets.length).toEqual(2);
			});
		});
	});
});
