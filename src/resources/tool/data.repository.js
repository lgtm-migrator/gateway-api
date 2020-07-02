import { Data } from './data.model';
import { MessagesModel } from '../message/message.model'
import { UserModel } from '../user/user.model'
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
    let { id, type, name, link, description, categories, license, authors, tags, journal, journalYear, relatedObjects } = req.body;
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
      }).then(() => {
        if (type === 'tool') {
          sendEmailNotificationToAuthors(data, toolCreator);
          storeNotificationsForAuthors(data, toolCreator);
        }
        resolve(id);
      });
    });
  };

  const deleteTool = async(req, res) => {
    return new Promise(async(resolve, reject) => {
      const { id } = req.body;
      Data.findOneAndDelete({ id: id }, (err) => {
        if (err) reject(err);

        resolve(id);
      });
    })
  };

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

export { addTool, editTool, deleteTool }