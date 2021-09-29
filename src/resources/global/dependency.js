import GlobalRepository from './global.repository';
import GlobalService from './global.service';

export const globalRepository = new GlobalRepository();
export const globalService = new GlobalService(globalRepository);
