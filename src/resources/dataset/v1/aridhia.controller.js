import Controller from '../base/controller';

export default class DatasetController extends Controller {
	constructor(datasetService) {
        super(datasetService);
		this.datasetService = datasetService;
	}
}

fetchAndUpdateDatasets() {

	// fetch the datasets codes from aridhhia
	// fetch the datasets and map them into mongo docs
	// for each code:
		// if its in the db ---> update the db
		// if its not in the db ----> insert the db 
}