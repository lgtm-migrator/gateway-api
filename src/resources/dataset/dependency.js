import DatasetRepository from './dataset.repository';
import DatasetService from './dataset.service';

export const datasetRepository = new DatasetRepository();
export const datasetService = new DatasetService(datasetRepository);
