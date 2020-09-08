import { MessagesModel } from '../message/message.model';

const triggerNotificationMessage = (messageRecipients, messageDescription, messageType, messageObjectID) => {
  messageRecipients.forEach(async (recipient) => {
    let messageID = parseInt(Math.random().toString().replace('0.', ''));
    let message = new MessagesModel({
      messageType,
      messageSent: Date.now(),
      messageDescription,
      isRead: false,
      messageID,
      messageObjectID : (typeof messageObjectID == 'number' ? messageObjectID : messageID),
      messageTo: recipient,
      messageDataRequestID: messageType === 'data access request' ? messageObjectID : null
    });
    await message.save(async (err) => {
      if (err) {
          console.error(`Failed to save ${messageType} message with error : ${err}`);
        }
    });
  });
}
module.exports.triggerNotificationMessage = triggerNotificationMessage;
