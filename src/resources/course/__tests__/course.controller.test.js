import sinon from 'sinon';
import faker from 'faker';

import CourseController from '../v2/course.controller';
import CourseService from '../v2/course.service';

describe('CourseController', function () {
	beforeAll(() => {
		console.log = sinon.stub();
		console.error = sinon.stub();
	});

	describe('getCourse', function () {
		let req, res, status, json, courseService, courseController;

		beforeEach(() => {
			status = sinon.stub();
			json = sinon.spy();
			res = { json, status };
			status.returns(res);
			courseService = new CourseService();
		});

		it('should return a course that matches the id param', async function () {
			req = { params: { id: faker.random.number({ min: 1, max: 999999999 }) } };
			const stubValue = {
				id: req.params.id,
			};
			const serviceStub = sinon.stub(courseService, 'getCourse').returns(stubValue);
			courseController = new CourseController(courseService);
			await courseController.getCourse(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(200)).toBe(true);
			expect(json.calledWith({ success: true, data: stubValue })).toBe(true);
		});

		it('should return a bad request response if no course id is provided', async function () {
			req = { params: {} };

			const serviceStub = sinon.stub(courseService, 'getCourse').returns({});
			courseController = new CourseController(courseService);
			await courseController.getCourse(req, res);

			expect(serviceStub.notCalled).toBe(true);
			expect(status.calledWith(400)).toBe(true);
			expect(json.calledWith({ success: false, message: 'You must provide a course identifier' })).toBe(true);
		});

		it('should return a not found response if no course could be found for the id provided', async function () {
			req = { params: { id: faker.random.number({ min: 1, max: 999999999 }) } };

			const serviceStub = sinon.stub(courseService, 'getCourse').returns(null);
			courseController = new CourseController(courseService);
			await courseController.getCourse(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(404)).toBe(true);
			expect(json.calledWith({ success: false, message: 'A course could not be found with the provided id' })).toBe(true);
		});

		it('should return a server error if an unexpected exception occurs', async function () {
			req = { params: { id: faker.random.number({ min: 1, max: 999999999 }) } };

			const error = new Error('A server error occurred');
			const serviceStub = sinon.stub(courseService, 'getCourse').throws(error);
			courseController = new CourseController(courseService);
			await courseController.getCourse(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(500)).toBe(true);
			expect(json.calledWith({ success: false, message: 'A server error occurred, please try again' })).toBe(true);
		});
	});

	describe('getCourses', function () {
		let req, res, status, json, courseService, courseController;
		req = { params: {} };

		beforeEach(() => {
			status = sinon.stub();
			json = sinon.spy();
			res = { json, status };
			status.returns(res);
			courseService = new CourseService();
		});

		it('should return an array of courses', async function () {
			const stubValue = [
				{
					id: faker.random.number({ min: 1, max: 999999999 }),
				},
				{
					id: faker.random.number({ min: 1, max: 999999999 }),
				},
			];
			const serviceStub = sinon.stub(courseService, 'getCourses').returns(stubValue);
			courseController = new CourseController(courseService);
			await courseController.getCourses(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(200)).toBe(true);
			expect(json.calledWith({ success: true, data: stubValue })).toBe(true);
		});

		it('should return a server error if an unexpected exception occurs', async function () {
			const error = new Error('A server error occurred');
			const serviceStub = sinon.stub(courseService, 'getCourses').throws(error);
			courseController = new CourseController(courseService);
			await courseController.getCourses(req, res);

			expect(serviceStub.calledOnce).toBe(true);
			expect(status.calledWith(500)).toBe(true);
			expect(json.calledWith({ success: false, message: 'A server error occurred, please try again' })).toBe(true);
		});
	});
});
