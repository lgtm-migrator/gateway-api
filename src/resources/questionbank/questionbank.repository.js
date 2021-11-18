import Repository from '../base/repository';
import { Questionbank } from './questionbank.model';
import constants from '../utilities/constants.util';

export default class QuestionbankRepository extends Repository {
	constructor() {
		super(Questionbank);
		this.questionbank = Questionbank;
	}

	async getQuestionbank(query, options) {
		return this.findOne(query, options);
	}

	async getQuestionbanks(query) {
		const options = { lean: true };
		return this.find(query, options);
	}
}
