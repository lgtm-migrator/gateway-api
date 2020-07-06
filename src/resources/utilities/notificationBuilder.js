import { MessagesModel } from '../message/message.model';
const asyncModule = require('async');

const triggerNotificationMessage = (userId, messageDescription, messageType, messageObjectID) => {
  let messageRecipients = [0, userId];

  asyncModule.eachSeries(messageRecipients, async (recipient) => {
    let message = new MessagesModel();
    message.messageType = messageType;
    message.messageSent = Date.now();
    message.messageDescription = messageDescription;
    message.isRead = false;
    message.messageID = parseInt(Math.random().toString().replace('0.', ''));
    message.messageObjectID = (typeof messageObjectID == 'number' ? messageObjectID : message.messageID);  
    message.messageTo = recipient;

    await message.save(async (err) => {
      if (err) {
        return new Error({ success: false, error: err });
      }
      return { success: true, id: message.messageID };
    });
  });
};

module.exports.triggerNotificationMessage = triggerNotificationMessage;
