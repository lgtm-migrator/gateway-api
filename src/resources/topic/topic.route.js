import express from 'express';
import passport from 'passport';

const topicController = require('./topic.controller');

const router = express.Router();
// @route   POST api/topics
// @desc    POST A topic
// @access  Private
router.post('/', passport.authenticate('jwt'), topicController.createTopic);

// @route   DELETE api/topics/:id
// @desc    DELETE A topic soft delete
// @access  Private
router.delete('/:id', passport.authenticate('jwt'), topicController.deleteTopic);

// @route   GET api/topics
// @desc    GET A a list of topics
// @access  Private
router.get('/', passport.authenticate('jwt'), topicController.getTopics);

// @route   GET api/topics/:id
// @desc    GET A topic by :id
// @access  Private
router.get('/:id', passport.authenticate('jwt'), topicController.getTopicById);


module.exports = router