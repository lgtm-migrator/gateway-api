import Repository from '../base/repository';
import { Dataset, type } from './dataset.model';

export default class DatasetRepository extends Repository {
	constructor() {
		super(Dataset);
		this.dataset = Dataset;
	}

	async getDataset(id) {
		return this.findOne({ type, datasetid: id }, { lean: true, populate: { path: 'submittedDataAccessRequests' } });
	}

	async getDatasetExpanded(id) {
		return this.findOne({ type, datasetid: id }, { lean: true, populate: { path: 'submittedDataAccessRequests' } });
	}

	async getDatasets() {
		return this.find({ type }, { lean: true, populate: { path: 'submittedDataAccessRequests' } });
	}

	async getDatasetsExpanded() {
		return this.find({ type }, { lean: true, populate: { path: 'submittedDataAccessRequests' } });
	}
}
