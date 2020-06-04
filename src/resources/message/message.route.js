import express from 'express'
import { utils } from "../auth";
import passport from "passport";
import { ROLES } from '../user/user.roles'
import { MessagesModel } from '../message/message.model'


const router = express.Router()

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

    if (req.query.id) {
      idString = parseInt(req.query.id);
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

router.post('/add', passport.authenticate('jwt'), utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
    let data = new Data();

    const { type, name, link, description, categories, license, authors, tags, toolids, datasetids } = req.body;
    data.id = parseInt(Math.random().toString().replace('0.', ''));
    data.type = type;


    data.save((err) => {
      let message = new MessagesModel();
      message.messageID = parseInt(Math.random().toString().replace('0.', ''));
      message.messageTo = 0;
      message.messageObjectID = data.id;
      message.messageType = 'add';
      message.messageSent = Date.now();
      message.isRead = false;
      message.save((err) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, id: data.id });
      });
    });
  });



module.exports = router