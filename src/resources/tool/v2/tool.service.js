export default class ToolService {
	constructor(toolRepository) {
		this.toolRepository = toolRepository;
	}
	
	getTool(id, query = {}) {
		return this.toolRepository.getTool(id, query);
	}

	getTools(query = {}) {
		return this.toolRepository.getTools(query);
	}

	getToolsByIds(toolIds) {
		return this.toolRepository.getToolsByIds(toolIds);
	}
}
