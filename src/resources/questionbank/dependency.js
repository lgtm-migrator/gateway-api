import QuestionbankRepository from './questionbank.repository';
import QuestionbankService from './questionbank.service';
import { publisherService } from '../publisher/dependency';
import { globalService } from '../global/dependency';
import DataRequestRepository from '../datarequest/datarequest.repository';

export const questionbankRepository = new QuestionbankRepository();
export const dataRequestRepository = new DataRequestRepository();
export const questionbankService = new QuestionbankService(questionbankRepository, publisherService, globalService, dataRequestRepository);
