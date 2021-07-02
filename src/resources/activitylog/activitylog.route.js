import express from 'express';

import ActivityLogController from './activitylog.controller';
import { activityLogService } from './dependency';
import { logger } from '../utilities/logger';

const router = express.Router();
const activityLogController = new ActivityLogController(activityLogService);
const logCategory = 'Activity Log';

// @route   POST /api/v2/activitylog
// @desc    Returns a collection of logs based on supplied query parameters
// @access  Public
router.post('/', logger.logRequestMiddleware({ logCategory, action: 'Viewed activity logs' }), (req, res) =>
	activityLogController.searchLogs(req, res)
);

module.exports = router;
