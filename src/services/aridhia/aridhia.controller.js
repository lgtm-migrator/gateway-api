import Controller from '../resources/base/controller';
import aridhia from './aridhiaService.js';

export default class AridhiaController extends Controller {
	constructor(aridhiaService) {
        super(aridhiaService);
		this.aridhiaService = aridhiaService;
	}
}

fetchAndUpdateDatasets() {

	let datasets = [];

	const codes = aridhia.getAllDatasetsCodes();
	const aridhiaDatasets = codes.map(aridhia.getDataset);
	const datasets = mapAridhiaDatasetToDatasetModel(aridhiaDatasets);
	// this is probably better to be perform by datasetService --> I will decide later on
	datasets.forEach(ds => httpService.updateOrInsert(ds)); 
}