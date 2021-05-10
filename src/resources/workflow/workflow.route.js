import express from 'express';
import passport from 'passport';
import { logger } from '../utilities/logger';
import WorkflowController from './workflow.controller';
import { workflowService } from './dependency';

const logCategory = 'Workflow';
const workflowController = new WorkflowController(workflowService);

const router = express.Router();

// @route   GET api/v1/workflows/:id
// @desc    Fetch a workflow by id
// @access  Private
router.get(
	'/:id',
	passport.authenticate('jwt'),
	logger.logRequestMiddleware({ logCategory, action: 'Viewed a workflow instance details' }),
	(req, res) => workflowController.getWorkflowById(req, res)
);

// @route   POST api/v1/workflows/
// @desc    Create a new workflow
// @access  Private
router.post(
	'/',
	passport.authenticate('jwt'),
	logger.logRequestMiddleware({ logCategory, action: 'Creating a new workflow definition' }),
	(req, res) => workflowController.createWorkflow(req, res)
);

// @route   PUT api/v1/workflows/:id
// @desc    Edit a workflow by id
// @access  Private
router.put(
	'/:id',
	passport.authenticate('jwt'),
	logger.logRequestMiddleware({ logCategory, action: 'Updating an existing workflow definition' }),
	(req, res) => workflowController.updateWorkflow(req, res)
);

// @route   DELETE api/v1/workflows/
// @desc    Delete a workflow by id
// @access  Private
router.delete(
	'/:id',
	passport.authenticate('jwt'),
	logger.logRequestMiddleware({ logCategory, action: 'Deleting a workflow definition' }),
	(req, res) => workflowController.deleteWorkflow(req, res)
);

module.exports = router;
