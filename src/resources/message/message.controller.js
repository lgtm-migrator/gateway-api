import { MessagesModel } from './message.model';
import _ from 'lodash';
import { TopicModel } from '../topic/topic.model';
import mongoose from 'mongoose';
import { UserModel } from '../user/user.model';
import emailGenerator from '../utilities/emailGenerator.util';

const topicController = require('../topic/topic.controller');

module.exports = {
    // POST /api/v1/messages
    createMessage: async (req, res) => {
        try {
            const { _id: createdBy } = req.user
            let { type = 'notification', topic = '', messageDescription, relatedObjectId } = req.body;
            let topicObj = {};
            // 1. If the message type is 'message' and topic id is empty
            if(_.isEmpty(topic) && type === 'message')
            {
                //2. Create new topic
                topicObj = await topicController.buildTopic({createdBy, relatedObjectId});
                // 3. If topic was not successfully created, throw error response
                if(!topicObj) 
                    return res.status(500).json({ success: false, message: 'Could not save topic to database.' });
                // 4. Pass new topic Id and set message type
                topic = topicObj._id;
            } 
            // 5. Create new message
            const message = await MessagesModel.create({
                messageID: parseInt(Math.random().toString().replace('0.', '')),
                messageTo: 0,
                messageObjectID: parseInt(Math.random().toString().replace('0.', '')),
                messageDescription,
                topic,
                createdBy,
                type,
                readBy: [new mongoose.Types.ObjectId(createdBy)]
            });
            // 6. Return 500 error if message was not successfully created
            if(!message) 
                return res.status(500).json({ success: false, message: 'Could not save message to database.' });
            // 7. Prepare to send email if a new message has been created
            if(type === 'message') {
                if(_.isEmpty(topicObj)) {
                    topicObj = await topicController.getTopicById(topic);
                }
                // 8. Find recipients who have opted in to email updates and exclude the requesting user
                let messageRecipients = await UserModel.find({ _id: { $in: topicObj.recipients } }).populate('additionalInfo');
                let optedInEmailRecipients = [...messageRecipients].filter(function(user) {
                let { additionalInfo: { emailNotifications }, _id} = user;
                    console.log(user);
                    console.log(_id);
                    return emailNotifications === true && _id.toString() !== createdBy.toString();
                });
                const hdrukEmail = `enquiry@healthdatagateway.org`;
                // 9. Send email
                emailGenerator.sendEmail(
                    optedInEmailRecipients,
                    `${hdrukEmail}`,
                    `You have received a new message on the HDR UK Innovation Gateway`,
                    `You have received a new message on the HDR UK Innovation Gateway. <br> Log in to view your messages here : <a href='${process.env.homeURL}'>HDR UK Innovation Gateway</a>`
                );
            }
            // 10. Return successful response with message data
            return res.status(201).json({ success: true, data: { message }});
        } catch (err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    },
    // DELETE /api/v1/messages/:id
    deleteMessage: async(req, res) => {
        try {
            const { id } = req.params;
            const { _id: userId } = req.user;
            // 1. Return not found error if id not passed
            if(!id) 
                return res.status(404).json({ success: false, message: 'Message Id not found.' });
            // 2. Get message by Id from MongoDb
            const message = await MessagesModel.findOne({ _id: id });
            // 3. Return not found if message not found
            if(!message) {
                return res.status(404).json({ success: false, message: 'Message not found.' }); 
            }
            // 4. Check that the message was created by requesting user otherwise return unathorised
            if(message.createdBy.toString() !== userId.toString()) {
                return res.status(401).json({ success: false, message: 'Not authorised to delete this message' });
            }
            // 5. Delete message by id
            await MessagesModel.remove({ _id: id });
            // 6. Check attached topic for other messages to avoid orphaning topic documents
            const messagesCount = await MessagesModel.count({ topic:message.topic });
            // 7. If no other messages remain then delete the topic
            if(!messagesCount) {
                await TopicModel.remove({ _id: new mongoose.Types.ObjectId(message.topic) });
            }
            // 8. Return successful response
            return res.status(204).json({ success: true });
        } catch (err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    },
    
    // PUT /api/v1/messages
    updateMessage: async(req, res) => {
        try {
            let { _id: userId } = req.user;
            let { messageId, isRead, messageDescription = '', messageType = '' } = req.body;
            // 1. Return not found error if id not passed
            if(!messageId) 
                return res.status(404).json({ success: false, message: 'Message Id not found.' });
            // 2. Get message by object id
            const message = await MessagesModel.findOne(
                { _id: messageId }
            );
            // 3. Return not found if message not found
            if(!message) {
                return res.status(404).json({ success: false, message: 'Message not found.' }); 
            }
            // 4. Update message params - readBy is an array of users who have read the message
            if(isRead && !message.readBy.includes(userId.toString())) {
                message.readBy.push(userId);
            }    
            if(isRead) { message.isRead = isRead; }
            if(!_.isEmpty(messageDescription)) { message.messageDescription = messageDescription; }
            if(!_.isEmpty(messageType)) {message.messageType = messageType; }
            // 5. Save message to Mongo
            await message.save();
            // 5. Return success no content
            return res.status(204).json({ success:true });
        } catch(err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    },

    // GET api/v1/messages/unread/count
    getUnreadMessageCount: async(req, res) => {
        try {
            let {_id: userId } = req.user;

            const topics = await TopicModel.find({ 
                recipients: { $elemMatch : { $eq: userId }},
                status: 'active'
            });

            let unreadMessageCount = 0;

            topics.forEach(topic => {
                topic.topicMessages.forEach(message => {
                    if(!message.readBy.includes(userId)) {
                        unreadMessageCount ++;
                    }
                })
            });
                    
            return res.status(200).json({ success: true, count: unreadMessageCount });
        }
        catch (err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    }
}
