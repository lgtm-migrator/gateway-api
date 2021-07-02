import Repository from '../base/repository';
import { ActivityLog } from './activitylog.model';

export default class ActivityLogRepository extends Repository {
	constructor() {
		super(ActivityLog);
		this.activityLog = ActivityLog;
	}

	async searchLogs(versionIds, logType, userType) {
		return ActivityLog.find({ versionId: { $in: versionIds }, logType, userTypes: userType });
	}

	async createActivityLog(log) {
		return this.create(log);
	}
}
