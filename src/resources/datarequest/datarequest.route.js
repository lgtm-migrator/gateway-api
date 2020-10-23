import express from 'express';
import passport from 'passport';
import _ from 'lodash';

const datarequestController = require('./datarequest.controller');

const router = express.Router();

// @route   GET api/v1/data-access-request
// @desc    GET Access requests for user
// @access  Private - Applicant (Gateway User) and Custodian Manager/Reviewer
router.get('/', passport.authenticate('jwt'), datarequestController.getAccessRequestsByUser);

// @route   GET api/v1/data-access-request/:requestId
// @desc    GET a single data access request by Id
// @access  Private - Applicant (Gateway User) and Custodian Manager/Reviewer
router.get('/:requestId', passport.authenticate('jwt'), datarequestController.getAccessRequestById);

// @route   GET api/v1/data-access-request/dataset/:datasetId
// @desc    GET Access request for user
// @access  Private - Applicant (Gateway User) and Custodian Manager/Reviewer
router.get('/dataset/:dataSetId', passport.authenticate('jwt'), datarequestController.getAccessRequestByUserAndDataset);

// @route   GET api/v1/data-access-request/datasets/:datasetIds
// @desc    GET Access request with multiple datasets for user
// @access  Private - Applicant (Gateway User) and Custodian Manager/Reviewer
router.get('/datasets/:datasetIds', passport.authenticate('jwt'), datarequestController.getAccessRequestByUserAndMultipleDatasets);

// @route   PATCH api/v1/data-access-request/:id
// @desc    Update application passing single object to update database entry with specified key
// @access  Private - Applicant (Gateway User)
router.patch('/:id', passport.authenticate('jwt'), datarequestController.updateAccessRequestDataElement);

// @route   PUT api/v1/data-access-request/:id
// @desc    Update request record by Id for status changes
// @access  Private - Custodian Manager and Applicant (Gateway User)
router.put('/:id', passport.authenticate('jwt'), datarequestController.updateAccessRequestById);

// @route   PUT api/v1/data-access-request/:id/assignworkflow
// @desc    Update access request workflow
// @access  Private - Custodian Manager
router.put('/:id/assignworkflow', passport.authenticate('jwt'), datarequestController.assignWorkflow);

// @route   PUT api/v1/data-access-request/:id/vote
// @desc    Update access request with user vote
// @access  Private - Custodian Reviewer/Manager
router.put('/:id/vote', passport.authenticate('jwt'), datarequestController.updateAccessRequestReviewVote);

// @route   PUT api/v1/data-access-request/:id/startreview
// @desc    Update access request with review started
// @access  Private - Custodian Manager
router.put('/:id/startreview', passport.authenticate('jwt'), datarequestController.updateAccessRequestStartReview);

// @route   PUT api/v1/data-access-request/:id/stepoverride
// @desc    Update access request with current step overriden (manager ends current phase regardless of votes cast)
// @access  Private - Custodian Manager
router.put('/:id/stepoverride', passport.authenticate('jwt'), datarequestController.updateAccessRequestStepOverride);

// @route   POST api/v1/data-access-request/:id
// @desc    Submit request record
// @access  Private - Applicant (Gateway User)
router.post('/:id', passport.authenticate('jwt'), datarequestController.submitAccessRequestById);

// @route   POST api/v1/data-access-request/:id/notify
// @desc    External facing endpoint to trigger notifications for Data Access Request workflows
// @access  Private
router.post('/:id', passport.authenticate('jwt'), datarequestController.notifyAccessRequestById);

module.exports = router;