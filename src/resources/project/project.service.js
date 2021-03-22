export default class ProjectService {
	constructor(projectRepository) {
		this.projectRepository = projectRepository;
	}
	
	getProject(id, query = {}) {
		return this.projectRepository.getProject(id, query);
	}

	getProjects(query = {}) {
		return this.projectRepository.getProjects(query);
	}
}
