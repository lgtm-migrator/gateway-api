import Aridhia from './aridhia.service.js';
import { Dataset } from '../../resources/dataset/dataset.model.js';
import DatasetService from '../../resources/dataset/dataset.service';
import { GlobalModel } from '../../resources/global/global.model';
import { logger } from '../../resources/utilities/logger';
import * as Sentry from '@sentry/node';

export default class AridhiaController {
	constructor() {
		let config = {
			endpoint: process.env.ARIDHIA_ENDPOINT,
			logCategory: 'Aridhia Script',
		};
		this.datasetService = new DatasetService();
		this.aridhia = new Aridhia(config);
	}

	async main() {
		let datasets = [];
		let res = '';
		let models = [];

		try {
			const global = await GlobalModel.find({ localeId: 'en-gb' });

			// get the dataset codes from aridhia api. we need these codes for the next step
			console.log('Getting list of datasets');
			res = await this.aridhia.getDatasetLists(global[0].aridhiaToken);
			console.log('Getting list of recieved');
			const codes = await this.aridhia.extractCodesFromAridhiaResponse(res.data);

			// for each code, get its dataset from aridhia api
			for (const code of codes) {
				console.log(`Getting ${code} dataset`);
				datasets.push(await this.aridhia.getDataset(global[0].aridhiaToken, code));
				console.log(`Received ${code} dataset`);
			}
			// Take each dataset respond that we got from the api and map it to our dataset model
			for (const ds of datasets) {
				models.push(this.aridhia.resToDataset(ds));
			}

			// take each dataset model. if its already in the DB, update the DB. if its not --> insert to the DB
			for (const model of models) {
				console.log(`updating dataset with pid ${model.pid}...`);
				await Dataset.findOneAndUpdate({ pid: model.pid, activeflag: 'active' }, model, { upsert: true });
			}

			this.archiveDeprecatedDatasets(codes);

			return res;
		} catch (err) {
			Sentry.addBreadcrumb({
				category: 'Caching',
				message: `Unable to complete the metadata import from Aridhia`,
				level: Sentry.Severity.Error,
			});

			logger.logError(err, this.config.logCategory);
			console.log('Aridhia Script broke down. Error: ' + err);
		}
	}

	async archiveDeprecatedDatasets(codesFromAridhiaApi) {
		// get all fair datasets that are in our database
		const res = await Dataset.find({ pid: /.*fair-.*/ }, { pid: 1 });

		// slice the datasets pids (e.g. slice "fair-dp1" ---> "dp1")
		const aridhiaSetsIntheDatabase = res.map(doc => doc.pid.slice(5));

		// filter out the datasets that are shown in aridhia api. The one that are left after filtering are the deprecated ones
		const deprecatedAridhiaSets = aridhiaSetsIntheDatabase.filter(ds => !codesFromAridhiaApi.includes(ds));

		// archive deprecated datasets
		for (const pid of deprecatedAridhiaSets) {
			console.log(`Changing activeflag pid: ${pid} from "active" to "archive"`);
			await Dataset.findOneAndUpdate({ pid: `fair-${pid}`, activeflag: 'active' }, { $set: { activeflag: 'archive' } });
		}
	}
}
