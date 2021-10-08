import express from 'express';
import CohortController from './cohort.controller';
import { cohortService } from './dependency';
import { logger } from '../utilities/logger';
import { resultLimit } from '../../config/middleware';
import passport from 'passport';
import { utils } from '../auth';

const router = express.Router();
const cohortController = new CohortController(cohortService);
const logCategory = 'cohort';

// @route   GET /api/v1/cohorts/id
// @desc    Returns a cohort based on cohort ID provided
// @access  Public
router.get('/:id', logger.logRequestMiddleware({ logCategory, action: 'Viewed cohort data' }), (req, res) =>
	cohortController.getCohort(req, res)
);

// @route   GET /api/v1/cohorts
// @desc    Returns a collection of cohorts based on supplied query parameters
// @access  Public
router.get(
	'/',
	(req, res, next) => resultLimit(req, res, next, 100),
	logger.logRequestMiddleware({ logCategory, action: 'Viewed cohorts data' }),
	(req, res) => cohortController.getCohorts(req, res)
);

// @route   POST /api/v1/save-cohort
// @desc    Creates a draft Cohort in the database
// @access  Public
router.post('/', (req, res) => cohortController.addCohort(req, res));

// @route   PUT /api/v1/cohorts/:id
// @desc    Edit a cohort by id
// @access  Private
router.put('/:id', passport.authenticate('jwt'), utils.checkAllowedToAccess('cohort'), (req, res) => cohortController.editCohort(req, res));

module.exports = router;
