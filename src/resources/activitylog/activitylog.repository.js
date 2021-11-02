import Repository from '../base/repository';
import { ActivityLog } from './activitylog.model';

export default class ActivityLogRepository extends Repository {
	constructor() {
		super(ActivityLog);
		this.activityLog = ActivityLog;
	}

	async searchLogs(versionIds, logType, userType) {
		return ActivityLog.find({ versionId: { $in: versionIds }, logType: { $eq: logType }, userTypes: { $eq: userType } }).lean();
	}

	async createActivityLog(log) {
		return await this.create(log);
	}

	async createActivityLogs(logs) {
		return ActivityLog.insertMany(logs);
	}

	getLog(id, type) {
		return ActivityLog.findOne({ _id: { $eq: id }, logType: { $eq: type } }, 'versionId eventType plainText timestamp').lean();
	}

	deleteLog(id) {
		return ActivityLog.deleteOne({ _id: { $eq: id } });
	}
}
