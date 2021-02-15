import dbHandler from '../../../config/in-memory-db';
import ProjectRepository from '../project.repository';
import { projectsStub } from '../__mocks__/projects';

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
	await dbHandler.connect();
	await dbHandler.loadData({ tools: projectsStub });
});

/**
 * Revert to initial test data after every test.
 */
afterEach(async () => {
	await dbHandler.clearDatabase();
	await dbHandler.loadData({ tools: projectsStub });
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => await dbHandler.closeDatabase());

describe('ProjectRepository', function () {
	describe('getProject', () => {
		it('should return a project by a specified id', async function () {
			const projectRepository = new ProjectRepository();
			const project = await projectRepository.getProject(12234413426179104);
			expect(project).toEqual(projectsStub[0]);
		});
	});

	describe('getProjects', () => {
		it('should return an array of projects', async function () {
			const projectRepository = new ProjectRepository();
			const projects = await projectRepository.getProjects();
			expect(projects.length).toBeGreaterThan(0);
		});
	});
});
