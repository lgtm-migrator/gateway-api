import express from 'express'
import { ROLES } from '../user/user.roles'
import passport from "passport";
import { utils } from "../auth";
// import { UserModel } from '../user/user.model'
import { Collections } from '../collections/collections.model';
import { MessagesModel } from '../message/message.model';
import { UserModel } from '../user/user.model'
const urlValidator = require('../utilities/urlValidator');
const sgMail = require('@sendgrid/mail');
const hdrukEmail = `enquiry@healthdatagateway.org`;

const router = express.Router()

router.get('/:collectionID', async (req, res) => { 
  var q = Collections.aggregate([
    { $match: { $and: [{ id: parseInt(req.params.collectionID) }] } },
    { $lookup: { from: "collections", localField: "authors", foreignField: "id", as: "persons" } }  
  ]);
  q.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});


router.put('/edit',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
    const collectionCreator = req.body.collectionCreator;
    var {id, name, description, imageLink, authors, relatedObjects } = req.body;
    imageLink = urlValidator.validateURL(imageLink); 

    console.log('req: ' + JSON.stringify(req.body))

    Collections.findOneAndUpdate({ id: id },
      {
        name: name,
        description: description,
        imageLink: imageLink,
        authors: authors,
        relatedObjects: relatedObjects
      }, (err) => {
        if(err) {
          return res.json({ success: false, error: err });
        }
      })    
  }); 


router.post('/add',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
    let collections = new Collections();

    const collectionCreator = req.body.collectionCreator;

    const {name, description, imageLink, authors, relatedObjects } = req.body;

    // Get the emailNotification status for the current user
    let {emailNotifications = false} = await getObjectById(req.user.id)

    collections.id = parseInt(Math.random().toString().replace('0.', ''));
    collections.name = name;
    collections.description = description;
    collections.imageLink = imageLink;
    collections.authors = authors;
    collections.relatedObjects = relatedObjects;
    collections.activeflag = 'active'; 

    try {
        if (collections.authors) {
          collections.authors.forEach(async (authorId) => {
            await createMessage(authorId, collections, collections.activeflag, collectionCreator);
          });
        }
        await createMessage(0, collections, collections.activeflag, collectionCreator);

        if(emailNotifications)
          await sendEmailNotifications(collections, collections.activeflag, collectionCreator);
      } catch (err) {
        console.log(err);
        // return res.status(500).json({ success: false, error: err });
      }

    collections.save((err) => {
        if (err) {
            return res.json({ success: false, error: err })
        } else {
          return res.json({ success: true, id: collections.id })
        }
    });

  }); 

  module.exports = router;

  async function createMessage(authorId, collections, activeflag, collectionCreator) {
    let message = new MessagesModel();
    
    //UPDATE WHEN COLLECTION PAGE IS CREATED AND AVAILABLE TO VIEW
    // const collectionLink = process.env.homeURL + '/collection/' + collectionId; 
    const collectionLink = process.env.homeURL; 
    const messageRecipients = await UserModel.find({ $or: [{ role: 'Admin' }, { id: { $in: collections.authors } }] });

    async function saveMessage() { 
      message.messageID = parseInt(Math.random().toString().replace('0.', ''));
      message.messageTo = authorId;
      message.messageObjectID = collections.id;
      message.messageSent = Date.now();
      message.isRead = false;
      await message.save();
    }

    if (authorId === 0) {
        message.messageType = 'added collection';
        message.messageDescription = `${collectionCreator.name} added a new collection: ${collections.name}.`
        saveMessage();
    }

    for (let messageRecipient of messageRecipients) {
      if (activeflag === 'active' && authorId === messageRecipient.id && authorId === collectionCreator.id){
        message.messageType = 'added collection';
        message.messageDescription = `Your new collection ${collections.name} has been added.`
        saveMessage();
      } 
      else if (activeflag === 'active' && authorId === messageRecipient.id && authorId !== collectionCreator.id) {
        message.messageType = 'added collection';
        message.messageDescription = `${collectionCreator.name} added you as a collaborator on the new collection ${collections.name}.`
        saveMessage();
      }
   }

    //UPDATE WHEN ARCHIVE/DELETE IS AVAILABLE FOR COLLECTIONS
    // else if (activeflag === 'archive') {
    //   message.messageType = 'rejected';
    //   message.messageDescription = `Your ${toolType} ${toolName} has been rejected ${collectionLink}`
    // }
  }
  
  async function sendEmailNotifications(collections, activeflag, collectionCreator) {

    const emailRecipients = await UserModel.find({ $or: [{ role: 'Admin' }, { id: { $in: collections.authors } }] });

    //UPDATE WHEN COLLECTION PAGE IS CREATED AND AVAILABLE TO VIEW
    // const collectionLink = process.env.homeURL + '/collection/' + collections.id + '/' + collections.name
    const collectionLink = process.env.homeURL;

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    let subject;
    let html;
    //build email
    emailRecipients.map((emailRecipient) => {
      if(activeflag === 'active' && emailRecipient.role === 'Admin'){
        subject = `New collection ${collections.name} has been added and is now live`
        html = `New collection ${collections.name} has been added and is now live <br /><br />  ${collectionLink}`
      }

      collections.authors.map((author) => {
        if(activeflag === 'active' && author === emailRecipient.id && author === collectionCreator.id){
          subject = `Your collection ${collections.name} has been added and is now live`
          html = `Your collection ${collections.name} has been added and is now live <br /><br />  ${collectionLink}`
        } else if (activeflag === 'active' && author === emailRecipient.id && author !== collectionCreator.id) {
          subject = `You have been added as a collaborator on collection ${collections.name}`
          html = `${collectionCreator.name} has added you as a collaborator to the collection ${collections.name} which is now live <br /><br />  ${collectionLink}`
        } 
      })
    })


    if (activeflag === 'active') {
      subject = `Your collection ${collections.name} has been approved and is now live`
      html = `Your collection ${collections.name} has been approved and is now live <br /><br />  ${collectionLink}`
    } 
     //UPDATE WHEN ARCHIVE/DELETE IS AVAILABLE FOR COLLECTIONS
    // else if (activeflag === 'archive') {
    //   subject = `Your collection ${collections.name} has been rejected`
    //   html = `Your collection ${collections.name} has been rejected <br /><br />  ${collectionLink}`
    // }
  
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
 