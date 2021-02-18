import Repository from '../base/repository';
import { Dataset } from './dataset.model';

export default class DatasetRepository extends Repository {
	constructor() {
		super(Dataset);
		this.dataset = Dataset;
	}

	async getDataset(query) {
		const options = { lean: false, populate: { path: 'submittedDataAccessRequests' } };
		return this.findOne(query, options);
	}

	async getDatasets(query) {
		const options = { lean: true, populate: { path: 'submittedDataAccessRequests' } };
		return this.find(query, options);
	}
}
