import sinon from 'sinon';
import faker from 'faker';

import ProjectController from '../project.controller';
import ProjectService from '../project.service';

describe('ProjectController', function () {
	beforeAll(() => {
		console.log = sinon.stub();
		console.error = sinon.stub();
	});

	describe('getProject', function () {
		let req, res, status, json, projectService, projectController;

		beforeEach(() => {
			status = sinon.stub();
			json = sinon.spy();
			res = { json, status };
			status.returns(res);
			projectService = new ProjectService();
		});

		it('should return a project that matches the id param', async function () {
			req = { params: { id: faker.random.number({ min: 1, max: 999999999 }) } };
			const stubValue = {
				id: req.params.id,
			};
			const serviceStub = sinon.stub(projectService, 'getProject').returns(stubValue);
			projectController = new ProjectController(projectService);
			await projectController.getProject(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(200)).toBe(true);
			expect(json.calledWith({ success: true, data: stubValue })).toBe(true);
		});

		it('should return a bad request response if no project id is provided', async function () {
			req = { params: {} };

			const serviceStub = sinon.stub(projectService, 'getProject').returns({});
			projectController = new ProjectController(projectService);
			await projectController.getProject(req, res);

			expect(serviceStub.notCalled).toBe(true);
			expect(status.calledWith(400)).toBe(true);
			expect(json.calledWith({ success: false, message: 'You must provide a project identifier' })).toBe(true);
		});

		it('should return a not found response if no project could be found for the id provided', async function () {
			req = { params: { id: faker.random.number({ min: 1, max: 999999999 }) } };

			const serviceStub = sinon.stub(projectService, 'getProject').returns(null);
			projectController = new ProjectController(projectService);
			await projectController.getProject(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(404)).toBe(true);
			expect(json.calledWith({ success: false, message: 'A project could not be found with the provided id' })).toBe(true);
		});

		it('should return a server error if an unexpected exception occurs', async function () {
			req = { params: { id: faker.random.number({ min: 1, max: 999999999 }) } };

			const error = new Error('A server error occurred');
			const serviceStub = sinon.stub(projectService, 'getProject').throws(error);
			projectController = new ProjectController(projectService);
			await projectController.getProject(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(500)).toBe(true);
			expect(json.calledWith({ success: false, message: 'A server error occurred, please try again' })).toBe(true);
		});
	});

	describe('getProjects', function () {
		let req, res, status, json, projectService, projectController;
        req = { params: {} };

		beforeEach(() => {
			status = sinon.stub();
			json = sinon.spy();
			res = { json, status };
			status.returns(res);
			projectService = new ProjectService();
		});

		it('should return an array of projects', async function () {
			const stubValue = [
				{
					id: faker.random.number({ min: 1, max: 999999999 }),
				},
				{
					id: faker.random.number({ min: 1, max: 999999999 }),
				},
			];
			const serviceStub = sinon.stub(projectService, 'getProjects').returns(stubValue);
			projectController = new ProjectController(projectService);
			await projectController.getProjects(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(200)).toBe(true);
			expect(json.calledWith({ success: true, data: stubValue })).toBe(true);
		});

		it('should return a server error if an unexpected exception occurs', async function () {
			const error = new Error('A server error occurred');
			const serviceStub = sinon.stub(projectService, 'getProjects').throws(error);
			projectController = new ProjectController(projectService);
			await projectController.getProjects(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(500)).toBe(true);
			expect(json.calledWith({ success: false, message: 'A server error occurred, please try again' })).toBe(true);
		});
	});
});
