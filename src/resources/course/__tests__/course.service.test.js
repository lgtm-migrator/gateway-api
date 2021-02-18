import sinon from 'sinon';

import CourseRepository from '../v2/course.repository';
import CourseService from '../v2/course.service';
import { coursesStub } from '../__mocks__/courses';

describe('CourseService', function () {
	describe('getCourse', function () {
		it('should return a course by a specified id', async function () {
			const courseStub = coursesStub[0];
			const courseRepository = new CourseRepository();
			const stub = sinon.stub(courseRepository, 'getCourse').returns(courseStub);
			const courseService = new CourseService(courseRepository);
			const course = await courseService.getCourse(courseStub.id);

			expect(stub.calledOnce).toBe(true);

			expect(course.type).toEqual(courseStub.type);
			expect(course.id).toEqual(courseStub.id);
			expect(course.creator).toEqual(courseStub.creator);
			expect(course.description).toEqual(courseStub.description);
			expect(course.activeflag).toEqual(courseStub.activeflag);
			expect(course.counter).toEqual(courseStub.counter);
			expect(course.discourseTopicId).toEqual(courseStub.discourseTopicId);
			expect(course.relatedObjects).toEqual(courseStub.relatedObjects);
			expect(course.title).toEqual(courseStub.title);
			expect(course.link).toEqual(courseStub.link);
			expect(course.provider).toEqual(courseStub.provider);
			expect(course.courseDelivery).toEqual(courseStub.courseDelivery);
			expect(course.location).toEqual(courseStub.location);
			expect(course.keywords).toEqual(courseStub.keywords);
			expect(course.domains).toEqual(courseStub.domains);
			expect(course.courseOptions).toEqual(courseStub.courseOptions);
			expect(course.entries).toEqual(courseStub.entries);
			expect(course.restrictions).toEqual(courseStub.restrictions);
			expect(course.award).toEqual(courseStub.award);
			expect(course.competencyFramework).toEqual(courseStub.competencyFramework);
			expect(course.nationalPriority).toEqual(courseStub.nationalPriority);
		});
	});
	describe('getCourses', function () {
		it('should return an array of courses', async function () {
			const courseRepository = new CourseRepository();
			const stub = sinon.stub(courseRepository, 'getCourses').returns(coursesStub);
			const courseService = new CourseService(courseRepository);
			const courses = await courseService.getCourses();

			expect(stub.calledOnce).toBe(true);

			expect(courses.length).toBeGreaterThan(0);
		});
	});
});
