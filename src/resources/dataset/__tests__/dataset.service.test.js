import sinon from 'sinon';

import DatasetRepository from '../dataset.repository';
import PaperRepository from '../../paper/paper.repository';
import ProjectRepository from '../../project/project.repository';
import ToolRepository from '../../tool/v2/tool.repository';
import CourseRepository from '../../course/v2/course.repository';
import DatasetService from '../dataset.service';
import { datasetsStub, v2DatasetsStub } from '../__mocks__/datasets';
import DatasetClass from '../dataset.entity';

describe('DatasetService', function () {
	describe('getDataset', function () {
		it('returns the matching dataset, when a valid dataset identifier for an existing dataset is provided', async function () {
			// Fixtures
			const datasetStub = new DatasetClass(datasetsStub[0]);

			// Dependencies
			const datasetRepository = new DatasetRepository();
			const datasetService = new DatasetService(datasetRepository);

			// Stubs
			const getDatasetStub = sinon.stub(datasetRepository, 'getDataset').returns(datasetStub);

			const getDatasetRevisionsStub = sinon.stub(datasetRepository, 'getDatasetRevisions').returns({
				'0.0.1': '92f668ee-5ae8-4fb4-8755-4639fe100fde',
				'1.0.0': '5b99795a-3db4-4020-a8f9-aa64bcc2c5f0',
				latest: '5b99795a-3db4-4020-a8f9-aa64bcc2c5f0',
			});

			const getRelatedObjectsStub = sinon.stub(datasetService, 'getRelatedObjects').returns([
				{
					_id: '6032412570f7ff0299a5b7c6',
					objectId: '7527250949367925',
					objectType: 'project',
					user: 'Example user',
					updated: '17 Feb 2021',
				},
			]);

			// Act
			const v2DatasetObj = await datasetService.getDataset(datasetStub.id);

			// Assert
			expect(getDatasetStub.calledOnce).toBe(true);
			expect(getDatasetRevisionsStub.calledOnce).toBe(true);
			expect(getRelatedObjectsStub.calledOnce).toBe(true);
			expect(v2DatasetObj.dataset.id).toEqual(datasetStub.datasetid);
		});

		it('returns the matching dataset, when a valid dataset identifier and query parameter is passed for an existing dataset', async function () {
			// Fixtures
			const datasetStub = new DatasetClass(datasetsStub[0]);

			// Dependencies
			const datasetRepository = new DatasetRepository();
			const datasetService = new DatasetService(datasetRepository);

			// Stubs
			const getDatasetStub = sinon.stub(datasetRepository, 'getDataset').returns(datasetStub);

			const getDatasetRevisionsStub = sinon.stub(datasetRepository, 'getDatasetRevisions').returns({
				'0.0.1': '92f668ee-5ae8-4fb4-8755-4639fe100fde',
				'1.0.0': '5b99795a-3db4-4020-a8f9-aa64bcc2c5f0',
				latest: '5b99795a-3db4-4020-a8f9-aa64bcc2c5f0',
			});

			const getRelatedObjectsStub = sinon.stub(datasetService, 'getRelatedObjects').returns([
				{
					_id: '6032412570f7ff0299a5b7c6',
					objectId: '7527250949367925',
					objectType: 'project',
					user: 'Example user',
					updated: '17 Feb 2021',
				},
			]);

			// Act
			const v2DatasetObj = await datasetService.getDataset(datasetStub.id, { activeflag: 'active' });

			// Assert
			expect(getDatasetStub.calledOnce).toBe(true);
			expect(getDatasetRevisionsStub.calledOnce).toBe(true);
			expect(getRelatedObjectsStub.calledOnce).toBe(true);
			expect(v2DatasetObj.dataset.id).toEqual(datasetStub.datasetid);
		});

		it('returns the raw dataset in database format if the raw query parameter is passed', async function () {
			// Fixtures
			const datasetStub = new DatasetClass(datasetsStub[0]);

			// Dependencies
			const datasetRepository = new DatasetRepository();
			const datasetService = new DatasetService(datasetRepository);

			// Stubs
			const getDatasetStub = sinon.stub(datasetRepository, 'getDataset').returns(datasetStub);

			const getDatasetRevisionsStub = sinon.stub(datasetRepository, 'getDatasetRevisions').returns({
				'0.0.1': '92f668ee-5ae8-4fb4-8755-4639fe100fde',
				'1.0.0': '5b99795a-3db4-4020-a8f9-aa64bcc2c5f0',
				latest: '5b99795a-3db4-4020-a8f9-aa64bcc2c5f0',
			});

			const getRelatedObjectsStub = sinon.stub(datasetService, 'getRelatedObjects').returns([
				{
					_id: '6032412570f7ff0299a5b7c6',
					objectId: '7527250949367925',
					objectType: 'project',
					user: 'Example user',
					updated: '17 Feb 2021',
				},
			]);

			// Spies
			const toV2FormatSpy = sinon.spy(datasetStub.toV2Format);
			const reformatTechnicalDetails = sinon.spy(datasetService.reformatTechnicalDetails);

			// Act
			const dataset = await datasetService.getDataset(datasetStub.id, { activeflag: 'active', raw: true });

			// Assert
			expect(getDatasetStub.calledOnce).toBe(true);
			expect(getDatasetRevisionsStub.calledOnce).toBe(true);
			expect(getRelatedObjectsStub.calledOnce).toBe(true);
			expect(toV2FormatSpy.notCalled).toBe(true);
			expect(reformatTechnicalDetails.notCalled).toBe(true);
			expect(dataset.datasetid).toEqual(datasetStub.datasetid);
		});

		it('returns nothing when an invalid dataset identifier is passed', async function () {
			// Dependencies
			const datasetRepository = new DatasetRepository();
			const datasetService = new DatasetService(datasetRepository);

			// Stubs
			const getDatasetStub = sinon.stub(datasetRepository, 'getDataset').returns(null);

			// Act
			const dataset = await datasetService.getDataset(12345);

			// Assert
			expect(getDatasetStub.calledOnce).toBe(true);
			expect(dataset).toBeUndefined();
		});

		it('returns nothing and does not attempt a database call when no dataset identifier is passed', async function () {
			// Dependencies
			const datasetRepository = new DatasetRepository();
			const datasetService = new DatasetService(datasetRepository);

			// Stubs
			const getDatasetStub = sinon.stub(datasetRepository, 'getDataset').returns(null);

			// Act
			const dataset = await datasetService.getDataset(null);

			// Assert
			expect(getDatasetStub.notCalled).toBe(true);
			expect(dataset).toBeUndefined();
		});
	});
	describe('getDatasets', function () {
		it('returns an array of datasets', async function () {
			// Dependencies
			const datasetRepository = new DatasetRepository();
			const datasetService = new DatasetService(datasetRepository);

			// Stubs
			const stub = sinon.stub(datasetRepository, 'getDatasets').returns(datasetsStub);

			// Act
			const datasets = await datasetService.getDatasets();

			// Assert
			expect(stub.calledOnce).toBe(true);
			expect(datasets.length).toBeGreaterThan(0);
		});
	});
	describe('reformatTechnicalDetails', function () {
		it('returns a dataset object with structural metadata formatted for version two schema', async function () {
			// Fixtures
			const datasetStub = new DatasetClass(v2DatasetsStub[0]);

			// Dependencies
			const datasetRepository = new DatasetRepository();
			const datasetService = new DatasetService(datasetRepository);

			// Act
			const formattedDataset = datasetService.reformatTechnicalDetails(datasetStub);

			// Assert
			expect(formattedDataset.structuralMetadata).toEqual({
				structuralMetadataCount: {},
				dataClasses: [
					{
						id: '857a5ee0-196c-4247-9b95-5b1aed70fea1',
						description: "This class was created from the White Rabbit profile data in 'Demography_Current.csv'",
						name: 'Demography_Current.csv',
						dataElementsCount: 2,
						dataElements: [
							{
								id: 'd90bd4c2-df71-438c-879a-fe159e651517',
								description: null,
								name: 'current_gp_accept_date',
								type: 'PrimitiveType',
							},
							{
								id: '907a641c-86c4-4a95-adc4-3c2bbea35f59',
								description: null,
								name: 'anon_date_of_birth',
								type: 'PrimitiveType',
							},
						],
					},
				],
			});
		});
		it('returns a dataset object unmodified if no structural metadata data classes are present', async function () {
			// Fixtures
			const datasetStub = new DatasetClass(v2DatasetsStub[1]);

			// Dependencies
			const datasetRepository = new DatasetRepository();
			const datasetService = new DatasetService(datasetRepository);

			// Act
			const formattedDataset = datasetService.reformatTechnicalDetails(datasetStub);

			// Assert
			expect(formattedDataset).toEqual(datasetStub);
		});
		it('returns a dataset object unmodified if no technical details are present', async function () {
			// Fixtures
			const datasetStub = new DatasetClass(datasetsStub[0]);

			// Dependencies
			const datasetRepository = new DatasetRepository();
			const datasetService = new DatasetService(datasetRepository);

			// Act
			const formattedDataset = datasetService.reformatTechnicalDetails(datasetStub);

			// Assert
			expect(formattedDataset).toEqual(datasetStub);
		});
	});
	describe('getRelatedObjects', function () {
		it('returns an empty array if no persistent identifier is provided', async function () {
			// Fixtures
			const datasetStub = new DatasetClass(datasetsStub[0]);

			// Dependencies
			const datasetRepository = new DatasetRepository();
			const datasetService = new DatasetService(datasetRepository);

			// Act
			const relatedObjects = await datasetService.getRelatedObjects(null);

			// Assert
			expect(relatedObjects).toEqual({});
		});
		it('returns an empty array if no related objects are found', async function () {
			// Fixtures
			const datasetStub = new DatasetClass(datasetsStub[0]);

			// Dependencies
			const datasetRepository = new DatasetRepository();
			const paperRepository = new PaperRepository();
			const projectRepository = new ProjectRepository();
			const toolRepository = new ToolRepository();
			const courseRepository = new CourseRepository();
			const datasetService = new DatasetService(datasetRepository, paperRepository, projectRepository, toolRepository, courseRepository);

			// Stubs
			const getRelatedPapersStub = sinon.stub(paperRepository, 'find').returns([]);
			const getRelatedProjectsStub = sinon.stub(projectRepository, 'find').returns([]);
			const getRelatedToolsStub = sinon.stub(toolRepository, 'find').returns([]);
			const getRelatedCoursesStub = sinon.stub(courseRepository, 'find').returns([]);

			// Act
			const relatedObjects = await datasetService.getRelatedObjects(datasetStub.pid);

			// Assert
			expect(getRelatedPapersStub.calledOnce).toBe(true);
			expect(getRelatedProjectsStub.calledOnce).toBe(true);
			expect(getRelatedToolsStub.calledOnce).toBe(true);
			expect(getRelatedCoursesStub.calledOnce).toBe(true);
			expect(relatedObjects).toEqual([]);
		});
		it('returns an array of related objects by searching other entity repositories for relationships', async function () {
			// Fixtures
			const datasetStub = new DatasetClass(datasetsStub[0]);

			// Dependencies
			const datasetRepository = new DatasetRepository();
			const paperRepository = new PaperRepository();
			const projectRepository = new ProjectRepository();
			const toolRepository = new ToolRepository();
			const courseRepository = new CourseRepository();
			const datasetService = new DatasetService(datasetRepository, paperRepository, projectRepository, toolRepository, courseRepository);

			// Stubs
			const getRelatedPapersStub = sinon.stub(paperRepository, 'find').returns([
				{
					id: 1,
					type: 'paper',
					relatedObjects: [
						{
							pid: '4ef841d3-5e86-4f92-883f-1015ffd4b979',
							reason: 'definition of paper relationship',
							user: 'John Smith',
							updated: '01/02/2020',
						},
					]
				}
			]);

			const getRelatedProjectsStub = sinon.stub(projectRepository, 'find').returns([
				{
					id: 2,
					type: 'project',
					relatedObjects: [
						{
							pid: '4ef841d3-5e86-4f92-883f-1015ffd4b979',
							reason: 'definition of project relationship',
							user: 'Steve Smith',
							updated: '02/03/2020',
						},
					],
				},
			]);

			const getRelatedToolsStub = sinon.stub(toolRepository, 'find').returns([
				{
					id: 3,
					type: 'tool',
					relatedObjects: [
						{
							pid: '4ef841d3-5e86-4f92-883f-1015ffd4b979',
							reason: 'definition of tool relationship',
							user: 'Linda Smith',
							updated: '03/04/2020',
						},
					],
				},
			]);

			const getRelatedCoursesStub = sinon.stub(courseRepository, 'find').returns([
				{
					id: 4,
					type: 'course',
					relatedObjects: [
						{
							pid: '4ef841d3-5e86-4f92-883f-1015ffd4b979',
							reason: 'definition of course relationship',
							user: 'Caroline Smith',
							updated: '04/05/2020',
						},
					],
				},
			]);

			// Act
			const relatedObjects = await datasetService.getRelatedObjects(datasetStub.pid);

			// Assert
			expect(getRelatedPapersStub.calledOnce).toBe(true);
			expect(getRelatedProjectsStub.calledOnce).toBe(true);
			expect(getRelatedToolsStub.calledOnce).toBe(true);
			expect(getRelatedCoursesStub.calledOnce).toBe(true);
			expect(relatedObjects).toContainEqual({
				objectId: 1,
				reason: 'definition of paper relationship',
				objectType: 'paper',
				user: 'John Smith',
				updated: '01/02/2020',
			});
			expect(relatedObjects).toContainEqual({
				objectId: 2,
				reason: 'definition of project relationship',
				objectType: 'project',
				user: 'Steve Smith',
				updated: '02/03/2020',
			});
			expect(relatedObjects).toContainEqual({
				objectId: 3,
				reason: 'definition of tool relationship',
				objectType: 'tool',
				user: 'Linda Smith',
				updated: '03/04/2020',
			});
			expect(relatedObjects).toContainEqual({
				objectId: 4,
				reason: 'definition of course relationship',
				objectType: 'course',
				user: 'Caroline Smith',
				updated: '04/05/2020',
			});
		});
	});
});
