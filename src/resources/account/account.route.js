import express from 'express';
import passport from "passport";
import { utils } from "../auth";
import { ROLES } from '../user/user.roles'
import { Data } from '../tool/data.model';
import { MessagesModel } from '../message/message.model';
import { createDiscourseTopic } from '../discourse/discourse.service'
import { UserModel } from '../user/user.model'
const sgMail = require('@sendgrid/mail');
const router = express.Router();
const hdrukEmail = `enquiry@healthdatagateway.org`;

/**
 * {delete} /api/v1/accounts
 * 
 * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
 * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
 */
router.delete(
  '/',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
    const { id } = req.body;
    Data.findOneAndDelete({ id: id }, (err) => {
      if (err) return res.send(err);
      return res.json({ success: true });
    });
  });

/**
 * {get} /api/v1/accounts/admin
 * 
 * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
 * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
 */
router.get(
  '/admin',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin),
  async (req, res) => {
    var result;
    var startIndex = 0;
    var maxResults = 25;
    var typeString = "";

    if (req.query.startIndex) {
      startIndex = req.query.startIndex;
    }
    if (req.query.maxResults) {
      maxResults = req.query.maxResults;
    }
    if (req.query.type) {
      typeString = req.query.type;
    }

    var q = Data.aggregate([
      { $match: { $and: [{ type: typeString }] } },
      { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
    ]).skip(parseInt(startIndex)).limit(parseInt(maxResults));
    q.exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      result = res.json({ success: true, data: data });
    });
    
    return result;
  });

/**
* {get} /api/v1/accounts
* 
* Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
* The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
*/
router.get(
  '/',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
    var result;
    var startIndex = 0;
    var maxResults = 25;
    var typeString = "";
    var idString = "";

    if (req.query.startIndex) {
      startIndex = req.query.startIndex;
    }
    if (req.query.maxResults) {
      maxResults = req.query.maxResults;
    }
    if (req.query.type) {
      typeString = req.query.type;
    }
    if (req.query.id) {
      idString = req.query.id;
    }

    var q = Data.aggregate([
      { $match: { $and: [{ type: typeString }, { authors: parseInt(idString) }] } },
      { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
    ]).skip(parseInt(startIndex)).limit(parseInt(maxResults));
    q.exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      result = res.json({ success: true, data: data });
    });
    return result;
  });

/**
 * {put} /api/v1/accounts/status
 * 
 * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
 * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
 */
router.put(
  '/status',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin),
  async (req, res) => {
    const { id, activeflag } = req.body;

    try {
      let tool = await Data.findOneAndUpdate({ id: id }, { $set: { activeflag: activeflag } });
      if (!tool) {
        return res.status(400).json({ success: false, error: 'Tool not found' });
      }

      if (tool.authors) {
        tool.authors.forEach(async (authorId) => {
          await createMessage(authorId, id, tool.name, tool.type, activeflag);
        });
      }
      await createMessage(0, id, tool.name, tool.type, activeflag);

      await createDiscourseTopic(tool);
      await sendEmailNotifications(tool, activeflag);


      return res.json({ success: true });

    } catch (err) {
      console.log(err);
      return res.status(500).json({ success: false, error: err });
    }
  });

module.exports = router;

async function createMessage(authorId, toolId, toolName, toolType, activeflag) {
  let message = new MessagesModel();
  const toolLink = process.env.homeURL + '/tool/' + toolId;

  if (activeflag === 'active') {
    message.messageType = 'approved';
    message.messageDescription = `Your ${toolType} ${toolName} has been approved and is now live ${toolLink}`
  } else if (activeflag === 'archive') {
    message.messageType = 'rejected';
    message.messageDescription = `Your ${toolType} ${toolName} has been rejected ${toolLink}`
  }
  message.messageID = parseInt(Math.random().toString().replace('0.', ''));
  message.messageTo = authorId;
  message.messageObjectID = toolId;
  message.messageSent = Date.now();
  message.isRead = false;
  await message.save();
}

async function sendEmailNotifications(tool, activeflag) {
  const emailRecipients = await UserModel.find({ $or: [{ role: 'Admin' }, { id: { $in: tool.authors } }] });
  const toolLink = process.env.homeURL + '/tool/' + tool.id + '/' + tool.name
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  let subject;
  let html;
  //build email
  if (activeflag === 'active') {
    subject = `Your ${tool.type} ${tool.name} has been approved and is now live`
    html = `Your ${tool.type} ${tool.name} has been approved and is now live <br /><br />  ${toolLink}`
  } else if (activeflag === 'archive') {
    subject = `Your ${tool.type} ${tool.name} has been rejected`
    html = `Your ${tool.type} ${tool.name} has been rejected <br /><br />  ${toolLink}`
  }

  for (let emailRecipient of emailRecipients) {
    const msg = {
      to: emailRecipient.email,
      from: `${hdrukEmail}`,
      subject: subject,
      html: html
    };
    await sgMail.send(msg);
  }
}
