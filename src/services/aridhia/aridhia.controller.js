import Aridhia from './aridhia.service.js';
import { Dataset } from '../../resources/dataset/dataset.model.js';
import DatasetService from '../../resources/dataset/dataset.service';
import { config, http } from './aridhia.config';
import { logger } from '../../resources/utilities/logger';

export default class AridhiaController {
	constructor() {
		this.datasetService = new DatasetService();
		this.aridhia = new Aridhia(http, config);
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
				console.log(`updating dataset with pid ${model.pid}...`);
				await Dataset.findOneAndUpdate({"pid": model.pid, "activeflag": "active"}, model , { upsert: true });
			}
	
			return res;

		} catch (err) {
			logger.logError(err, config.logCategory);
			console.log("Aridhia Script broke down. Error: " + err);
		}
	}
}
