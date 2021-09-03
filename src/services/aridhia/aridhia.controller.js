import Controller from '../../resources/base/controller.js';
import aridhia from './aridhia.service.js';
import { Dataset } from '../../resources/dataset/dataset.model.js';
import DatasetService from '../../resources/dataset/dataset.service';

export default class AridhiaController extends Controller {
	constructor(aridhiaService) {
        super(aridhiaService);
		this.aridhiaService = aridhiaService;
		this.datasetService = new DatasetService();
		this.aridhia = aridhia;
	}

	async main() {

		let datasets = [];
		let res = "";
		let models = [];
	
		try {
	
			// get the dataset codes from aridhia api. we need these codes for the next step
			res = await this.aridhia.getDatasetLists();
			const codes = await this.aridhia.extractCodesFromAridhiaResponse(res.data);
			
			// for each code, get its dataset from aridhia api 
			for (const code of codes) {
				datasets.push(await this.aridhia.getDataset(code));
			}
	
			// Take each dataset respond that we got from the api and map it to our dataset model
			for (const ds of datasets) {
				models.push(this.aridhia.resToDataset(ds));
			}
	
			// take each dataset model. if its already in the DB, update the DB. if its not --> insert to the DB
			for (const model of models) {
				let ds = new Dataset(model);
				res = await this.datasetService.replaceOrInsert(ds);
			}
	
			return res;

		} catch (err) {
			console.log("Houston we have a problem: " + err)
		}
	}
}
