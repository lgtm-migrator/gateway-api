import dbHandler from '../../../config/in-memory-db';
import CourseRepository from '../v2/course.repository';
import { coursesStub } from '../__mocks__/courses';

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
	await dbHandler.connect();
	await dbHandler.loadData({ course: coursesStub });
});

/**
 * Revert to initial test data after every test.
 */
afterEach(async () => {
	await dbHandler.clearDatabase();
	await dbHandler.loadData({ course: coursesStub });
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => await dbHandler.closeDatabase());

describe('CourseRepository', function () {
	describe('getCourse', () => {
		it('should return a course by a specified id', async function () {
			const courseRepository = new CourseRepository();
			const course = await courseRepository.getCourse(50033);
			expect(course).toEqual(coursesStub[0]);
		});
	});

	describe('getCourses', () => {
		it('should return an array of courses', async function () {
			const courseRepository = new CourseRepository();
			const courses = await courseRepository.getCourses({}, {});
			expect(courses.length).toBeGreaterThan(0);
		});
	});
});
