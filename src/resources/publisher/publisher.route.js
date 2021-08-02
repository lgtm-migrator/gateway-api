import express from 'express';
import passport from 'passport';

import { logger } from '../utilities/logger';
import PublisherController from './publisher.controller';
import { publisherService, workflowService, dataRequestService, amendmentService } from './dependency';

const logCategory = 'Publisher';
const publisherController = new PublisherController(publisherService, workflowService, dataRequestService, amendmentService);

const router = express.Router();

// @route   GET api/publishers/:id
// @desc    GET A publishers by :id
// @access  Public
router.get('/:id', logger.logRequestMiddleware({ logCategory, action: 'Viewed a publishers details' }), (req, res) =>
	publisherController.getPublisher(req, res)
);

// @route   GET api/publishers/:id/datasets
// @desc    GET all datasets owned by publisher
// @access  Private
router.get(
	'/:id/datasets',
	passport.authenticate('jwt'),
	logger.logRequestMiddleware({ logCategory, action: 'Viewed datasets for a publisher' }),
	(req, res) => publisherController.getPublisherDatasets(req, res)
);

// @route   GET api/publishers/:id/dataaccessrequests
// @desc    GET all data access requests to a publisher
// @access  Private
router.get(
	'/:id/dataaccessrequests',
	passport.authenticate('jwt'),
	logger.logRequestMiddleware({ logCategory, action: 'Viewed data access requests for a publisher' }),
	(req, res) => publisherController.getPublisherDataAccessRequests(req, res)
);

// @route   GET api/publishers/:id/workflows
// @desc    GET workflows for publisher
// @access  Private
router.get(
	'/:id/workflows',
	passport.authenticate('jwt'),
	logger.logRequestMiddleware({ logCategory, action: 'Viewed workflows for a publisher' }),
	(req, res) => publisherController.getPublisherWorkflows(req, res)
);

module.exports = router;
