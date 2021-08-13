import PublisherRepository from './publisher.repository';
import PublisherService from './publisher.service';
import WorkflowRepository from '../workflow/workflow.repository';
import WorkflowService from '../workflow/workflow.service';
import DataRequestRepository from '../datarequest/datarequest.repository';
import DataRequestService from '../datarequest/datarequest.service';
import AmendmentRepository from '../datarequest/amendment/amendment.repository';
import AmendmentService from '../datarequest/amendment/amendment.service';

export const publisherRepository = new PublisherRepository();
export const publisherService = new PublisherService(publisherRepository);
export const workflowRepository = new WorkflowRepository();
export const workflowService = new WorkflowService(workflowRepository);
export const dataRequestRepository = new DataRequestRepository();
export const dataRequestService = new DataRequestService(dataRequestRepository);
export const amendmentRepository = new AmendmentRepository();
export const amendmentService = new AmendmentService(amendmentRepository);
