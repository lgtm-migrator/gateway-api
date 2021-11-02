import express from 'express';
import passport from 'passport';

const publisherController = require('./publisher.controller');

const router = express.Router();

// @route   GET api/publishers/:id
// @desc    GET A publishers by :id
// @access  Public
router.get('/:id', publisherController.getPublisherById);

// @route   GET api/publishers/:id/datasets
// @desc    GET all datasets owned by publisher
// @access  Private
router.get('/:id/datasets', passport.authenticate('jwt'), publisherController.getPublisherDatasets);

// @route   GET api/publishers/:id/dataaccessrequests
// @desc    GET all data access requests to a publisher
// @access  Private
router.get('/:id/dataaccessrequests', passport.authenticate('jwt'), publisherController.getDataAccessRequestsByPublisherId);

// @route   GET api/publishers/:id/workflows
// @desc    GET workflows for publisher
// @access  Private
router.get('/:id/workflows', passport.authenticate('jwt'), publisherController.getPublisherWorkflows);

// @route   GET api/v1/data-access-request/publisher/team/:team/dataaccessrequests
// @desc    GET all team data requests
// @access  Private
router.get('/team/:team/dar', passport.authenticate('jwt'), publisherController.getDataAccessRequestsByPublisherName);
 
module.exports = router;
