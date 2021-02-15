import CourseRepository from './course.repository';
import CourseService from './course.service';

export const courseRepository = new CourseRepository();
export const courseService = new CourseService(courseRepository);
