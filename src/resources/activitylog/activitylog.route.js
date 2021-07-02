import express from 'express';
import passport from 'passport';

import ActivityLogController from './activitylog.controller';
import { activityLogService } from './dependency';
import { dataRequestService } from '../datarequest/dependency';
import { logger } from '../utilities/logger';
import { isEmpty } from 'lodash';
import constants from '../utilities/constants.util';

const router = express.Router();
const activityLogController = new ActivityLogController(activityLogService);
const logCategory = 'Activity Log';

const validateRequest = (req, res, next) => {
	const { versionIds = [], type = '' } = req.body;

	if (isEmpty(versionIds) || !Object.values(constants.activityLogTypes).includes(type)) {
		return res.status(400).json({
			success: false,
			message: 'You must provide a valid log category and array of version identifiers to retrieve corresponding logs',
		});
	}

	next();
};

const authoriseUser = async (req, res, next) => {
	const requestingUser = req.user;
	const { versionIds = [] } = req.body;

	const { authorised, userType } = await dataRequestService.checkUserAuthForVersions(versionIds, requestingUser);
	if (!authorised) {
		return res.status(401).json({
			success: false,
			message: 'You are not authorised to perform this action',
		});
	}
	req.body.userType = userType;

	next();
};

// @route   POST /api/v2/activitylog
// @desc    Returns a collection of logs based on supplied query parameters
// @access  Public
router.post('/', passport.authenticate('jwt'), validateRequest, authoriseUser, logger.logRequestMiddleware({ logCategory, action: 'Viewed activity logs' }), (req, res) =>
	activityLogController.searchLogs(req, res)
);

module.exports = router;
