import DataRequestRepository from './datarequest.repository';
import DataRequestService from './datarequest.service';
import WorkflowRepository from '../workflow/workflow.repository';
import WorkflowService from '../workflow/workflow.service';
import AmendmentRepository from './amendment/amendment.repository';
import AmendmentService from './amendment/amendment.service';
import ActivityLogRepository from '../activitylog/activitylog.repository';
import ActivityLogService from '../activitylog/activitylog.service';
import TopicRepository from '../topic/topic.repository';
import TopicService from '../topic/topic.service';
import MessageRepository from '../message/message.repository';
import MessageService from '../message/message.service';

export const dataRequestRepository = new DataRequestRepository();
export const dataRequestService = new DataRequestService(dataRequestRepository);

export const workflowRepository = new WorkflowRepository();
export const workflowService = new WorkflowService(workflowRepository);

export const amendmentRepository = new AmendmentRepository();
export const amendmentService = new AmendmentService(amendmentRepository);

export const activityLogRepository = new ActivityLogRepository();
export const activityLogService = new ActivityLogService(activityLogRepository);
export const topicRepository = new TopicRepository();
export const topicService = new TopicService(topicRepository);

export const messageRepository = new MessageRepository();
export const messageService = new MessageService(messageRepository);
