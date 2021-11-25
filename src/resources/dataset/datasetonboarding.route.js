import express from 'express';
import passport from 'passport';
import multer from 'multer';
const upload = multer();
const router = express.Router();

const datasetOnboardingController = require('./datasetonboarding.controller');
import { authoriseUserForPublisher, validateSearchParameters } from '../../middlewares/index';

// @route   PUT api/v1/dataset-onboarding/checkUniqueTitle
// @desc    PUT Update the status of a dataset
// @access  Private - Custodian Manager/Reviewer ?
router.get('/checkUniqueTitle', passport.authenticate('jwt'), datasetOnboardingController.checkUniqueTitle);

// @route   GET api/v1/dataset-onboarding/metaddataQuality
// @desc    GET Get the metadataQuality for a dataset
// @access  Public
router.get('/metaddataQuality', datasetOnboardingController.getMetadataQuality);

// @route   GET api/v1/dataset-onboarding/:id
// @desc    GET Dataset version based on _id
// @access  Private - Custodian Manager/Reviewer ?
router.get('/:id', passport.authenticate('jwt'), datasetOnboardingController.getDatasetVersion);

// @route   GET api/v1/dataset-onboarding/publisher/:publisherID
// @desc    GET Datasets for a publisher
// @access  Private - Custodian Manager/Reviewer ?
router.get(
	'/publisher/:publisherID',
	passport.authenticate('jwt'),
	authoriseUserForPublisher,
	validateSearchParameters,
	datasetOnboardingController.getDatasetsByPublisher
);

// @route   POST /api/v1/dataset-onboarding/bulk-upload
// @desc    Bulk upload for metadata
// @access  Public
router.post('/bulk-upload', upload.single('file'), datasetOnboardingController.bulkUpload);

// @route   POST api/v1/dataset-onboarding
// @desc    POST Create a new dataset version
// @access  Private - Custodian Manager/Reviewer ?
router.post('/', passport.authenticate('jwt'), datasetOnboardingController.createNewDatasetVersion);

// @route   PATCH api/v1/dataset-onboarding/:id
// @desc    PATCH Update a field in a dataset
// @access  Private - Custodian Manager/Reviewer ?
router.patch('/:id', passport.authenticate('jwt'), datasetOnboardingController.updateDatasetVersionDataElement);

// @route   POST api/v1/dataset-onboarding/:id
// @desc    POST Submit a new dataset version
// @access  Private - Custodian Manager/Reviewer ?
router.post('/:id', passport.authenticate('jwt'), datasetOnboardingController.submitDatasetVersion);

// @route   PUT api/v1/dataset-onboarding/:id
// @desc    PUT Update the status of a dataset
// @access  Private - Custodian Manager/Reviewer ?
router.put('/:id', passport.authenticate('jwt'), datasetOnboardingController.changeDatasetVersionStatus);

// @route   DELETE /api/v1/dataset-onboarding/delete/:id
// @desc    Delete Draft Dataset
// @access  Private - Custodian Manager ?
router.delete('/delete/:id', passport.authenticate('jwt'), datasetOnboardingController.deleteDraftDataset);

// @route   POST api/v1/dataset-onboarding/duplicate/:id
// @desc    POST Duplicate a dataset
// @access  Private - Custodian Manager/Reviewer ?
router.post('/duplicate/:id', passport.authenticate('jwt'), datasetOnboardingController.duplicateDataset);

module.exports = router;
