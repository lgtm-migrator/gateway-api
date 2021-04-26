import Repository from '../../base/repository';
import { Tool } from './tool.model';

export default class ToolRepository extends Repository {
	constructor() {
		super(Tool);
		this.tool = Tool;
	}

	async getTool(id, query) {
		query = { ...query, id };
		const options = { lean: true };
		return this.findOne(query, options);
	}

	async getTools(query) {
		const options = { lean: true };
		return this.find(query, options);
	}
}
