import express from 'express';
import passport from 'passport';
import { isUndefined, isEmpty } from 'lodash';
import QuestionbankController from './questionbank.controller';
import { questionbankService } from './dependency';
import { datarequestschemaService } from './../datarequest/schema/dependency';
import { logger } from '../utilities/logger';
import { isUserMemberOfTeamById, isUserMemberOfTeamByName } from '../auth/utils';

const router = express.Router();
const questionbankController = new QuestionbankController(questionbankService);
const logCategory = 'questionbank';

const validateViewRequest = (req, res, next) => {
	const { publisherId } = req.params;

	if (isUndefined(publisherId)) return res.status(400).json({ success: false, message: 'You must provide a valid publisher Id' });

	next();
};

const authorizeViewRequest = (req, res, next) => {
	const requestingUser = req.user;
	const { publisherId } = req.params;

	const authorised = isUserMemberOfTeamById(requestingUser, publisherId);

	if (!authorised) {
		return res.status(401).json({
			success: false,
			message: 'You are not authorised to perform this action',
		});
	}

	next();
};

const validatePostRequest = (req, res, next) => {
	const { schemaId } = req.params;

	if (isUndefined(schemaId)) return res.status(400).json({ success: false, message: 'You must provide a valid data request schema Id' });

	next();
};

const authorizePostRequest = async (req, res, next) => {
	const requestingUser = req.user;
	const { schemaId } = req.params;

	const dataRequestSchema = await datarequestschemaService.getDatarequestschemaById(schemaId);

	if (isEmpty(dataRequestSchema)) {
		return res.status(404).json({
			success: false,
			message: 'The requested data request schema could not be found',
		});
	}

	const authorised = isUserMemberOfTeamByName(requestingUser, dataRequestSchema.publisher);

	if (!authorised) {
		return res.status(401).json({
			success: false,
			message: 'You are not authorised to perform this action',
		});
	}

	req.body.dataRequestSchema = dataRequestSchema;

	next();
};

// @route   GET /api/v1/questionbanks/publisherId
// @desc    Returns questionbank info belonging to the publisher
// @access  Public
router.get(
	'/:publisherId',
	passport.authenticate('jwt'),
	validateViewRequest,
	authorizeViewRequest,
	logger.logRequestMiddleware({ logCategory, action: 'Viewed questionbank data' }),
	(req, res) => questionbankController.getQuestionbank(req, res)
);

// @route   POST /api/v1/questionbanks
// @desc    Activate a draft schema creating a jsonSchema from masterSchema
// @access  Public
router.post('/:schemaId', passport.authenticate('jwt'), validatePostRequest, authorizePostRequest, (req, res) =>
	questionbankController.publishSchema(req, res)
);

module.exports = router;
