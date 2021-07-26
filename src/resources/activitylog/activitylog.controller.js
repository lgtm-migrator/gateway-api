import Controller from '../base/controller';
import { logger } from '../utilities/logger';
import constants from '../utilities/constants.util';

const logCategory = 'Activity Log';

export default class ActivityLogController extends Controller {
	constructor(activityLogService) {
		super(activityLogService);
		this.activityLogService = activityLogService;
	}

	async searchLogs(req, res) {
		try {
			// Extract required log params
			const { versionIds = [], type = '', userType, accessRecords } = req.body;

			// Find the logs
			const logs = await this.activityLogService.searchLogs(versionIds, type, userType, accessRecords);

			// Return the logs
			return res.status(200).json({
				success: true,
				logs,
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'A server error occurred, please try again',
			});
		}
	}

	async createLog(req, res) {
		try {
			// Extract required event log params
			const { versionId, description, timestamp, type, userType, accessRecord, versionTitle } = req.body;

			// Create new event log
			await this.activityLogService.logActivity(constants.activityLogEvents.MANUAL_EVENT, {
				versionId,
				versionTitle,
				description,
				timestamp,
				type,
				user: req.user,
			});

			// Send notifications
			this.createNotifications(constants.activityLogNotifications.MANUALEVENTADDED, {}, accessRecord, req.user);

			// Get logs for version that was updated
			const [affectedVersion] = await this.activityLogService.searchLogs([versionId], type, userType, [accessRecord], false);

			// Return the logs
			return res.status(200).json({
				success: true,
				affectedVersion,
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'A server error occurred, please try again',
			});
		}
	}

	async deleteLog(req, res) {
		try {
			// Extract required event params
			const { id } = req.params;
			const { versionId, type, userType, accessRecord } = req.body;

			// Delete event log
			await this.activityLogService.deleteLog(id);

			// Send notifications
			this.createNotifications(constants.activityLogNotifications.MANUALEVENTREMOVED, {}, accessRecord, req.user);

			// Get logs for version that was updated
			const [affectedVersion] = await this.activityLogService.searchLogs([versionId], type, userType, [accessRecord], false);

			// Return the logs
			return res.status(200).json({
				success: true,
				affectedVersion,
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'A server error occurred, please try again',
			});
		}
	}

	createNotifications(type, context, accessRecord, user) {}
}
