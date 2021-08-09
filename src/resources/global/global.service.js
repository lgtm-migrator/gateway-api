export default class GlobalService {
	constructor(globalRepository) {
		this.globalRepository = globalRepository;
	}

	getGlobal(query = {}) {
		return this.globalRepository.getGlobal(query);
	}
}
