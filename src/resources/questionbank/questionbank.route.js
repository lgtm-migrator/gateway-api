import express from 'express';
import passport from 'passport';
import { isUndefined, isNull } from 'lodash';
import QuestionbankController from './questionbank.controller';
import { questionbankService } from './dependency';
import { logger } from '../utilities/logger';

const router = express.Router();
const questionbankController = new QuestionbankController(questionbankService);
const logCategory = 'questionbank';

function isUserMemberOfTeam(user, teamId) {
	let { teams } = user;
	return teams.filter(team => !isNull(team.publisher)).some(team => team.publisher._id.equals(teamId));
}

const validateViewRequest = (req, res, next) => {
	const { publisherId } = req.params;

	if (isUndefined(publisherId)) return res.status(400).json({ success: false, message: 'You must provide a valid publisher Id' });

	next();
};

const authorizeView = (req, res, next) => {
	const requestingUser = req.user;
	const { publisherId } = req.params;

	const authorised = isUserMemberOfTeam(requestingUser, publisherId);

	if (!authorised) {
		return res.status(401).json({
			success: false,
			message: 'You are not authorised to perform this action',
		});
	}

	next();
};

// @route   GET /api/v1/questionbanks/publisherId
// @desc    Returns questionbank info belonging to the publisher
// @access  Public
router.get(
	'/:publisherId',
	passport.authenticate('jwt'),
	validateViewRequest,
	authorizeView,
	logger.logRequestMiddleware({ logCategory, action: 'Viewed questionbank data' }),
	(req, res) => questionbankController.getQuestionbank(req, res)
);

// @route   GET /api/v1/questionbanks
// @desc    Returns a collection of questionbanks based on supplied query parameters
// @access  Public
router.get('/', logger.logRequestMiddleware({ logCategory, action: 'Viewed questionbanks data' }), (req, res) =>
	questionbankController.getQuestionbanks(req, res)
);

module.exports = router;
