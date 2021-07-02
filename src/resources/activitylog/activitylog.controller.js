import Controller from '../base/controller';
import { logger } from '../utilities/logger';
import { isEmpty } from 'lodash';
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
			const { versionIds = [], type = '' } = req.body;

			if(isEmpty(versionIds) || !Object.values(constants.activityLogTypes).includes(type)) {
				return res.status(400).json({
					success: false,
					message: 'You must provide a valid log category and array of version identifiers to retrieve corresponding logs',
				})
			}

            // Find the logs
			const options = { lean: true };
            const logs = await this.activityLogService.searchLogs(versionIds, type);
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
