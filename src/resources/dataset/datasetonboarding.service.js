import constants from '../utilities/constants.util';
import datasetonboardingUtil from './utils/datasetonboarding.util';

export default class DatasetOnboardingService {
	constructor(datasetOnboardingRepository) {
		this.datasetOnboardingRepository = datasetOnboardingRepository;
	}

	getDatasetsByPublisher = async (status, publisherID, datasetIndex, maxResults, datasetSort, search) => {
		const activeflagOptions = Object.values(constants.datatsetStatuses);

		let searchQuery = {
			activeflag: {
				$in: activeflagOptions,
			},
			type: 'dataset',
			...(publisherID !== constants.teamTypes.ADMIN && { 'datasetv2.summary.publisher.identifier': publisherID }),
		};

		if (search.length > 0)
			searchQuery['$or'] = [
				{ name: { $regex: search, $options: 'i' } },
				{ 'datasetv2.summary.publisher.name': { $regex: search, $options: 'i' } },
				{ 'datasetv2.summary.abstract': { $regex: search, $options: 'i' } },
			];

		const datasets = await this.datasetOnboardingRepository.getDatasetsByPublisher(searchQuery);

		let versionedDatasets = await this.versionDatasets(datasets);

		const counts = this.buildCountObject(versionedDatasets, publisherID);

		if (status) versionedDatasets = versionedDatasets.filter(dataset => dataset.activeflag === status);
		versionedDatasets = await datasetonboardingUtil.datasetSortingHelper(versionedDatasets, datasetSort);
		if (maxResults) versionedDatasets = versionedDatasets.slice(datasetIndex, datasetIndex + maxResults);

		return [versionedDatasets, counts];
	};

	versionDatasets = datasets => {
		let versionedDatasets = datasets.reduce((arr, dataset) => {
			dataset.listOfVersions = [];
			const datasetIdx = arr.findIndex(item => item.pid === dataset.pid);
			if (datasetIdx === -1) {
				arr = [...arr, dataset];
			} else {
				const { _id, datasetVersion, activeflag } = dataset;
				const versionDetails = { _id, datasetVersion, activeflag };
				arr[datasetIdx].listOfVersions = [...arr[datasetIdx].listOfVersions, versionDetails];
			}
			return arr;
		}, []);

		return versionedDatasets;
	};

	buildCountObject = (versionedDatasets, publisherID) => {
		const activeflagOptions = Object.values(constants.datatsetStatuses);

		let counts = {
			inReview: 0,
			active: 0,
			rejected: 0,
			draft: 0,
			archive: 0,
		};

		activeflagOptions.forEach(activeflag => {
			counts[activeflag] = versionedDatasets.filter(dataset => dataset.activeflag === activeflag).length;
		});

		if (publisherID === constants.teamTypes.ADMIN) {
			delete counts.active;
			delete counts.rejected;
			delete counts.draft;
			delete counts.archive;
		}

		return counts;
	};
}
