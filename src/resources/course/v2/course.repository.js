import Repository from '../../base/repository';
import { Course } from '../course.model';

export default class CourseRepository extends Repository {
	constructor() {
		super(Course);
		this.course = Course;
	}

	async getCourse(id, query) {
		query = { ...query, id };
		const options = { lean: true };
		return this.findOne(query, options);
	}

	async getCourses(query) {
		const options = { lean: true };
		return this.find(query, options);
	}
}
