import Repository from '../base/repository';
import { ActivityLog } from './activitylog.model';

export default class ActivityLogRepository extends Repository {
	constructor() {
		super(ActivityLog);
		this.activityLog = ActivityLog;
	}

	async searchLogs(query, options) {
		return this.find(query, options);
	}

	async createActivityLog(log) {
		return this.create(log);
	}
}
