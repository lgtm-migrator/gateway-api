export default class CourseService {
	constructor(courseRepository) {
		this.courseRepository = courseRepository;
	}
	
	getCourse(id, query = {}) {
		return this.courseRepository.getCourse(id, query);
	}

	getCourses(query = {}) {
		return this.courseRepository.getCourses(query);
	}
}
