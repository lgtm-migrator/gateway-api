import Repository from '../base/repository';
import { Paper } from './paper.model';

export default class PaperRepository extends Repository {
	constructor() {
		super(Paper);
		this.paper = Paper;
	}

	async getPaper(id, query) {
		query = { ...query, id };
		const options = { lean: true };
		return this.findOne(query, options);
	}

	async getPapers(query) {
		const options = { lean: true };
		return this.find(query, options);
	}
}
