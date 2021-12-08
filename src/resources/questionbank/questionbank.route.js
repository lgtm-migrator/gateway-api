import express from 'express';
import passport from 'passport';
import { isUndefined, isNull, isEmpty } from 'lodash';
import QuestionbankController from './questionbank.controller';
import { questionbankService } from './dependency';
import { datarequestschemaService } from './../datarequest/schema/dependency';
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

const authorizeViewRequest = (req, res, next) => {
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

const validatePostRequest = (req, res, next) => {
	const { schemaId } = req.params;

	if (isUndefined(schemaId)) return res.status(400).json({ success: false, message: 'You must provide a valid data request schema Id' });

	next();
};

const authorizePostRequest = async (req, res, next) => {
	const requestingUser = req.user;
	const { id } = req.params;

	const datarequestschema = await datarequestschemaService.getDatarequestschemaById(id);

	if (isEmpty(datarequestschema)) {
		return res.status(404).json({
			success: false,
			message: 'The requested data request schema could not be found',
		});
	}

	const authorised = isUserMemberOfTeam(requestingUser, datarequestschema.publisher);

	if (!authorised) {
		return res.status(401).json({
			success: false,
			message: 'You are not authorised to perform this action',
		});
	}

	req.body.datarequestschema = datarequestschema;

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

// @route   GET /api/v1/questionbanks
// @desc    Returns a collection of questionbanks based on supplied query parameters
// @access  Public
router.get('/', logger.logRequestMiddleware({ logCategory, action: 'Viewed questionbanks data' }), (req, res) =>
	questionbankController.getQuestionbanks(req, res)
);

// @route   POST /api/v1/questionbanks
// @desc    Activate a draft schema creating a jsonSchema from masterSchema
// @access  Public
router.post('/schemaId', passport.authenticate('jwt'), validatePostRequest, authorizePostRequest, (req, res) =>
	questionbankController.publishSchema(req, res)
);

module.exports = router;
