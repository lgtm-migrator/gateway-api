import QuestionbankRepository from './questionbank.repository';
import QuestionbankService from './questionbank.service';

export const questionbankRepository = new QuestionbankRepository();
export const questionbankService = new QuestionbankService(questionbankRepository);
