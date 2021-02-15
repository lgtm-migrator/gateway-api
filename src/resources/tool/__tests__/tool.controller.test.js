import sinon from 'sinon';
import faker from 'faker';

import ToolController from '../v2/tool.controller';
import ToolService from '../v2/tool.service';

describe('ToolController', function () {
	beforeAll(() => {
		console.log = sinon.stub();
		console.error = sinon.stub();
	});

	describe('getTool', function () {
		let req, res, status, json, toolService, toolController;

		beforeEach(() => {
			status = sinon.stub();
			json = sinon.spy();
			res = { json, status };
			status.returns(res);
			toolService = new ToolService();
		});

		it('should return a tool that matches the id param', async function () {
			req = { params: { id: faker.random.number({ min: 1, max: 999999999 }) } };
			const stubValue = {
				id: req.params.id,
			};
			const serviceStub = sinon.stub(toolService, 'getTool').returns(stubValue);
			toolController = new ToolController(toolService);
			await toolController.getTool(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(200)).toBe(true);
			expect(json.calledWith({ success: true, data: stubValue })).toBe(true);
		});

		it('should return a bad request response if no tool id is provided', async function () {
			req = { params: {} };

			const serviceStub = sinon.stub(toolService, 'getTool').returns({});
			toolController = new ToolController(toolService);
			await toolController.getTool(req, res);

			expect(serviceStub.notCalled).toBe(true);
			expect(status.calledWith(400)).toBe(true);
			expect(json.calledWith({ success: false, message: 'You must provide a tool identifier' })).toBe(true);
		});

		it('should return a not found response if no tool could be found for the id provided', async function () {
			req = { params: { id: faker.random.number({ min: 1, max: 999999999 }) } };

			const serviceStub = sinon.stub(toolService, 'getTool').returns(null);
			toolController = new ToolController(toolService);
			await toolController.getTool(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(404)).toBe(true);
			expect(json.calledWith({ success: false, message: 'A tool could not be found with the provided id' })).toBe(true);
		});

		it('should return a server error if an unexpected exception occurs', async function () {
			req = { params: { id: faker.random.number({ min: 1, max: 999999999 }) } };

			const error = new Error('A server error occurred');
			const serviceStub = sinon.stub(toolService, 'getTool').throws(error);
			toolController = new ToolController(toolService);
			await toolController.getTool(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(500)).toBe(true);
			expect(json.calledWith({ success: false, message: 'A server error occurred, please try again' })).toBe(true);
		});
	});

	describe('getTools', function () {
		let req, res, status, json, toolService, toolController;
        req = { params: {} };

		beforeEach(() => {
			status = sinon.stub();
			json = sinon.spy();
			res = { json, status };
			status.returns(res);
			toolService = new ToolService();
		});

		it('should return an array of tools', async function () {
			const stubValue = [
				{
					id: faker.random.number({ min: 1, max: 999999999 }),
				},
				{
					id: faker.random.number({ min: 1, max: 999999999 }),
				},
			];
			const serviceStub = sinon.stub(toolService, 'getTools').returns(stubValue);
			toolController = new ToolController(toolService);
			await toolController.getTools(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(200)).toBe(true);
			expect(json.calledWith({ success: true, data: stubValue })).toBe(true);
		});

		it('should return a server error if an unexpected exception occurs', async function () {
			const error = new Error('A server error occurred');
			const serviceStub = sinon.stub(toolService, 'getTools').throws(error);
			toolController = new ToolController(toolService);
			await toolController.getTools(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(500)).toBe(true);
			expect(json.calledWith({ success: false, message: 'A server error occurred, please try again' })).toBe(true);
		});
	});
});
