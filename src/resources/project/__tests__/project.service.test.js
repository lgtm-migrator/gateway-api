import sinon from 'sinon';

import ProjectRepository from '../project.repository';
import ProjectService from '../project.service';
import { projectsStub } from '../__mocks__/projects';

describe('ProjectService', function () {
	describe('getProject', function () {
		it('should return a project by a specified id', async function () {
			const projectStub = projectsStub[0];
			const projectRepository = new ProjectRepository();
			const stub = sinon.stub(projectRepository, 'getProject').returns(projectStub);
			const projectService = new ProjectService(projectRepository);
			const project = await projectService.getProject(projectStub.id);

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
			const stub = sinon.stub(projectRepository, 'getProjects').returns(projectsStub);
			const projectService = new ProjectService(projectRepository);
			const projects = await projectService.getProjects();

			expect(stub.calledOnce).toBe(true);

			expect(projects.length).toBeGreaterThan(0);
		});
	});
});
