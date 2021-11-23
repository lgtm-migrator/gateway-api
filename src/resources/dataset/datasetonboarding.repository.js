import Repository from '../base/repository';
import { Data } from '../tool/data.model';

export default class DatasetOnboardingRepository extends Repository {
	constructor() {
		super(Data);
		this.data = Data;
	}

	async getDatasetsByPublisher(query) {
		return this.data
			.find(query)
			.select(
				'_id pid name datasetVersion activeflag timestamps applicationStatusDesc applicationStatusAuthor percentageCompleted datasetv2.summary.publisher.name'
			)
			.sort({ 'timestamps.updated': -1 })
			.lean();
	}
}
