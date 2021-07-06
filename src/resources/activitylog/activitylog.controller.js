import Controller from '../base/controller';
import { logger } from '../utilities/logger';

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
				logs
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
}
