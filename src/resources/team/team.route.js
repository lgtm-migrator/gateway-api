import express from 'express';
import passport from 'passport';

import teamController from './team.controller';

const router = express.Router();

// @route   GET api/v1/teams/getList
// @desc     Returns List of all Teams
// @access   Private
router.get('/getList', passport.authenticate('jwt'), teamController.getTeamsList);

// @route   GET api/teams/:id
// @desc    GET A team by :id
// @access  Public
router.get('/:id', passport.authenticate('jwt'), teamController.getTeamById); 

// @route   GET api/teams/:id/members
// @desc    GET all team members for team 
// @access  Private
router.get('/:id/members', passport.authenticate('jwt'), teamController.getTeamMembers);

// @route   POST api/teams/:id/members
// @desc    Add team members
// @access  Private
router.post('/:id/members', passport.authenticate('jwt'), teamController.addTeamMembers);

// @route   PUT api/v1/teams/:id/members
// @desc    Edit a team member
// @access  Private
router.put('/:id/members/:memberid', passport.authenticate('jwt'), teamController.updateTeamMember);


// @route   DELETE api/teams/:id/members
// @desc    Delete a team member
// @access  Private
router.delete('/:id/members/:memberid', passport.authenticate('jwt'), teamController.deleteTeamMember);

// @route   GET api/v1/teams/:id/notifications
// @desc    Get team notifications
// @access  Private
router.get('/:id/notifications', passport.authenticate('jwt'), teamController.getTeamNotifications);

// @route   PUT api/v1/teams/:id/notifications
// @desc    Update notifications
// @access  Private
router.put('/:id/notifications', passport.authenticate('jwt'), teamController.updateNotifications);

// @route   PUT api/v1/teams/:id/notification-messages
// @desc    Update notifications
// @access  Private
router.put('/:id/notification-messages', passport.authenticate('jwt'), teamController.updateNotificationMessages);

// @route   POST api/teams/add
// @desc    Add a team
// @access  Private
router.post('/add', passport.authenticate('jwt'), teamController.addTeam); 

module.exports = router;  
