import express from 'express';
import passport from 'passport';
import _ from 'lodash';

const datarequestController = require('./datarequest.controller');

const router = express.Router();

// @route   GET api/v1/data-access-request
// @desc    GET Access requests for user
// @access  Private
router.get('/', passport.authenticate('jwt'), datarequestController.getAccessRequestsByUser);

// @route   GET api/v1/data-access-request/:requestId
// @desc    GET a single data access request by Id
// @access  Private
router.get('/:requestId', passport.authenticate('jwt'), datarequestController.getAccessRequestById);

// @route   GET api/v1/data-access-request/dataset/:datasetId
// @desc    GET Access request for user
// @access  Private
router.get('/dataset/:dataSetId', passport.authenticate('jwt'), datarequestController.getAccessRequestByUserAndDataset);

// @route   GET api/v1/data-access-request/datasets/:datasetIds
// @desc    GET Access request with multiple datasets for user
// @access  Private
router.get('/datasets/:datasetIds', passport.authenticate('jwt'), datarequestController.getAccessRequestByUserAndMultipleDatasets);

// @route   PATCH api/v1/data-access-request/:id
// @desc    Update application passing single object to update database entry with specified key
// @access  Private
router.patch('/:id', passport.authenticate('jwt'), datarequestController.updateAccessRequestDataElement);

// @route   PUT api/v1/data-access-request/:id
// @desc    Update request record by Id for status changes
// @access  Private
router.put('/:id', passport.authenticate('jwt'), datarequestController.updateAccessRequestById);

// @route   PUT api/v1/data-access-request/:id/assignworkflow
// @desc    Update access request workflow
// @access  Private
router.put('/:id/assignworkflow', passport.authenticate('jwt'), datarequestController.assignWorkflow);

// @route   POST api/v1/data-access-request/:id
// @desc    Submit request record
// @access  Private
router.post('/:id', passport.authenticate('jwt'), datarequestController.submitAccessRequestById);

module.exports = router;