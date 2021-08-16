import FiltersRepository from './filters.repository';
import FiltersService from './filters.service';
import DatasetRepository from '../dataset/dataset.repository';
import ToolRepository from '../tool/v2//tool.repository';

const datasetRepository = new DatasetRepository();
const toolRepository = new ToolRepository();

export const filtersRepository = new FiltersRepository();
export const filtersService = new FiltersService(filtersRepository, datasetRepository, toolRepository);
