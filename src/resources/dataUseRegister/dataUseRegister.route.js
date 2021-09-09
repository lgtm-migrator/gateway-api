import express from 'express';
import DataUseRegisterController from './dataUseRegister.controller';
import { dataUseRegisterService } from './dependency';
import { logger } from '../utilities/logger';
import passport from 'passport';
import _ from 'lodash';

const router = express.Router();
const dataUseRegisterController = new DataUseRegisterController(dataUseRegisterService);
const logCategory = 'dataUseRegister';

function isUserMemberOfTeam(user, publisherId) {
	const { teams } = user;
	return teams.some(team => team.publisher._id.equals(publisherId));
}

const validateRequest = (req, res, next) => {
	const { id } = req.params;
	if (!id) {
		return res.status(400).json({
			success: false,
			message: 'You must provide a log event identifier',
		});
	}
	next();
};

const authorizeView = async (req, res, next) => {
	const requestingUser = req.user;
	const { publisher } = req.query;

	const authorised = _.isUndefined(publisher) || isUserMemberOfTeam(requestingUser, publisher);
	if (!authorised) {
		return res.status(401).json({
			success: false,
			message: 'You are not authorised to perform this action',
		});
	}

	next();
};

const authorizeUpdate = async (req, res, next) => {
	const requestingUser = req.user;
	const { id } = req.params;

	const dataUseRegister = await dataUseRegisterService.getDataUseRegister(id);

	if (!dataUseRegister) {
		return res.status(404).json({
			success: false,
			message: 'The requested data use register entry could not be found',
		});
	}

	const { publisher } = dataUseRegister;
	const authorised = isUserMemberOfTeam(requestingUser, publisher._id);
	if (!authorised) {
		return res.status(401).json({
			success: false,
			message: 'You are not authorised to perform this action',
		});
	}

	next();
};

// @route   GET /api/v2/data-use-registers/id
// @desc    Returns a dataUseRegister based on dataUseRegister ID provided
// @access  Public
router.get(
	'/:id',
	passport.authenticate('jwt'),
	logger.logRequestMiddleware({ logCategory, action: 'Viewed dataUseRegister data' }),
	(req, res) => dataUseRegisterController.getDataUseRegister(req, res)
);

// @route   GET /api/v2/data-use-registers
// @desc    Returns a collection of dataUseRegisters based on supplied query parameters
// @access  Public
router.get(
	'/',
	passport.authenticate('jwt'),
	authorizeView,
	logger.logRequestMiddleware({ logCategory, action: 'Viewed dataUseRegisters data' }),
	(req, res) => dataUseRegisterController.getDataUseRegisters(req, res)
);

// @route   PUT /api/v2/data-use-registers/id
// @desc    Update the content of the data user register based on dataUseRegister ID provided
// @access  Public
router.patch(
	'/:id',
	passport.authenticate('jwt'),
	validateRequest,
	authorizeUpdate,
	logger.logRequestMiddleware({ logCategory, action: 'Updated dataUseRegister data' }),
	(req, res) => dataUseRegisterController.updateDataUseRegister(req, res)
);

module.exports = router;
