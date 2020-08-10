import express from 'express';
import passport from 'passport';
import { TopicModel } from './topic.model';

const topicController = require('./topic.controller');
// import { router as MessageRouter } from '../message/message.route';

const router = express.Router();

// @route   POST /api/v1/topics/:id/messages
// @desc    POST a message to topic
// @access  Private
// router.use('/:id/messages', MessageRouter);


// @route   POST api/topics
// @desc    POST A topic
// @access  Private
router.post('/', passport.authenticate('jwt'), topicController.postTopic);

// @route   DELETE api/topics/:id
// @desc    DELETE A topic soft delete
// @access  Private
router.delete('/:id', passport.authenticate('jwt'), topicController.deleteTopic);


// @route   GET api/topics/:id
// @desc    GET A topic by :id
// @access  Private
router.get('/:id', passport.authenticate('jwt'), topicController.getTopicById);


module.exports = router