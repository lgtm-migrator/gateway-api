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

	describe('getDatasetRevisions', function () {
		it('should return an empty object if an invalid persistent identifier is passed', async function () {
			const datasetRepository = new DatasetRepository();
			const stub = sinon.stub(datasetRepository, 'find').returns({});

			const datasetRevisions = await datasetRepository.getDatasetRevisions(null);

			expect(stub.notCalled).toBe(true);
			expect(datasetRevisions).toEqual({});
		});
	});

	describe('getDatasetRevisions', function () {
		it('should return an object illustrating all versions of the dataset', async function () {
			const datasetRepository = new DatasetRepository();
			const stub = sinon
				.stub(datasetRepository, 'find')
				.returns(datasetsStub.filter(obj => obj.pid === '4ef841d3-5e86-4f92-883f-1015ffd4b979'));
			const datasetRevisions = await datasetRepository.getDatasetRevisions('4ef841d3-5e86-4f92-883f-1015ffd4b979');

			expect(stub.calledOnce).toBe(true);
			expect(datasetRevisions).toEqual({
				'0.0.1': 'dfb21b3b-7fd9-40c4-892e-810edd6dfc25',
				'1.0.0': '5b99795a-3db4-4020-a8f9-aa64bcc2c5f0',
				latest: '5b99795a-3db4-4020-a8f9-aa64bcc2c5f0',
			});
		});
		it('should return a default object if version information is missing from datasets', async function () {
			const filterDatasets = datasetsStub.filter(obj => obj.pid === '4ef841d3-5e86-4f92-883f-1015ffd4b979');
			filterDatasets.forEach(dataset => {
				delete dataset.datasetVersion;
				delete dataset.datasetid;
				delete dataset.activeflag;
			});
			const datasetRepository = new DatasetRepository();
			const stub = sinon.stub(datasetRepository, 'find').returns(filterDatasets);
			const datasetRevisions = await datasetRepository.getDatasetRevisions('4ef841d3-5e86-4f92-883f-1015ffd4b979');

			expect(stub.calledOnce).toBe(true);
			expect(datasetRevisions).toEqual({
				default: 'empty',
			});
		});
	});
});
