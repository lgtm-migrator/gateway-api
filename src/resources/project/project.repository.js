import Repository from '../base/repository';
import { Project } from './project.model';

export default class ProjectRepository extends Repository {
	constructor() {
		super(Project);
		this.project = Project;
	}

	async getProject(id, query) {
		query = { ...query, id };
		const options = { lean: true };
		return this.findOne(query, options);
	}

	async getProjects(query) {
		const options = { lean: true };
		return this.find(query, options);
	}
}
