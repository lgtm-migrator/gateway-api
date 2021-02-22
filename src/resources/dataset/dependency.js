import DatasetRepository from './dataset.repository';
import PaperRepository from '../paper/paper.repository';
import ProjectRepository from '../project/project.repository';
import ToolRepository from '../tool/v2/tool.repository';
import CourseRepository from '../course/v2/course.repository';
import DatasetService from './dataset.service';

const paperRepository = new PaperRepository();
const projectRepository = new ProjectRepository();
const toolRepository = new ToolRepository();
const courseRepository = new CourseRepository();

export const datasetRepository = new DatasetRepository();
export const datasetService = new DatasetService(datasetRepository, paperRepository, projectRepository, toolRepository, courseRepository);
