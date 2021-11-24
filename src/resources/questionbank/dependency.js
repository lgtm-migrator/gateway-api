import QuestionbankRepository from './questionbank.repository';
import QuestionbankService from './questionbank.service';
import { publisherService } from '../publisher/dependency';
import { globalService } from '../global/dependency';
import dataRequestRepository from '../datarequest/datarequest.repository';

export const questionbankRepository = new QuestionbankRepository();
export const questionbankService = new QuestionbankService(questionbankRepository, publisherService, globalService, dataRequestRepository);
