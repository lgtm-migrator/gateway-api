import express from 'express';
import passport from "passport";
import { utils } from "../auth";
import { ROLES } from '../user/user.roles'
import { MessagesModel } from './message.model'
import mongoose from 'mongoose';
import { TopicModel } from '../topic/topic.model';

const messageController = require('../message/message.controller');

// by default route has access to its own, allows access to parent param
const router = express.Router({ mergeParams: true});

router.get('/test',
  passport.authenticate('jwt'), 
  utils.checkIsInRole(ROLES.Admin),
    async (req, res) => {
      const topic = new TopicModel({
        _id: new mongoose.Types.ObjectId(),
        topicName : "This the topic name",
        topicCreated: "01/01/2020"
      });

      await topic.save( async function (err) {
        if (err) return handleError(err);
      
        const message = new MessagesModel({
          messageID: 123,
          messageTo: 12345,
          messageObjectID: 123456,
          messageType: 'Test',
          messageSent: '10/01/2020',
          isRead: "false",
          messageDescription: "test message",
          topic: topic._id
        });

        await message.save(async function (err) {
          if (err) return handleError(err);

          await MessagesModel.
            findOne({ messageID: 123 }).
            populate('topic').
            exec(function (err, message) {
              if (err) return handleError(err);
              return res.json(message);
            });
        });
      });
  });

router.get('/numberofunread/admin/:personID',
  passport.authenticate('jwt'), 
  utils.checkIsInRole(ROLES.Admin),
  async (req, res) => {

    var idString = "";
    let countUnreadMessages = 0;
    if (req.params.personID) {
      idString = parseInt(req.params.personID);
    }

    var m = MessagesModel.aggregate([
      { $match: { $and: [{ $or: [{ messageTo: idString }, { messageTo: 0 }] }] } },
      { $sort: { messageSent: -1 } },
      { $lookup: { from: "tools", localField: "messageObjectID", foreignField: "id", as: "tool" } }
    ]).limit(50);
    m.exec((err, data) => {
      if (err) {
        return res.json({ success: false, error: err });
      } else {
        Array.prototype.forEach.call(data, element => {
          if (element.isRead === 'false') {
            countUnreadMessages++;
          }
        });
        return res.json({ countUnreadMessages });
      }
    })
  });

router.get('/numberofunread/:personID',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Creator),
  async (req, res) => {

    var idString = "";
    let countUnreadMessages = 0;
    if (req.params.personID) {
      idString = parseInt(req.params.personID);
    }

    if (req.query.id) {
      idString = parseInt(req.query.id);
    }
    var m = MessagesModel.aggregate([
      { $match: { $and: [{ messageTo: idString }] } },
      { $lookup: { from: "tools", localField: "messageObjectID", foreignField: "id", as: "tool" } }
    ]).limit(50);
    m.exec((err, data) => {
      if (err) {
        return res.json({ success: false, error: err });
      } else {
        Array.prototype.forEach.call(data, element => {
          if (element.isRead === 'false') {
            countUnreadMessages++;
          }
        });
        return res.json({ countUnreadMessages });
      }
    })
  });

router.get('/:personID',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Creator),
  async (req, res) => {
    var idString = "";

    if (req.params.personID) {
      idString = parseInt(req.params.personID);
    }
    var m = MessagesModel.aggregate([
      { $match: { $and: [{ messageTo: idString }] } },
      { $lookup: { from: "tools", localField: "messageObjectID", foreignField: "id", as: "tool" } }
    ]).limit(50);
    m.exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, newData: data });
    });
  });

/**
 * {get} /messages Messages
 * 
 * Return list of messages
 */
router.get(
  '/admin/:personID',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin),
  async (req, res) => {
    var idString = "";

    if (req.params.personID) {
      idString = parseInt(req.params.personID);
    }

    var m = MessagesModel.aggregate([
      { $match: { $and: [{ $or: [{ messageTo: idString }, { messageTo: 0 }] }] } },
      { $sort: { messageSent: -1 } },
      { $lookup: { from: "tools", localField: "messageObjectID", foreignField: "id", as: "tool" } }
    ]).limit(50);
    m.exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, newData: data });
    });
  });

router.post(
  '/markasread',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
    console.log('in markAsRead');
    const messageIds = req.body;

    MessagesModel.updateMany(
      { messageID: { $in: messageIds } },
      { isRead: true }, (err) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true });
      }
    )
  });

  // @route   POST api/messages
  // @desc    POST A message
  // @access  Private
  router.post('/', passport.authenticate('jwt'), utils.checkIsInRole(ROLES.Admin, ROLES.Creator), messageController.createMessage);

  // @route   DELETE api/messages/:id
  // @desc    DELETE Delete a message
  // @access  Private
  router.delete('/:id', passport.authenticate('jwt'), utils.checkIsInRole(ROLES.Admin, ROLES.Creator), messageController.deleteMessage);

  // @route   PUT api/messages
  // @desc    PUT Update a message
  // @access  Private
  router.put('/', passport.authenticate('jwt'), utils.checkIsInRole(ROLES.Admin, ROLES.Creator), messageController.updateMessage);

// @route   GET api/messages/unread/count
// @desc    GET the number of unread messages for a user
// @access  Private
router.get('/unread/count', passport.authenticate('jwt'), messageController.getUnreadMessageCount);

  module.exports = router; 