import Controller from '../../resources/base/controller.js';
import aridhiaService from './aridhia.service.js';
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
		let datasets = [];
		for (const code of codes) {
			datasets.push(await aridhia.getDataset(code));
		}

		let models = [];
		for (const ds of datasets) {
			models.push(aridhia.resToDataset(ds));
		}
		// const models = datasets.map(ds => aridhia.resToDataset(ds));
		// const aridhiaDatasetsPromises = codes.map(async (code) => await aridhia.getDataset(code));
		// aridhiaDatasetsPromises.forEach(p => p.then(res => aridhiaService.resToDataset(res)));
		// const datasets = aridhiaDatasetsPromises.map(async (p) => p.then(res => aridhia.resToDataset(res)));
		
		console.log(models);
		console.log("end of datasets");
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