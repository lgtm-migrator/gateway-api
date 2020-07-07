import { Data } from './data.model';
import { MessagesModel } from '../message/message.model'
import { UserModel } from '../user/user.model'
import { createDiscourseTopic } from '../discourse/discourse.service'
const asyncModule = require('async');
const hdrukEmail = `enquiry@healthdatagateway.org`;
const urlValidator = require('../utilities/urlValidator');
const sgMail = require('@sendgrid/mail');

export async function getObjectById(id) {
    return await Data.findOne({ id }).exec()
}

const addTool = async (req, res) => {
  return new Promise(async(resolve, reject) => {

      let {emailNotifications = false} = await getObjectById(req.user.id)
      console.log(emailNotifications);
      let data = new Data(); 
      const toolCreator = req.body.toolCreator; 
      const { type, name, link, description, categories, license, authors, tags, journal, journalYear, relatedObjects } = req.body;
      data.id = parseInt(Math.random().toString().replace('0.', ''));
      data.type = type;
      data.name = name;
      data.link = urlValidator.validateURL(link);  
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
      let newDataObj = await data.save();
      if(!newDataObj)
        reject(new Error(`Can't persist data object to DB.`));

      let message = new MessagesModel();
      message.messageID = parseInt(Math.random().toString().replace('0.', ''));
      message.messageTo = 0;
      message.messageObjectID = data.id;
      message.messageType = 'add';
      message.messageDescription = `Approval needed: new ${data.type} added ${name}`
      message.messageSent = Date.now();
      message.isRead = false;
      let newMessageObj = await message.save();
      if(!newMessageObj)
        reject(new Error(`Can't persist message to DB.`));

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
        await sendEmailNotificationToAuthors(data, toolCreator);
      }
      await storeNotificationsForAuthors(data, toolCreator);

      resolve(newDataObj);
    })
};


const editTool = async (req, res) => {
  return new Promise(async(resolve, reject) => {

    const toolCreator = req.body.toolCreator;
    let { type, name, link, description, categories, license, authors, tags, journal, journalYear, relatedObjects } = req.body;
    let id = req.params.id;
    link = urlValidator.validateURL(link); 
    
    let {emailNotifications = false} = await getObjectById(req.user.id)
    console.log(emailNotifications);

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
          reject(new Error(`Failed to update.`));
        }
      }).then((tool) => {
        if(tool == null){
          reject(new Error(`No record found with id of ${id}.`));
        } 
        else if (type === 'tool') {
          sendEmailNotificationToAuthors(data, toolCreator);
          storeNotificationsForAuthors(data, toolCreator);
        }
        resolve(tool);
      });
    });
  };

  const deleteTool = async(req, res) => {
    return new Promise(async(resolve, reject) => {
      const { id } = req.params.id;
      Data.findOneAndDelete({ id: req.params.id }, (err) => {
        if (err) reject(err);

        
      }).then((tool) => {
        if(tool == null){
          reject(`No Content`);
        }
        else{
          resolve(id);
        }
      }
    )
  })};

  const getToolsAdmin = async (req, res) => {
    return new Promise(async (resolve, reject) => {
      let startIndex = 0;
      let maxResults = 25;
      let typeString = "";
  
      if (req.query.startIndex) {
        startIndex = req.query.startIndex;
      }
      if (req.query.maxResults) {
        maxResults = req.query.maxResults;
      }
      if (req.params.type) {
        typeString = req.params.type;
      }
  
      let query = Data.aggregate([
        { $match: { $and: [{ type: typeString }] } },
        { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } },
        { $sort: { updatedAt : -1}}
      ])//.skip(parseInt(startIndex)).limit(parseInt(maxResults));
      query.exec((err, data) => {
        // if (err) return res.json({ success: false, error: err });
        if (err) reject({ success: false, error: err });
        resolve(data);
      });
    });
  }

  const getTools = async (req, res) => {
    return new Promise(async (resolve, reject) => {
      let startIndex = 0;
      let maxResults = 25;
      let typeString = "";
      let idString = req.user.id;
  
      if (req.query.startIndex) {
        startIndex = req.query.startIndex;
      }
      if (req.query.maxResults) {
        maxResults = req.query.maxResults;
      }
      if (req.params.type) {
        typeString = req.params.type;
      }
      if (req.query.id) {
        idString = req.query.id;
      }
  
      let query = Data.aggregate([
        { $match: { $and: [{ type: typeString }, { authors: parseInt(idString) }] } },
        { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } },
        { $sort: { updatedAt : -1}}
      ])//.skip(parseInt(startIndex)).limit(parseInt(maxResults));
      query.exec((err, data) => {
        if (err) reject({ success: false, error: err });
        resolve(data);
      });
    });
  }

  const setStatus = async (req, res) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { activeflag } = req.body;
        const id = req.params.id;
        
        // Get the emailNotification status for the current user
        let {emailNotifications = false} = await getObjectById(req.user.id)
      
        let tool = await Data.findOneAndUpdate({ id: id }, { $set: { activeflag: activeflag } });
        if (!tool) {
          reject(new Error('Tool not found'));
        }
  
        if (tool.authors) {
          tool.authors.forEach(async (authorId) => {
            await createMessage(authorId, id, tool.name, tool.type, activeflag);
          });
        }
        await createMessage(0, id, tool.name, tool.type, activeflag);
  
        if (!tool.discourseTopicId && tool.activeflag === 'active') {
          await createDiscourseTopic(tool);
        }
  
        if (emailNotifications)
          await sendEmailNotifications(tool, activeflag);
  
        resolve(id);
        
      } catch (err) {
        console.log(err);
        reject(new Error(err));
      }
    });
  };

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
        await sgMail.send(msg);
      });
  };

async function storeNotificationsForAuthors(tool, toolOwner) {
    //store messages to alert a user has been added as an author
    const toolLink = process.env.homeURL + '/tool/' + tool.id
  
    //normal user
    var toolCopy = JSON.parse(JSON.stringify(tool));
    
    toolCopy.authors.push(0);
    asyncModule.eachSeries(toolCopy.authors, async (author) => {
  
      let message = new MessagesModel();
      message.messageType = 'author';
      message.messageSent = Date.now();
      message.messageDescription = `${toolOwner.name} added you as an author of the ${toolCopy.type} ${toolCopy.name}`
      message.isRead = false;
      message.messageObjectID = toolCopy.id;
      message.messageID = parseInt(Math.random().toString().replace('0.', ''));
      message.messageTo = author;
  
      await message.save(async (err) => {
        if (err) {
          return new Error({ success: false, error: err });
        }
        return { success: true, id: message.messageID };
      });
    }); 
};

export { addTool, editTool, deleteTool, setStatus, getTools, getToolsAdmin }