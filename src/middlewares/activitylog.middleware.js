import { isEmpty } from 'lodash';

import { activityLogService } from '../resources/activitylog/dependency';
import { dataRequestService } from '../resources//datarequest/dependency';
import { datasetService } from '../resources/dataset/dependency';
import datasetonboardingUtil from '../resources/dataset/utils/datasetonboarding.util';
import constants from '../resources/utilities/constants.util';

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
	let authorised, userType, accessRecords;

	try {
		if (req.body.type === constants.activityLogTypes.DATA_ACCESS_REQUEST) {
			({ authorised, userType, accessRecords } = await dataRequestService.checkUserAuthForVersions(versionIds, requestingUser));
			if (!authorised) {
				return res.status(401).json({
					success: false,
					message: 'You are not authorised to perform this action',
				});
			}

			req.body.userType = userType;
			req.body.versions = accessRecords;
		} else if (req.body.type === constants.activityLogTypes.DATASET) {
			const datasetVersions = await datasetService.getDatasets({ _id: { $in: versionIds } }, { lean: true });
			let permissionsArray = [];
			await datasetVersions.forEach(async version => {
				({ authorised } = await datasetonboardingUtil.getUserPermissionsForDataset(
					version.datasetv2.identifier,
					requestingUser,
					version.datasetv2.summary.publisher.identifier
				));
				permissionsArray.push(authorised);
			});

			if (!permissionsArray.includes(true)) {
				return res.status(401).json({
					success: false,
					message: 'You are not authorised to perform this action',
				});
			}
			req.body.userType = requestingUser.teams.map(team => team.type).includes(constants.userTypes.ADMIN)
				? constants.userTypes.ADMIN
				: constants.userTypes.CUSTODIAN;
			req.body.versions = datasetVersions;
		}
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: 'Error authenticating the user against submitted versionIds. Please check the submitted dataset versionIds',
		});
	}

	next();
};

const validateCreateRequest = (req, res, next) => {
	const { versionId, description, timestamp } = req.body;
	const { type } = req.params;

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
	const { type } = req.params;

	const { authorised, userType, accessRecords } = await dataRequestService.checkUserAuthForVersions([versionId], requestingUser);
	if (isEmpty(accessRecords)) {
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
	req.body.type = type;

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
	const { id, type } = req.params;

	const log = await activityLogService.getLog(id, type);

	if (!log) {
		return res.status(404).json({
			success: false,
			message: 'The requested application log entry could not be found',
		});
	}

	const { authorised, userType, accessRecords } = await dataRequestService.checkUserAuthForVersions([log.versionId], requestingUser);
	if (isEmpty(accessRecords)) {
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
	if (log.eventType !== constants.activityLogEvents.data_access_request.MANUAL_EVENT) {
		return res.status(400).json({
			success: false,
			message: 'You cannot delete a system generated log entry',
		});
	}

	req.body.userType = userType;
	req.body.accessRecord = accessRecords[0];
	req.body.versionId = log.versionId;
	req.body.type = type;

	next();
};

export { validateViewRequest, authoriseView, authoriseCreate, validateCreateRequest, validateDeleteRequest, authoriseDelete };
