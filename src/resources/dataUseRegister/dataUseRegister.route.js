import express from 'express';
import DataUseRegisterController from './dataUseRegister.controller';
import { dataUseRegisterService } from './dependency';
import { logger } from '../utilities/logger';
import passport from 'passport';
import { TheatersRounded } from '@material-ui/icons';

const router = express.Router();
const dataUseRegisterController = new DataUseRegisterController(dataUseRegisterService);
const logCategory = 'dataUseRegister';

// @route   GET /api/v2/data-use-registers/id
// @desc    Returns a dataUseRegister based on dataUseRegister ID provided
// @access  Public
router.get(
	'/:id',
	// passport.authenticate('jwt'),
	logger.logRequestMiddleware({ logCategory, action: 'Viewed dataUseRegister data' }),
	(req, res) => dataUseRegisterController.getDataUseRegister(req, res)
);

// @route   GET /api/v2/data-use-registers
// @desc    Returns a collection of dataUseRegisters based on supplied query parameters
// @access  Public
router.get(
	'/',
	passport.authenticate('jwt'),

	(req, res, next) => {
		const { user } = req.user;
		const { publisher } = req.query;

		if (publisher && isUserMemberOfTeam(user, publisher)) {
			next();
		} else {
			console.log('not');
		}
	},
	logger.logRequestMiddleware({ logCategory, action: 'Viewed dataUseRegisters data' }),
	(req, res) => dataUseRegisterController.getDataUseRegisters(req, res)
);

// @route   PUT /api/v2/data-use-registers/id
// @desc    Update the content of the data user register based on dataUseRegister ID provided
// @access  Public
router.patch(
	'/:id',
	// passport.authenticate('jwt'),
	logger.logRequestMiddleware({ logCategory, action: 'Updated dataUseRegister data' }),
	(req, res) => dataUseRegisterController.updateDataUseRegister(req, res)
);

function isUserMemberOfTeam(user, teamId) {
	return user.teams.exists(team => team.publisher._id === teamId);
}

module.exports = router;
