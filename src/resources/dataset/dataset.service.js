import _ from 'lodash';

export default class DatasetService {
	constructor(datasetRepository) {
		this.datasetRepository = datasetRepository;
	}
	
	async getDataset(id, query = {}) {
		// Get dataset from Db by datasetid first
		query = { ...query, datasetid: id};
		let dataset = await this.datasetRepository.getDataset(query);

		// Update query to find the latest dataset
		if (!_.isNil(dataset)) {
			id = dataset.pid;
		}
		
		// Get latest data set
		delete query.datasetid;
		dataset = await this.datasetRepository.getDataset({ ...query, pid: id, activeflag: 'active' });

		// If no dataset is found active, look for most recent archived dataset
		if(!dataset) {
			query.sort = '-createdAt';
			dataset = await this.datasetRepository.getDataset({ ...query, pid: id, activeflag: 'archive' });
		}

		// Return undefined if no dataset found
		if(!dataset) return;

		// Raw output responds with the data structure as defined in MongoDb
		if(query['raw'] === true) {
			dataset.isLatestVersion = dataset.checkLatestVersion();
		} else {
			// Transform to dataset v2 data structure
			dataset = dataset.toV2Format();
		}

		return dataset;
	}

	getDatasets(query = {}) {
		return this.datasetRepository.getDatasets(query);
	}
}
