import ActivityLogRepository from './activitylog.repository';
import ActivityLogService from './activitylog.service';

export const activityLogRepository = new ActivityLogRepository();
export const activityLogService = new ActivityLogService(activityLogRepository);
