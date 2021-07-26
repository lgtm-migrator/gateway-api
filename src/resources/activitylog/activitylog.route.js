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

const validateViewRequest = (req, res, next) => {
	const { versionIds = [], type = '' } = req.body;

	if (isEmpty(versionIds) || !Object.values(constants.activityLogTypes).includes(type)) {
		return res.status(400).json({
			success: false,
			message: 'You must provide a valid log category and array of version identifiers to retrieve corresponding logs',
		});
	}

	next();
};

const authoriseView = async (req, res, next) => {
	const requestingUser = req.user;
	const { versionIds = [] } = req.body;

	const { authorised, userType, accessRecords } = await dataRequestService.checkUserAuthForVersions(versionIds, requestingUser);
	if (!authorised) {
		return res.status(401).json({
			success: false,
			message: 'You are not authorised to perform this action',
		});
	}
	req.body.userType = userType;
    req.body.accessRecords = accessRecords;

	next();
};

const validateCreateRequest = (req, res, next) => {
	const { versionId,  description, timestamp, type } = req.body;

	if (!versionId || !description || !timestamp || !Object.values(constants.activityLogTypes).includes(type)) {
		return res.status(400).json({
			success: false,
			message: 'You must provide a valid log category and the following event details: associated version, description and timestamp',
		});
	}

	next();
};

const authoriseCreate = async (req, res, next) => {
	const requestingUser = req.user;
	const { versionId } = req.body;

	const { authorised, userType, accessRecords } = await dataRequestService.checkUserAuthForVersions([versionId], requestingUser);
	if(isEmpty(accessRecords)) {
		return res.status(404).json({
			success: false,
			message: 'The requested application version could not be found',
		});
	}
	if (!authorised || userType !== constants.userTypes.CUSTODIAN) {
		return res.status(401).json({
			success: false,
			message: 'You are not authorised to perform this action',
		});
	}

	req.body.userType = userType;
    req.body.accessRecord = accessRecords[0];
	req.body.versionTitle = accessRecords[0].getVersionById(versionId).detailedTitle;
	
	next();
};

const validateDeleteRequest = (req, res, next) => {
	const { id } = req.params;

	if (!id) {
		return res.status(400).json({
			success: false,
			message: 'You must provide a log event identifier',
		});
	}

	next();
};

const authoriseDelete = async (req, res, next) => {
	const requestingUser = req.user;
	const { id } = req.params;

	const log = await activityLogService.getLog(id);

	if(!log) {
		return res.status(404).json({
			success: false,
			message: 'The requested application log entry could not be found',
		});
	}

	const { authorised, userType, accessRecords } = await dataRequestService.checkUserAuthForVersions([log.versionId], requestingUser);
	if(isEmpty(accessRecords)) {
		return res.status(404).json({
			success: false,
			message: 'The requested application version could not be found',
		});
	}
	if (!authorised || userType !== constants.userTypes.CUSTODIAN) {
		return res.status(401).json({
			success: false,
			message: 'You are not authorised to perform this action',
		});
	}

	req.body.userType = userType;
    req.body.accessRecord = accessRecords[0];
	
	next();
};

// @route   POST /api/v2/activitylog
// @desc    Returns a collection of logs based on supplied query parameters
// @access  Private
router.post('/', passport.authenticate('jwt'), validateViewRequest, authoriseView, logger.logRequestMiddleware({ logCategory, action: 'Viewed activity logs' }), (req, res) =>
	activityLogController.searchLogs(req, res)
);

// @route   POST /api/v2/activitylog/event
// @desc    Creates a new manual event in the activity log identified in the payload
// @access  Private
router.post('/event', passport.authenticate('jwt'), validateCreateRequest, authoriseCreate, logger.logRequestMiddleware({ logCategory, action: 'Created manual event' }), (req, res) =>
	activityLogController.createLog(req, res)
);

// @route   DELETE /api/v2/activitylog/id
// @desc    Delete a manual event from the activity log
// @access  Private
router.delete('/:id', passport.authenticate('jwt'), validateDeleteRequest, authoriseDelete, logger.logRequestMiddleware({ logCategory, action: 'Deleted manual event' }), (req, res) =>
	activityLogController.deleteLog(req, res)
);

module.exports = router;
