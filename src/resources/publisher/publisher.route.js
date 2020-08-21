import express from 'express';
import passport from 'passport';

const publisherController = require('./publisher.controller');

const router = express.Router();

// @route   GET api/publishers/:id
// @desc    GET A publishers by :id
// @access  Private
router.get('/:id', passport.authenticate('jwt'), publisherController.getPublisherById);

module.exports = router