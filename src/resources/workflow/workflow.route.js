import express from 'express';
import passport from 'passport';
import workflowController from './workflow.controller';

const router = express.Router();

// @route   GET api/v1/workflows/:id
// @desc    Fetch a workflow by id
// @access  Private
router.get('/:id', passport.authenticate('jwt'), workflowController.getWorkflowById);

// @route   POST api/v1/workflows/
// @desc    Create a new workflow
// @access  Private
router.post('/', passport.authenticate('jwt'), workflowController.createWorkflow);

// @route   PUT api/v1/workflows/:id
// @desc    Edit a workflow by id
// @access  Private
router.put('/:id', passport.authenticate('jwt'), workflowController.updateWorkflow);

// @route   DELETE api/v1/workflows/
// @desc    Delete a workflow by id
// @access  Private
router.delete('/:id', passport.authenticate('jwt'), workflowController.deleteWorkflow);

module.exports = router;
