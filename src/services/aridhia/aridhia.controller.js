import Controller from '../resources/base/controller';

export default class AridhiaController extends Controller {
	constructor(aridhiaService) {
        super(aridhiaService);
		this.aridhiaService = aridhiaService;
	}
}

fetchAndUpdateDatasets() {

	let datasets = [];

	const codes = getAllDatasetCodesFromTheAPI();
	const aridhiaDatasets = getAridhiaDatasetsFromTheAPI(codes);
	const datasets = mapAridhiaDatasetsToDatasetsModels(aridhiaDatasets);
	const updateDB(datasets);
}