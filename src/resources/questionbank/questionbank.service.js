export default class QuestionbankService {
	constructor(questionbankRepository) {
		this.questionbankRepository = questionbankRepository;
	}

	getQuestionbank(id, query = {}, options = {}) {
		// Protect for no id passed
		if (!id) return;

		query = { ...query, id };
		return this.questionbankRepository.getQuestionbank(query, options);
	}

	getQuestionbanks(query = {}) {
		return this.questionbankRepository.getQuestionbanks(query);
	}
}
