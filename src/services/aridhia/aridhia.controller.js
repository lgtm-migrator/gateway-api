import Controller from '../../resources/base/controller.js';
import aridhia from './aridhia.service.js';

export default class AridhiaController extends Controller {
	constructor(aridhiaService) {
        super(aridhiaService);
		this.aridhiaService = aridhiaService;
	}
}

async function main() {

	let datasets = [];

	try {
		const res = await aridhia.getDatasetLists();
		const codes = await aridhia.extractCodesFromAridhiaResponse(res.data);
		const aridhiaDatasetsPromises = codes.map(async (code) => await aridhia.getDataset(code));

		aridhiaDatasetsPromises.forEach(p => p.then(res => console.log(res.data)));
		// const datasets = aridhiaDatasets.map(ds => aridhia.aridhiaDatasetToDatasetModel(ds));
		
		// update/insert the db using axios 
	} catch (err) {
		console.log("Houston we have a problem: " + err)
	}
}


main();

// My questions: 
		// 1. How to consume the promises on aridhiaDatasetsPromises?
		// 2. Following up I have aridhiaDatasetToDatasetModel which by itself is not async.
		// would I will have to "await" it due to the previous actions?