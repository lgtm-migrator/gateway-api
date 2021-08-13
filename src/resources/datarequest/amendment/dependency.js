import AmendmentRepository from './amendment.repository';
import AmendmentService from './amendment.service';

export const amendmentRepository = new AmendmentRepository();
export const amendmentService = new AmendmentService(amendmentRepository);