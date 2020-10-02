import express from 'express';
import passport from 'passport';

const teamController = require('./team.controller');

const router = express.Router();

// @route   GET api/team/:id
// @desc    GET A team by :id
// @access  Public
router.get('/:id', passport.authenticate('jwt'), teamController.getTeamById);

// @route   GET api/team/:id/members
// @desc    GET all team members for team
// @access  Private
router.get('/:id/members', passport.authenticate('jwt'), teamController.getTeamMembers);

module.exports = router 
