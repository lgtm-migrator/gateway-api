import Repository from '../base/repository';
import { ActivityLog } from './activitylog.model';

export default class ActivityLogRepository extends Repository {
	constructor() {
		super(ActivityLog);
		this.activityLog = ActivityLog;
	}

	async searchLogs(versionIds, logType, userType) {
		return ActivityLog.find({ versionId: { $in: versionIds }, logType, userTypes: userType }).lean();
	}

	async createActivityLog(log) {
		return this.create(log);
	}

	async createActivityLogs(logs) {
		return ActivityLog.insertMany(logs);
	}

	getLog(id, type) {
		return ActivityLog.findOne({ _id: id, logType: type }, 'versionId eventType').lean();
	}

	deleteLog(id) {
		return ActivityLog.deleteOne({ _id: id });
	}
}
