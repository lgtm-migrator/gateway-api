import multer from 'multer';
import express from 'express';
import passport from 'passport';

import datasetOnboardingController from '../controllers/datasetonboarding.controller';
import datasetOnboardingService from '../services/datasetonboarding.service';
import datasetOnboardingRepository from '../repositories/datasetonboarding.repository';
import { authoriseUserForPublisher, validateSearchParameters } from '../middlewares/index';

const upload = multer();
const router = express.Router();
const datasetonboardingRepository = new datasetOnboardingRepository();
const datasetonboardingService = new datasetOnboardingService(datasetonboardingRepository);
const datasetonboardingController = new datasetOnboardingController(datasetonboardingService);

// @route   PUT api/v1/dataset-onboarding/checkUniqueTitle
// @desc    PUT Update the status of a dataset
// @access  Private - Custodian Manager/Reviewer ?
router.get('/checkUniqueTitle', passport.authenticate('jwt'), datasetonboardingController.checkUniqueTitle);

// @route   GET api/v1/dataset-onboarding/metaddataQuality
// @desc    GET Get the metadataQuality for a dataset
// @access  Public
router.get('/metaddataQuality', datasetonboardingController.getMetadataQuality);

// @route   GET api/v1/dataset-onboarding/:id
// @desc    GET Dataset version based on _id
// @access  Private - Custodian Manager/Reviewer ?
router.get('/:id', passport.authenticate('jwt'), datasetonboardingController.getDatasetVersion);

// @route   GET api/v1/dataset-onboarding/publisher/:publisherID
// @desc    GET Datasets for a publisher
// @access  Private - Custodian Manager/Reviewer ?
router.get(
	'/publisher/:publisherID',
	passport.authenticate('jwt'),
	authoriseUserForPublisher,
	validateSearchParameters,
	datasetonboardingController.getDatasetsByPublisher
);

// @route   POST /api/v1/dataset-onboarding/bulk-upload
// @desc    Bulk upload for metadata
// @access  Public
router.post('/bulk-upload', upload.single('file'), datasetonboardingController.bulkUpload);

// @route   POST api/v1/dataset-onboarding
// @desc    POST Create a new dataset version
// @access  Private - Custodian Manager/Reviewer ?
router.post('/', passport.authenticate('jwt'), datasetonboardingController.createNewDatasetVersion);

// @route   PATCH api/v1/dataset-onboarding/:id
// @desc    PATCH Update a field in a dataset
// @access  Private - Custodian Manager/Reviewer ?
router.patch('/:id', passport.authenticate('jwt'), datasetonboardingController.updateDatasetVersionDataElement);

// @route   POST api/v1/dataset-onboarding/:id
// @desc    POST Submit a new dataset version
// @access  Private - Custodian Manager/Reviewer ?
router.post('/:id', passport.authenticate('jwt'), datasetonboardingController.submitDatasetVersion);

// @route   PUT api/v1/dataset-onboarding/:id
// @desc    PUT Update the status of a dataset
// @access  Private - Custodian Manager/Reviewer ?
router.put('/:id', passport.authenticate('jwt'), datasetonboardingController.changeDatasetVersionStatus);

// @route   DELETE /api/v1/dataset-onboarding/delete/:id
// @desc    Delete Draft Dataset
// @access  Private - Custodian Manager ?
router.delete('/delete/:id', passport.authenticate('jwt'), datasetonboardingController.deleteDraftDataset);

// @route   POST api/v1/dataset-onboarding/duplicate/:id
// @desc    POST Duplicate a dataset
// @access  Private - Custodian Manager/Reviewer ?
router.post('/duplicate/:id', passport.authenticate('jwt'), datasetonboardingController.duplicateDataset);

module.exports = router;
