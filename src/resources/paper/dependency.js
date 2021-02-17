import PaperRepository from './paper.repository';
import PaperService from './paper.service';

export const paperRepository = new PaperRepository();
export const paperService = new PaperService(paperRepository);
