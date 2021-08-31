import Controller from '../../resources/base/controller.js';
import aridhia from './aridhia.service.js';
import mongo from './mongoService.js';
import mocks from './__mocks__/aridhiaMocks.js';

export default class AridhiaController extends Controller {
	constructor(aridhiaService) {
        super(aridhiaService);
		this.aridhiaService = aridhiaService;
	}
}

async function main() {

	let datasets = [];
	let res = "";
	let models = [];

	try {

		// get the dataset codes from aridhia api. we need these codes for the next step
		res = await aridhia.getDatasetLists();
		const codes = await aridhia.extractCodesFromAridhiaResponse(res.data);
		
		// for each code, get its dataset from aridhia api 
		for (const code of codes) {
			datasets.push(await aridhia.getDataset(code));
		}

		// Take each dataset respond that we got from the api and map it to our dataset model
		for (const ds of datasets) {
			models.push(aridhia.resToDataset(ds));
		}

		// take each dataset model. if its already in the DB, update the DB. if its not --> insert to the DB
		for (const model of models) {
			res = await replaceOrInsert(model);
		}

	} catch (err) {
		console.log("Houston we have a problem: " + err)
	}
}

// utils

async function replaceOrInsert(model) {
	let res = await mongo.findByPid(model.pid);
	if (res.length > 1)
		throw new Error(`ERROR: Many objects returned with pid "${model.pid}". It means that there are many datasets in the DB with pid "${model.pid}". findByPid respond should return array with one object.`);	
	
	if (res.length === 0) {
		res = await mongo.insertOne(model);	
	} else if (res.length === 1 && res[0]._id) {
		res = await mongo.replaceOne(model);
	} else {
		throw new Error('Unexpected ERROR findByPid respond should return an array with one object.');
	}

	return res;
}

main();

// My questions: 
		// 1. How to consume the promises on aridhiaDatasetsPromises?
		// 2. Following up I have aridhiaDatasetToDatasetModel which by itself is not async.
		// would I will have to "await" it due to the previous actions?