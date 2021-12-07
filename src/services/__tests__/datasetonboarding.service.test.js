import dbHandler from '../../config/in-memory-db';
import { datasetSearchStub } from '../__mocks__/datasetSearchStub';
import constants from '../../resources/utilities/constants.util';
import datasetOnboardingService from '../../services/datasetonboarding.service';

beforeAll(async () => {
	await dbHandler.connect();
	await dbHandler.loadData({ tools: datasetSearchStub });
});

afterAll(async () => await dbHandler.closeDatabase());

describe('datasetOnboardingService', () => {
	const datasetonboardingService = new datasetOnboardingService();

	describe('getDatasetsByPublisher', () => {
		describe('As an admin team user', () => {
			it('only inReview datasets should be returned when no status parameter is given', async () => {
				const publisherID = 'admin';
				const search = '';
				const datasetIndex = 0;
				const maxResults = 10;
				const sortBy = 'latest';
				const sortDirection = 'asc';
				const status = null;

				const [versionedDatasets, count, pageCount] = await datasetonboardingService.getDatasetsByPublisher(
					status,
					publisherID,
					datasetIndex,
					maxResults,
					sortBy,
					sortDirection,
					search
				);

				console.log(versionedDatasets, count, pageCount);
				// 		console.log(versionDatasets, count, pageCount);
				// 	});

				// 	it('Should return the correct number of inReview datasets with a search parameter', async () => {
				// 		let req = mockedRequest();
				// 		let res = mockedResponse();

				// 		req.params = {
				// 			publisherID: 'admin',
				// 		};

				// 		req.query = {
				// 			search: 'abstract3',
				// 			datasetIndex: 0,
				// 			maxResults: 10,
				// 			sortBy: 'latest',
				// 			sortDirection: 'asc',
				// 			status: 'inReview',
				// 		};

				// 		const response = await datasetonboardingController.getDatasetsByPublisher(req, res);

				// 		const formattedDatasets = response.json.mock.calls[0][0].data.results.listOfDatasets;

				// 		expect(formattedDatasets.length).toEqual(1);
				// 	});
				// });
				// describe('As a publisher team user', () => {
				// 	const statuses = Object.values(constants.datasetStatuses);

				// 	test.each(statuses)('Each status should only return datasets with the supplied status', async status => {
				// 		let res = mockedResponse();
				// 		let req = mockedRequest();

				// 		req.params = {
				// 			publisherID: 'TestPublisher',
				// 		};

				// 		req.query = {
				// 			search: '',
				// 			datasetIndex: 0,
				// 			maxResults: 10,
				// 			sortBy: 'latest',
				// 			sortDirection: 'asc',
				// 			status: status,
				// 		};

				// 		const response = await datasetonboardingController.getDatasetsByPublisher(req, res);

				// 		const formattedDatasets = response.json.mock.calls[0][0].data.results.listOfDatasets;

				// 		formattedDatasets.forEach(dataset => {
				// 			expect(dataset.activeflag).toEqual(status);
				// 		});
				// 	});

				// 	it('Should return the correct counts', async () => {
				// 		let req = mockedRequest();
				// 		let res = mockedResponse();

				// 		req.params = {
				// 			publisherID: 'TestPublisher',
				// 		};

				// 		req.query = {
				// 			search: '',
				// 			datasetIndex: 0,
				// 			maxResults: 10,
				// 			sortBy: 'latest',
				// 			sortDirection: 'asc',
				// 			status: 'inReview',
				// 		};

				// 		const response = await datasetonboardingController.getDatasetsByPublisher(req, res);

				// 		const counts = response.json.mock.calls[0][0].data.publisherTotals;

				// 		Object.keys(counts).forEach(status => {
				// 			expect(counts[status]).toBeGreaterThan(0);
				// 		});
				// 	});

				// 	it('Should return all dataset activeflag types if no status parameter is supplied', async () => {
				// 		let req = mockedRequest();
				// 		let res = mockedResponse();

				// 		req.params = {
				// 			publisherID: 'TestPublisher',
				// 		};

				// 		req.query = {
				// 			search: '',
				// 			datasetIndex: 0,
				// 			maxResults: 10,
				// 			sortBy: 'latest',
				// 			sortDirection: 'asc',
				// 		};

				// 		const expectedResponse = datasetSearchStub
				// 			.filter(dataset => dataset.datasetv2.summary.publisher.identifier === 'TestPublisher')
				// 			.map(dataset => dataset.activeflag);

				// 		const response = await datasetonboardingController.getDatasetsByPublisher(req, res);

				// 		const formattedDatasets = response.json.mock.calls[0][0].data.results.listOfDatasets;

				// 		expect([...new Set(formattedDatasets.map(dataset => dataset.activeflag))]).toEqual([...new Set(expectedResponse)]);
				// 	});

				// 	it('Should return the correct count matching the supplied query parameters', async () => {
				// 		let req = mockedRequest();
				// 		let res = mockedResponse();

				// 		req.params = {
				// 			publisherID: 'TestPublisher',
				// 		};

				// 		req.query = {
				// 			search: '',
				// 			datasetIndex: 0,
				// 			maxResults: 10,
				// 			sortBy: 'latest',
				// 			sortDirection: 'asc',
				// 			status: 'inReview',
				// 		};

				// 		const response = await datasetonboardingController.getDatasetsByPublisher(req, res);

				// 		const counts = response.json.mock.calls[0][0].data.results.total;

				// 		expect(counts).toBeGreaterThan(0);
			});
		});
	});
});
