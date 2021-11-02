import express from 'express';
import passport from 'passport';

import ActivityLogMiddleware from '../../middlewares/activitylog.middleware';
import ActivityLogController from './activitylog.controller';
import { activityLogService } from './dependency';
import { logger } from '../utilities/logger';

const router = express.Router();
const activityLogController = new ActivityLogController(activityLogService);
const logCategory = 'Activity Log';

// @route   POST /api/v2/activitylog
// @desc    Returns a collection of logs based on supplied query parameters
// @access  Private
router.post(
	'/',
	passport.authenticate('jwt'),
	ActivityLogMiddleware.validateViewRequest,
	ActivityLogMiddleware.authoriseView,
	logger.logRequestMiddleware({ logCategory, action: 'Viewed activity logs' }),
	(req, res) => activityLogController.searchLogs(req, res)
);

// @route   POST /api/v2/activitylog/event
// @desc    Creates a new manual event in the activity log identified in the payload
// @access  Private
router.post(
	'/:type',
	passport.authenticate('jwt'),
	ActivityLogMiddleware.validateCreateRequest,
	ActivityLogMiddleware.authoriseCreate,
	logger.logRequestMiddleware({ logCategory, action: 'Created manual event' }),
	(req, res) => activityLogController.createLog(req, res)
);

// @route   DELETE /api/v2/activitylog/id
// @desc    Delete a manual event from the activity log
// @access  Private
router.delete(
	'/:type/:id',
	passport.authenticate('jwt'),
	ActivityLogMiddleware.validateDeleteRequest,
	ActivityLogMiddleware.authoriseDelete,
	logger.logRequestMiddleware({ logCategory, action: 'Deleted manual event' }),
	(req, res) => activityLogController.deleteLog(req, res)
);

module.exports = router;
