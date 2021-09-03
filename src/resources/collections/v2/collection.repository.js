import Repository from '../../base/repository';
import { Collections } from '../collections.model';

export default class CollectionRepository extends Repository {
	constructor() {
		super(Collections);
		this.collection = Collections;
	}

	async getCollection(id, query) {
		query = { ...query, id };
		const options = { lean: true };
		return this.findOne(query, options);
	}

	async getCollections(query) {
		const options = { lean: true };
		const persons = await this.find(query, options);
		return persons;
	}
}
