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

	const res = aridhia.getDatasetLists();
	const codes = aridhia.extractCodesFromAridhiaResponse(res);
	
	console.log(codes);
	// const aridhiaDatasets = codes.map(code => aridhia.getDataset(code));
	// const datasets = aridhiaDatasets.map(ds => aridhia.aridhiaDatasetToDatasetModel(ds));

	// // this is probably better to be perform by datasetService --> I will decide later on
	// datasets.forEach(ds => httpService.updateOrInsert(ds)); 
}