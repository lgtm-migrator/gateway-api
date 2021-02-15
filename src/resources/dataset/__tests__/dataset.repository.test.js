import sinon from 'sinon';

import DatasetRepository from '../dataset.repository';
import { datasetsStub } from '../__mocks__/datasets';

describe('DatasetRepository', function () {
	describe('getDataset', function () {
		it('should return a dataset by a specified id', async function () {
			const datasetStub = datasetsStub[0];
			const datasetRepository = new DatasetRepository();
			const stub = sinon.stub(datasetRepository, 'findOne').returns(datasetStub);
			const dataset = await datasetRepository.getDataset(datasetStub.id);

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
			const stub = sinon.stub(datasetRepository, 'find').returns(datasetsStub);
			const datasets = await datasetRepository.getDatasets();

			expect(stub.calledOnce).toBe(true);

			expect(datasets.length).toBeGreaterThan(0);
		});
	});

	describe('findCountOf', function () {
		it('should return the number of documents found by a given query', async function () {
			const datasetRepository = new DatasetRepository();
			const stub = sinon.stub(datasetRepository, 'findCountOf').returns(1);
			const datasetCount = await datasetRepository.findCountOf({ name: 'Admitted Patient Care Dataset' });

			expect(stub.calledOnce).toBe(true);

			expect(datasetCount).toEqual(1);
		});
	});
});