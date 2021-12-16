import dbHandler from '../../config/in-memory-db';
import datasetonboardingUtil from '../datasetonboarding.util';
import { datasetQuestionAnswersMocks, datasetv2ObjectMock, publisherDetailsMock } from '../__mocks__/datasetobjects';
import constants from '../../resources/utilities/constants.util';
import _ from 'lodash';

beforeAll(async () => {
	await dbHandler.connect();
	await dbHandler.loadData({ publishers: publisherDetailsMock });
});

afterAll(async () => await dbHandler.closeDatabase());

describe('Dataset onboarding utility', () => {
	describe('buildv2Object', () => {
		it('Should return a correctly formatted V2 object when supplied with questionAnswers', async () => {
			let datasetv2Object = await datasetonboardingUtil.buildv2Object({
				questionAnswers: datasetQuestionAnswersMocks,
				datasetVersion: '2.0.0',
				datasetv2: {
					summary: {
						publisher: {
							identifier: '5f3f98068af2ef61552e1d75',
						},
					},
				},
			});

			delete datasetv2Object.issued;
			delete datasetv2Object.modified;

			expect(datasetv2Object).toStrictEqual(datasetv2ObjectMock);
		});
	});

	describe('datasetv2ObjectComparison', () => {
		it('Should return a correctly formatted diff array', async () => {
			let datasetv2DiffObject = await datasetonboardingUtil.datasetv2ObjectComparison(
				{
					summary: { title: 'Title 2' },
					provenance: { temporal: { updated: 'ONCE WEEKLY', updatedDates: ['1/1/1'] } },
					observations: [
						{ observedNode: 'Obs2', observationDate: '3/3/3', measuredValue: '', disambiguatingDescription: '', measuredProperty: '' },
						{ observedNode: 'Obs3', observationDate: '4/4/4', measuredValue: '', disambiguatingDescription: '', measuredProperty: '' },
					],
				},
				{
					summary: { title: 'Title 1' },
					provenance: { temporal: { updated: 'TWICE WEEKLY', updatedDates: ['1/1/1', '2/2/2'] } },
					observations: [
						{ observedNode: 'Obs1', observationDate: '3/3/3', measuredValue: '', disambiguatingDescription: '', measuredProperty: '' },
					],
				}
			);

			const diffArray = [
				{ 'summary/title': { updatedAnswer: 'Title 2', previousAnswer: 'Title 1' } },
				{ 'provenance/temporal/updated': { updatedAnswer: 'ONCE WEEKLY', previousAnswer: 'TWICE WEEKLY' } },
				{ 'provenance/temporal/updatedDates': { updatedAnswer: '1/1/1', previousAnswer: '1/1/1, 2/2/2' } },
				{ 'observations/1/observedNode': { updatedAnswer: 'Obs2', previousAnswer: 'Obs1' } },
				{ 'observations/2/observedNode': { updatedAnswer: 'Obs3', previousAnswer: '' } },
				{ 'observations/2/observationDate': { updatedAnswer: '4/4/4', previousAnswer: '' } },
			];

			expect(datasetv2DiffObject).toStrictEqual(diffArray);
		});
	});

	// describe('datasetSortingHelper', () => {
	// 	test.each(Object.values(constants.datasetSortOptions))(
	// 		'Each sort option should lead to correctly sorted output arrays for ascending direction',
	// 		async sortOption => {
	// 			let datasetsStub = [
	// 				{
	// 					timestamps: { updated: 1234, created: 1234 },
	// 					name: 'abc',
	// 					percentageCompleted: { summary: 20 },
	// 					counter: 200,
	// 				},
	// 				{
	// 					timestamps: { updated: 5678, created: 5678 },
	// 					name: 'xyz',
	// 					percentageCompleted: { summary: 80 },
	// 					counter: 100,
	// 				},
	// 			];

	// 			let unsortedDatasetsStubCopy = _.cloneDeep(datasetsStub);

	// 			let sortedDatasets = await datasetonboardingUtil.datasetSortingHelper(
	// 				datasetsStub,
	// 				sortOption,
	// 				constants.datasetSortDirections.ASCENDING
	// 			);

	// 			if (sortOption === constants.datasetSortOptions.RECENTACTIVITY) {
	// 				let arr = sortedDatasets.map(dataset => dataset.timestamps.updated);
	// 				expect(arr[0]).toBeLessThan(arr[1]);
	// 			}

	// 			if (sortOption === constants.datasetSortOptions.ALPHABETIC) {
	// 				let arr = sortedDatasets.map(dataset => dataset.name);
	// 				expect(arr[0]).toEqual(unsortedDatasetsStubCopy[0].name);
	// 				expect(arr[1]).toEqual(unsortedDatasetsStubCopy[1].name);
	// 			}
	// 			if (sortOption === constants.datasetSortOptions.RECENTLYPUBLISHED) {
	// 				let arr = sortedDatasets.map(dataset => dataset.timestamps.created);
	// 				expect(arr[0]).toBeLessThan(arr[1]);
	// 			}
	// 			if (sortOption === constants.datasetSortOptions.METADATAQUALITY) {
	// 				let arr = sortedDatasets.map(dataset => dataset.percentageCompleted.summary);
	// 				expect(arr[0]).toBeLessThan(arr[1]);
	// 			}
	// 			if (sortOption === constants.datasetSortOptions.MOSTVIEWED) {
	// 				let arr = sortedDatasets.map(dataset => dataset.counter);
	// 				expect(arr[0]).toBeLessThan(arr[1]);
	// 			}
	// 		}
	// 	);

	// 	test.each(Object.values(constants.datasetSortOptions))(
	// 		'Each sort option should lead to correctly sorted output arrays for descending direction',
	// 		async sortOption => {
	// 			let datasetsStub = [
	// 				{
	// 					timestamps: { updated: 1234, created: 1234 },
	// 					name: 'abc',
	// 					percentageCompleted: { summary: 20 },
	// 					counter: 200,
	// 				},
	// 				{
	// 					timestamps: { updated: 5678, created: 5678 },
	// 					name: 'xyz',
	// 					percentageCompleted: { summary: 80 },
	// 					counter: 100,
	// 				},
	// 			];

	// 			let unsortedDatasetsStubCopy = _.cloneDeep(datasetsStub);

	// 			let sortedDatasets = await datasetonboardingUtil.datasetSortingHelper(
	// 				datasetsStub,
	// 				sortOption,
	// 				constants.datasetSortDirections.DESCENDING
	// 			);

	// 			if (sortOption === constants.datasetSortOptions.RECENTACTIVITY) {
	// 				let arr = sortedDatasets.map(dataset => dataset.timestamps.updated);
	// 				expect(arr[1]).toBeLessThan(arr[0]);
	// 			}

	// 			if (sortOption === constants.datasetSortOptions.ALPHABETIC) {
	// 				let arr = sortedDatasets.map(dataset => dataset.name);
	// 				expect(arr[0]).toEqual(unsortedDatasetsStubCopy[1].name);
	// 				expect(arr[1]).toEqual(unsortedDatasetsStubCopy[0].name);
	// 			}
	// 			if (sortOption === constants.datasetSortOptions.RECENTLYPUBLISHED) {
	// 				let arr = sortedDatasets.map(dataset => dataset.timestamps.created);
	// 				expect(arr[1]).toBeLessThan(arr[0]);
	// 			}
	// 			if (sortOption === constants.datasetSortOptions.METADATAQUALITY) {
	// 				let arr = sortedDatasets.map(dataset => dataset.percentageCompleted.summary);
	// 				expect(arr[1]).toBeLessThan(arr[0]);
	// 			}
	// 			if (sortOption === constants.datasetSortOptions.MOSTVIEWED) {
	// 				let arr = sortedDatasets.map(dataset => dataset.counter);
	// 				expect(arr[1]).toBeLessThan(arr[0]);
	// 			}
	// 		}
	// 	);
	// });
});
