import express from 'express';
import passport from 'passport';
import { isUndefined } from 'lodash';
import QuestionbankController from './questionbank.controller';
import { questionbankService } from './dependency';
import { logger } from '../utilities/logger';

const router = express.Router();
const questionbankController = new QuestionbankController(questionbankService);
const logCategory = 'questionbank';

const validateViewRequest = (req, res, next) => {
	const { teamId } = req.params;
	if (isUndefined(teamId)) return res.status(400).json({ success: false, message: 'You must provide a valid teamId' });

	next();
};

const authorizeView = (req, res, next) => {};

// @route   GET /api/v1/questionbanks/teamId
// @desc    Returns a questionbank based on ID of the publisher provided
// @access  Public
router.get(
	'/:teamId',
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
