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
		try {
			const global = await GlobalModel.find({ localeId: 'en-gb' });

			// get the dataset codes from aridhia api. we need these codes for the next step
			console.log('Getting list of datasets');
			const listOfDatasets = await this.aridhia.getDatasetLists(global[0].aridhiaToken);
			console.log('List of datasets recieved');
			const codes = await this.aridhia.extractCodesFromAridhiaResponse(listOfDatasets.data);

			// for each code, get its dataset from aridhia api
			for (const code of codes) {
				console.log(`Getting ${code} dataset`);
				const dataset = await this.aridhia.getDataset(global[0].aridhiaToken, code);
				console.log(`Received ${code} dataset`);
				const datasetModel = this.aridhia.resToDataset(dataset);
				await Dataset.findOneAndUpdate({ pid: datasetModel.pid, activeflag: 'active' }, datasetModel, { upsert: true });
				console.log(`${code} dataset saved in DB`);
			}

			this.archiveDeprecatedDatasets(codes);
		} catch (err) {
			console.log(err);
			// Sentry.addBreadcrumb({
			// 	category: 'Caching',
			// 	message: `Unable to complete the metadata import from Aridhia`,
			// 	level: Sentry.Severity.Error,
			// });

			// logger.logError(err, this.config.logCategory);
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
