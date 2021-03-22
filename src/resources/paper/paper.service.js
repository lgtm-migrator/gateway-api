export default class PaperService {
	constructor(paperRepository) {
		this.paperRepository = paperRepository;
	}
	
	getPaper(id, query = {}) {
		return this.paperRepository.getPaper(id, query);
	}

	getPapers(query = {}) {
		return this.paperRepository.getPapers(query);
	}
}
