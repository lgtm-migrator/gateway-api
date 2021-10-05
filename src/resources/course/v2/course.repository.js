import Repository from '../../base/repository';
import { Course } from '../course.model';
import moment from 'moment';

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

	async getCourses(query, options) {
		const { dateFormat } = options;

		if (dateFormat) {
			let courses = await this.find(query, options);
			courses.forEach(course => 
				course.courseOptions.forEach(option => option.startDate ? option.startDate = moment(option.startDate).format('DD MMM YYYY') : option.startDate)
			);
			return courses;
		} else {
			return await this.find(query, options);
		}
	}
}
