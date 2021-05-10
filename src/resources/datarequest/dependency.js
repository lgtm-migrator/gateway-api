import DataRequestRepository from './datarequest.repository';
import DataRequestService from './datarequest.service';
import WorkflowRepository from '../workflow/workflow.repository';
import WorkflowService from '../workflow/workflow.service';
import AmendmentRepository from './amendment/amendment.repository';
import AmendmentService from './amendment/amendment.service';

export const dataRequestRepository = new DataRequestRepository();
export const dataRequestService = new DataRequestService(dataRequestRepository);

export const workflowRepository = new WorkflowRepository();
export const workflowService = new WorkflowService(workflowRepository);

export const amendmentRepository = new AmendmentRepository();
export const amendmentService = new AmendmentService(amendmentRepository);