import sinon from 'sinon';

import DatasetRepository from '../dataset.repository';
import DatasetService from '../dataset.service';
import { datasetsStub } from '../__mocks__/datasets';

describe('DatasetService', function () {
	describe('getDataset', function () {
		it('should return a dataset by a specified id', async function () {
			const datasetStub = datasetsStub[0];
			const datasetRepository = new DatasetRepository();
			const stub = sinon.stub(datasetRepository, 'getDataset').returns(datasetStub);
			const datasetService = new DatasetService(datasetRepository);
			const dataset = await datasetService.getDataset(datasetStub.id);

			expect(stub.calledOnce).toBe(true);

			expect(dataset.datasetid).toEqual(datasetStub.datasetid);
			expect(dataset.type).toEqual(datasetStub.type);
			expect(dataset.id).toEqual(datasetStub.id);
			expect(dataset.name).toEqual(datasetStub.name);
			expect(dataset.description).toEqual(datasetStub.description);
			expect(dataset.resultsInsights).toEqual(datasetStub.resultsInsights);
			expect(dataset.datasetid).toEqual(datasetStub.datasetid);
			expect(dataset.categories).toEqual(datasetStub.categories);
			expect(dataset.license).toEqual(datasetStub.license);
			expect(dataset.authors).toEqual(datasetStub.authors);
			expect(dataset.activeflag).toEqual(datasetStub.activeflag);
			expect(dataset.counter).toEqual(datasetStub.counter);
			expect(dataset.discourseTopicId).toEqual(datasetStub.discourseTopicId);
			expect(dataset.relatedObjects).toEqual(datasetStub.relatedObjects);
			expect(dataset.uploader).toEqual(datasetStub.uploader);
			expect(dataset.pid).toEqual(datasetStub.pid);
			expect(dataset.datasetVersion).toEqual(datasetStub.datasetVersion);
			expect(dataset.datasetfields).toEqual(datasetStub.datasetfields);
			expect(dataset.datasetv2).toEqual(datasetStub.datasetv2);
		});

		it('should return a dataset by a specified id when a query parameter is passed as the second argument', async function () {
			const datasetStub = datasetsStub[0];
			const datasetRepository = new DatasetRepository();
			const stub = sinon.stub(datasetRepository, 'getDataset').returns(datasetStub);
			const datasetService = new DatasetService(datasetRepository);
			const dataset = await datasetService.getDataset(datasetStub.id, { expanded: false });

			expect(stub.calledOnce).toBe(true);

			expect(dataset.datasetid).toEqual(datasetStub.datasetid);
			expect(dataset.type).toEqual(datasetStub.type);
			expect(dataset.id).toEqual(datasetStub.id);
			expect(dataset.name).toEqual(datasetStub.name);
			expect(dataset.description).toEqual(datasetStub.description);
			expect(dataset.resultsInsights).toEqual(datasetStub.resultsInsights);
			expect(dataset.datasetid).toEqual(datasetStub.datasetid);
			expect(dataset.categories).toEqual(datasetStub.categories);
			expect(dataset.license).toEqual(datasetStub.license);
			expect(dataset.authors).toEqual(datasetStub.authors);
			expect(dataset.activeflag).toEqual(datasetStub.activeflag);
			expect(dataset.counter).toEqual(datasetStub.counter);
			expect(dataset.discourseTopicId).toEqual(datasetStub.discourseTopicId);
			expect(dataset.relatedObjects).toEqual(datasetStub.relatedObjects);
			expect(dataset.uploader).toEqual(datasetStub.uploader);
			expect(dataset.pid).toEqual(datasetStub.pid);
			expect(dataset.datasetVersion).toEqual(datasetStub.datasetVersion);
			expect(dataset.datasetfields).toEqual(datasetStub.datasetfields);
			expect(dataset.datasetv2).toEqual(datasetStub.datasetv2);
		});

		it('should return a dataset by a specified id when expanded', async function () {
			const datasetStub = datasetsStub[0];
			const datasetRepository = new DatasetRepository();
			const stub = sinon.stub(datasetRepository, 'getDataset').returns({ ...datasetStub, checkLatestVersion: () => true});
			const datasetService = new DatasetService(datasetRepository);
			const dataset = await datasetService.getDataset(datasetStub.id, { expanded: true });

			expect(stub.calledOnce).toBe(true);

			expect(dataset.datasetid).toEqual(datasetStub.datasetid);
			expect(dataset.type).toEqual(datasetStub.type);
			expect(dataset.id).toEqual(datasetStub.id);
			expect(dataset.name).toEqual(datasetStub.name);
			expect(dataset.description).toEqual(datasetStub.description);
			expect(dataset.resultsInsights).toEqual(datasetStub.resultsInsights);
			expect(dataset.datasetid).toEqual(datasetStub.datasetid);
			expect(dataset.categories).toEqual(datasetStub.categories);
			expect(dataset.license).toEqual(datasetStub.license);
			expect(dataset.authors).toEqual(datasetStub.authors);
			expect(dataset.activeflag).toEqual(datasetStub.activeflag);
			expect(dataset.counter).toEqual(datasetStub.counter);
			expect(dataset.discourseTopicId).toEqual(datasetStub.discourseTopicId);
			expect(dataset.relatedObjects).toEqual(datasetStub.relatedObjects);
			expect(dataset.uploader).toEqual(datasetStub.uploader);
			expect(dataset.pid).toEqual(datasetStub.pid);
			expect(dataset.datasetVersion).toEqual(datasetStub.datasetVersion);
			expect(dataset.datasetfields).toEqual(datasetStub.datasetfields);
			expect(dataset.datasetv2).toEqual(datasetStub.datasetv2);
		});
	});
	describe('getDatasets', function () {
		it('should return an array of datasets', async function () {
			const datasetRepository = new DatasetRepository();
			const stub = sinon.stub(datasetRepository, 'getDatasets').returns(datasetsStub);
			const datasetService = new DatasetService(datasetRepository);
			const datasets = await datasetService.getDatasets();

			expect(stub.calledOnce).toBe(true);

			expect(datasets.length).toBeGreaterThan(0);
		});
	});
});
