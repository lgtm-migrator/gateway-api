import express from 'express';
import passport from 'passport';

const publisherController = require('./publisher.controller');

const router = express.Router();

// @route   GET api/publishers/:id
// @desc    GET A publishers by :id
// @access  Private
router.get('/:id', passport.authenticate('jwt'), publisherController.getPublisherById);

// @route   GET api/publishers/:id/datasets
// @desc    GET all datasets owned by publisher
// @access  Private
router.get('/:id/datasets', passport.authenticate('jwt'), publisherController.getPublisherDatasets);

// @route   GET api/publishers/:id/dataaccessrequests
// @desc    GET all data access requests to a publisher
// @access  Private
router.get('/:id/dataaccessrequests', passport.authenticate('jwt'), publisherController.getPublisherDataAccessRequests);

module.exports = router