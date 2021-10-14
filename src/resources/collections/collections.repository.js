import Repository from '../base/repository';
import { Collections } from './collections.model';
import helper from '../utilities/helper.util';

export default class CollectionsRepository extends Repository {
	constructor() {
		super(Collections);
		this.collections = Collections;
	}

	async getCollections(query, options) {
		return this.find(query, options);
	}

	async updateCollection(query, options) {
		return this.updateByQuery(query, options);
	}

	async searchCollections(query) {
		return new Promise(resolve => {
			query.exec((err, data) => {
				data &&
					data.map(dat => {
						dat.persons = helper.hidePrivateProfileDetails(dat.persons);
					});
				if (typeof data === 'undefined') resolve([]);
				else resolve(data);
			});
		});
	}
}
