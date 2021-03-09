import sinon from 'sinon';

import ProjectRepository from '../project.repository';
import { projectsStub } from '../__mocks__/projects';

describe('ProjectRepository', function () {
	describe('getProject', function () {
		it('should return a project by a specified id', async function () {
			const projectStub = projectsStub[0];
			const projectRepository = new ProjectRepository();
			const stub = sinon.stub(projectRepository, 'findOne').returns(projectStub);
			const project = await projectRepository.getProject(projectStub.id);

			expect(stub.calledOnce).toBe(true);

			expect(project.type).toEqual(projectStub.type);
			expect(project.id).toEqual(projectStub.id);
			expect(project.name).toEqual(projectStub.name);
			expect(project.description).toEqual(projectStub.description);
			expect(project.resultsInsights).toEqual(projectStub.resultsInsights);
			expect(project.projectid).toEqual(projectStub.projectid);
			expect(project.categories).toEqual(projectStub.categories);
			expect(project.license).toEqual(projectStub.license);
			expect(project.authors).toEqual(projectStub.authors);
			expect(project.activeflag).toEqual(projectStub.activeflag);
			expect(project.counter).toEqual(projectStub.counter);
			expect(project.discourseTopicId).toEqual(projectStub.discourseTopicId);
			expect(project.relatedObjects).toEqual(projectStub.relatedObjects);
			expect(project.uploader).toEqual(projectStub.uploader);
		});
	});

	describe('getProjects', function () {
		it('should return an array of projects', async function () {
			const projectRepository = new ProjectRepository();
			const stub = sinon.stub(projectRepository, 'find').returns(projectsStub);
			const projects = await projectRepository.getProjects();

			expect(stub.calledOnce).toBe(true);

			expect(projects.length).toBeGreaterThan(0);
		});
	});

	describe('findCountOf', function () {
		it('should return the number of documents found by a given query', async function () {
			const projectRepository = new ProjectRepository();
			const stub = sinon.stub(projectRepository, 'findCountOf').returns(1);
			const projectCount = await projectRepository.findCountOf({ name: 'Admitted Patient Care Project' });
			
			expect(stub.calledOnce).toBe(true);

			expect(projectCount).toEqual(1);
		});
	});
});