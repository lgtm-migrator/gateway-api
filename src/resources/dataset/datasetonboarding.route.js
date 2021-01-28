import express from 'express';
import passport from 'passport';
const router = express.Router();
const datasetOnboardingController = require('./datasetonboarding.controller');

// @route   GET api/v1/dataset-onboarding/:id
// @desc    GET Dataset version based on _id
// @access  Private - Custodian Manager/Reviewer ?
router.get('/:id', passport.authenticate('jwt'), datasetOnboardingController.getDatasetVersion);

// @route   GET api/v1/dataset-onboarding/publisher/:publisherID
// @desc    GET Datasets for a publisher
// @access  Private - Custodian Manager/Reviewer ?
router.get('/publisher/:publisherID', passport.authenticate('jwt'), datasetOnboardingController.getDatasetsByPublisher);

// @route   POST api/v1/dataset-onboarding
// @desc    POST Create a new dataset version
// @access  Private - Custodian Manager/Reviewer ?
router.post('/', passport.authenticate('jwt'), datasetOnboardingController.createNewDatasetVersion);

// @route   PATCH api/v1/dataset-onboarding/:id
// @desc    PATCH Create a new dataset version
// @access  Private - Custodian Manager/Reviewer ?
router.patch('/:id', passport.authenticate('jwt'), datasetOnboardingController.updateDatasetVersionDataElement);

// @route   POST api/v1/dataset-onboarding/:id
// @desc    POST Submit a new dataset version
// @access  Private - Custodian Manager/Reviewer ?
router.post('/:id', passport.authenticate('jwt'), datasetOnboardingController.submitDatasetVersion);

module.exports = router;
