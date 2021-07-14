import express from 'express';
import CohortProfilingController from './cohortprofiling.controller';
import { cohortProfilingService } from './dependency';

const cohortProfilingController = new CohortProfilingController(cohortProfilingService);

const router = express.Router();

// @route   GET api/v2/cohortprofiling/:pid/:tableName:/:variable
// @desc    GET Cohort Profiling by pid, tableName and variable
// @access  Public
router.get('/:pid/:tableName/:variable', (req, res) => cohortProfilingController.getCohortProfilingByVariable(req, res));

// @route   GET api/v2/cohortprofiling
// @desc    Returns a collection of cohort profiling data based on supplied query parameters
// @access  Public
router.get('/', (req, res) => cohortProfilingController.getCohortProfiling(req, res));

module.exports = router;
