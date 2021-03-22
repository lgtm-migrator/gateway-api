import ProjectRepository from './project.repository';
import ProjectService from './project.service';

export const projectRepository = new ProjectRepository();
export const projectService = new ProjectService(projectRepository);
