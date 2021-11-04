import Repository from '../base/repository';
import { GlobalModel } from './global.model';
import { isEmpty } from 'lodash';

export default class StatsRepository extends Repository {
	constructor() {
		super(GlobalModel);
		this.globalSnapshot = GlobalModel;
	}

	async getGlobal(query) {
		const options = { lean: true };
		const globals = await this.find(query, options);

		return isEmpty(globals) ? {} : globals[0];
	}
}
