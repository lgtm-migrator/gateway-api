export default class DatasetService {
	constructor(datasetRepository) {
		this.datasetRepository = datasetRepository;
	}
	
	async getDataset(id, query = {}) {
		let dataset = await this.datasetRepository.getDataset(id, query);

		if(dataset && query['expanded'] === true) {
			dataset.isLatestVersion = dataset.checkLatestVersion();
		}

		return dataset;
	}

	getDatasets(query = {}) {
		return this.datasetRepository.getDatasets(query);
	}
}
