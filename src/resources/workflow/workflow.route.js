import express from 'express';
import passport from 'passport';

const workflowController = require('./workflow.controller');

const router = express.Router();

// @route   GET api/v1/workflows/:id
// @desc    GET A workflow by :id
// @access  Private
router.get('/:id', passport.authenticate('jwt'), workflowController.getWorkflowById);

module.exports = router 
