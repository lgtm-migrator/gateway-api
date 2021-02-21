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
		const options = { lean: false, populate: { path: 'submittedDataAccessRequests' } };
		return this.find(query, options);
	}

	async getDatasetRevisions(pid) {
		if (!pid) {
			return {};
		}
		// Get dataset versions using pid
		const datasets = await Dataset.find({ pid }).select({ datasetid: 1, datasetVersion: 1, activeflag: 1 }).lean();
		// Create revision structure
		return datasets.reduce((obj, dataset) => {
			const { datasetVersion = 'default', datasetid = 'empty', activeflag = '' } = dataset;
			obj[datasetVersion] = datasetid;
			// Set the active dataset as the latest version
			if (activeflag === 'active') {
				obj['latest'] = datasetid;
			}
			return obj;
		}, {});
	}
}
