import express from 'express';
import DataUseRegisterController from './dataUseRegister.controller';
import { Data } from '../tool/data.model';
import { dataUseRegisterService } from './dependency';
import { logger } from '../utilities/logger';
import passport from 'passport';
import constants from './../utilities/constants.util';
import _ from 'lodash';

const router = express.Router();
const dataUseRegisterController = new DataUseRegisterController(dataUseRegisterService);
const logCategory = 'dataUseRegister';

function isUserMemberOfTeam(user, publisherId) {
	let { teams } = user;
	return teams.filter(team => !_.isNull(team.publisher)).some(team => team.publisher._id.equals(publisherId));
}

function isUserDataUseAdmin(user) {
	let { teams } = user;

	if (teams) {
		teams = teams.map(team => {
			let { publisher, type, members } = team;
			let member = members.find(member => {
				return member.memberid.toString() === user._id.toString();
			});
			let { roles } = member;
			return { ...publisher, type, roles };
		});
	}

	return teams
		.filter(team => team.type === constants.teamTypes.ADMIN)
		.some(team => team.roles.includes(constants.roleTypes.ADMIN_DATA_USE));
}

const validateUpdateRequest = (req, res, next) => {
	const { id } = req.params;

	if (!id) {
		return res.status(400).json({
			success: false,
			message: 'You must provide a data user register identifier',
		});
	}

	next();
};

const validateViewRequest = (req, res, next) => {
	const { team } = req.query;

	if (!team) {
		return res.status(400).json({
			success: false,
			message: 'You must provide a team parameter',
		});
	}

	next();
};

const authorizeView = async (req, res, next) => {
	const requestingUser = req.user;
	const { team } = req.query;

	const authorised =
		team === 'user' || (team === 'admin' && isUserDataUseAdmin(requestingUser)) || isUserMemberOfTeam(requestingUser, team);

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
	const authorised = isUserMemberOfTeam(requestingUser, publisher._id) || isUserDataUseAdmin(requestingUser);
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
	validateViewRequest,
	authorizeView,
	logger.logRequestMiddleware({ logCategory, action: 'Viewed dataUseRegisters data' }),
	(req, res) => dataUseRegisterController.getDataUseRegisters(req, res)
);

// {get} /api/v2/data-use-registers/{datauseregisterID} Data Use Register
// Return the details on the Data Use Register based on the Course ID(?)
//
router.get('/:datauseid', async (req, res) => {
	let id = parseInt(req.params.id);
	var query = Data.aggregate([
		{ $match: { id: parseInt(req.params.id) } },
		{
			$lookup: {
				from: 'tools',
				localField: 'creator',
				foreignField: 'id',
				as: 'creator',
			},
		},
	]);
	query.exec((err, data) => {
		if (data.length > 0) {
			var p = Data.aggregate([
				{
					$match: {
						$and: [{ relatedObjects: { $elemMatch: { objectId: req.params.id } } }],
					},
				},
			]);
			p.exec((err, relatedData) => {
				relatedData.forEach(dat => {
					dat.relatedObjects.forEach(x => {
						if (x.objectId === req.params.id && dat.id !== req.params.id) {
							let relatedObject = {
								objectId: dat.id,
								reason: x.reason,
								objectType: dat.type,
								user: x.user,
								updated: x.updated,
							};
							data[0].relatedObjects = [relatedObject, ...(data[0].relatedObjects || [])];
						}
					});
				});

				if (err) return res.json({ success: false, error: err });

				return res.json({
					success: true,
					data: data,
				});
			});
		} else {
			return res.status(404).send(`Data Use Register not found for Id: ${escape(id)}`);
		}
	});
});

// @route   PUT /api/v2/data-use-registers/id
// @desc    Update the content of the data user register based on dataUseRegister ID provided
// @access  Public
router.patch(
	'/:id',
	passport.authenticate('jwt'),
	validateUpdateRequest,
	authorizeUpdate,
	logger.logRequestMiddleware({ logCategory, action: 'Updated dataUseRegister data' }),
	(req, res) => dataUseRegisterController.updateDataUseRegister(req, res)
);

module.exports = router;
