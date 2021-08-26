import FiltersRepository from './filters.repository';
import FiltersService from './filters.service';
import DatasetRepository from '../dataset/dataset.repository';
import ToolRepository from '../tool/v2//tool.repository';
import ProjectRepository from '../project/project.repository';

const datasetRepository = new DatasetRepository();
const toolRepository = new ToolRepository();
const projectRepository = new ProjectRepository();

export const filtersRepository = new FiltersRepository();
export const filtersService = new FiltersService(filtersRepository, datasetRepository, toolRepository, projectRepository);
