import express from 'express'
import { Data } from '../tool/data.model'
import { MessagesModel } from '../message/message.model'
import { utils } from "../auth";
import passport from "passport";
import { ROLES } from '../user/user.roles'
import { UserModel } from '../user/user.model'
const asyncModule = require('async');
const hdrukEmail = `enquiry@healthdatagateway.org`;

const sgMail = require('@sendgrid/mail');

const router = express.Router()

// @router   POST /api/v1/mytools/add
// @desc     Add tools user
// @access   Private
router.post('/add',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
    let data = new Data();
    const toolCreator = req.body.toolCreator;

    const { type, name, link, description, categories, license, authors, tags, journal, journalYear, relatedObjects } = req.body;
    data.id = parseInt(Math.random().toString().replace('0.', ''));
    data.type = type;
    data.name = name;
    data.link = link;
    data.journal = journal;
    data.journalYear = journalYear;
    data.description = description;
    console.log(req.body)
    if (categories && typeof categories !== undefined) data.categories.category = categories.category;
    if (categories && typeof categories !== undefined) data.categories.programmingLanguage = categories.programmingLanguage;
    if (categories && typeof categories !== undefined) data.categories.programmingLanguageVersion = categories.programmingLanguageVersion;
    data.license = license;
    data.authors = authors;
    data.tags.features = tags.features;
    data.tags.topics = tags.topics;
    data.activeflag = 'review';
    data.updatedon = Date.now();
    data.relatedObjects = relatedObjects;
    
    data.save((err) => {
      let message = new MessagesModel();
      message.messageID = parseInt(Math.random().toString().replace('0.', ''));
      message.messageTo = 0;
      message.messageObjectID = data.id;
      message.messageType = 'add';
      message.messageDescription = `Approval needed: new ${data.type} added ${name}`
      message.messageSent = Date.now();
      message.isRead = false;
      message.save(async (err) => {
        if (err) {
          return res.json({ success: false, error: err });
        } else {

          // send email to Admin when new tool or project has been added
          const emailRecipients = await UserModel.find({ role: 'Admin' });
          const toolLink = process.env.homeURL + '/tool/' + data.id + '/' + data.name

          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          for (let emailRecipient of emailRecipients) {
            const msg = {
              to: emailRecipient.email,
              from: `${hdrukEmail}`,
              subject: `A new ${data.type} has been added and is ready for review`,
              html: `Approval needed: new ${data.type} ${data.name} <br /><br />  ${toolLink}`
            };
            await sgMail.send(msg);
          }

          if (data.type === 'tool') {
            sendEmailNotificationToAuthors(data, toolCreator);
          }

          return res.json({ success: true, id: data.id });
        }
      });
    })
    storeNotificationsForAuthors(data, toolCreator);
  });

/**
* {put} /mytools/edit Edit tool
* 
* Authenticate user to see if page should be displayed.
* Authenticate user and then pull the data for the tool from the DB.
* When they submit, authenticate the user, validate the data and update the tool data on the DB.
* (If we are going down the versions route then we will add a new version of the data and increase the version i.e. v1, v2)
*/
router.put(
  '/edit',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
    const toolCreator = req.body.toolCreator;
    var { id, type, name, link, description, categories, license, authors, tags, journal, journalYear, relatedObjects } = req.body;
    
    if (!categories || typeof categories === undefined) categories = {'category':'', 'programmingLanguage':[], 'programmingLanguageVersion':''}
    
    let data = {
      id: id,
      name: name,
      authors: authors,
    };

    Data.findOneAndUpdate({ id: id },
      {
        type: type,
        name: name,
        link: link,
        description: description,
        journal: journal,
        journalYear: journalYear,
        categories: {
          category: categories.category,
          programmingLanguage: categories.programmingLanguage,
          programmingLanguageVersion: categories.programmingLanguageVersion
        },
        license: license,
        authors: authors,
        tags: {
          features: tags.features,
          topics: tags.topics
        },
        relatedObjects: relatedObjects
      }, (err) => {
        if (err) {
          return res.json({ success: false, error: err });
        }
      }).then(() => {
        if (type === 'tool') {
          sendEmailNotificationToAuthors(data, toolCreator);
          storeNotificationsForAuthors(data, toolCreator);
        }
        return res.json({ success: true });
      })
  });

/**
* {delete} /mytools/delete Delete tool
* 
* Authenticate user to see if page should be displayed.
* When they detele, authenticate user and then delete the tool data and review data from the DB
*/
router.delete('/delete', async (req, res) => {
  const { id } = req.body;
  Data.findOneAndDelete({ id: id }, (err) => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});


module.exports = router

async function sendEmailNotificationToAuthors(tool, toolOwner) {
  //Get email recipients 
  const toolLink = process.env.homeURL + '/tool/' + tool.id
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  (await UserModel.find({ id: { $in: tool.authors } }))
    .forEach(async (user) => {
      const msg = {
        to: user.email,
        from: `${hdrukEmail}`,
        subject: `${toolOwner.name} added you as an author of the tool ${tool.name}`,
        html: `${toolOwner.name} added you as an author of the tool ${tool.name} <br /><br />  ${toolLink}`
      };
      // await sgMail.send(msg);
    });
}

async function storeNotificationsForAuthors(tool, toolOwner) {
  //store messages to alert a user has been added as an author
  const toolLink = process.env.homeURL + '/tool/' + tool.id

  //normal user
  tool.authors.push(0);
  asyncModule.eachSeries(tool.authors, async (author) => {

    let message = new MessagesModel();
    message.messageType = 'author';
    message.messageSent = Date.now();
    message.messageDescription = `${toolOwner.name} added you as an author of the ${tool.type} ${tool.name}`
    message.isRead = false;
    message.messageObjectID = tool.id;
    message.messageID = parseInt(Math.random().toString().replace('0.', ''));
    message.messageTo = author;

    await message.save(async (err) => {
      if (err) {
        return new Error({ success: false, error: err });
      }
      return { success: true, id: message.messageID };
    });
  });
}