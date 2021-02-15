import sinon from 'sinon';
import faker from 'faker';

import PaperController from '../paper.controller';
import PaperService from '../paper.service';

describe('PaperController', function () {
	beforeAll(() => {
		console.log = sinon.stub();
		console.error = sinon.stub();
	});

	describe('getPaper', function () {
		let req, res, status, json, paperService, paperController;

		beforeEach(() => {
			status = sinon.stub();
			json = sinon.spy();
			res = { json, status };
			status.returns(res);
			paperService = new PaperService();
		});

		it('should return a paper that matches the id param', async function () {
			req = { params: { id: faker.random.number({ min: 1, max: 999999999 }) } };
			const stubValue = {
				id: req.params.id,
			};
			const serviceStub = sinon.stub(paperService, 'getPaper').returns(stubValue);
			paperController = new PaperController(paperService);
			await paperController.getPaper(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(200)).toBe(true);
			expect(json.calledWith({ success: true, data: stubValue })).toBe(true);
		});

		it('should return a bad request response if no paper id is provided', async function () {
			req = { params: {} };

			const serviceStub = sinon.stub(paperService, 'getPaper').returns({});
			paperController = new PaperController(paperService);
			await paperController.getPaper(req, res);

			expect(serviceStub.notCalled).toBe(true);
			expect(status.calledWith(400)).toBe(true);
			expect(json.calledWith({ success: false, message: 'You must provide a paper identifier' })).toBe(true);
		});

		it('should return a not found response if no paper could be found for the id provided', async function () {
			req = { params: { id: faker.random.number({ min: 1, max: 999999999 }) } };

			const serviceStub = sinon.stub(paperService, 'getPaper').returns(null);
			paperController = new PaperController(paperService);
			await paperController.getPaper(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(404)).toBe(true);
			expect(json.calledWith({ success: false, message: 'A paper could not be found with the provided id' })).toBe(true);
		});

		it('should return a server error if an unexpected exception occurs', async function () {
			req = { params: { id: faker.random.number({ min: 1, max: 999999999 }) } };

			const error = new Error('A server error occurred');
			const serviceStub = sinon.stub(paperService, 'getPaper').throws(error);
			paperController = new PaperController(paperService);
			await paperController.getPaper(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(500)).toBe(true);
			expect(json.calledWith({ success: false, message: 'A server error occurred, please try again' })).toBe(true);
		});
	});

	describe('getPapers', function () {
		let req, res, status, json, paperService, paperController;
        req = { params: {} };

		beforeEach(() => {
			status = sinon.stub();
			json = sinon.spy();
			res = { json, status };
			status.returns(res);
			paperService = new PaperService();
		});

		it('should return an array of papers', async function () {
			const stubValue = [
				{
					id: faker.random.number({ min: 1, max: 999999999 }),
				},
				{
					id: faker.random.number({ min: 1, max: 999999999 }),
				},
			];
			const serviceStub = sinon.stub(paperService, 'getPapers').returns(stubValue);
			paperController = new PaperController(paperService);
			await paperController.getPapers(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(200)).toBe(true);
			expect(json.calledWith({ success: true, data: stubValue })).toBe(true);
		});

		it('should return a server error if an unexpected exception occurs', async function () {
			const error = new Error('A server error occurred');
			const serviceStub = sinon.stub(paperService, 'getPapers').throws(error);
			paperController = new PaperController(paperService);
			await paperController.getPapers(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(500)).toBe(true);
			expect(json.calledWith({ success: false, message: 'A server error occurred, please try again' })).toBe(true);
		});
	});
});
