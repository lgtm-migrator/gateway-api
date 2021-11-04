import WorkflowRepository from './workflow.repository';
import WorkflowService from './workflow.service';

export const workflowRepository = new WorkflowRepository();
export const workflowService = new WorkflowService(workflowRepository);
