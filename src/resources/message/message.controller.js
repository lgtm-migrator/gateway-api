import { MessagesModel } from './message.model';
import _ from 'lodash';
import { TopicModel } from '../topic/topic.model';
import mongoose from 'mongoose';

const topicController = require('../topic/topic.controller');

module.exports = {
    // POST /api/v1/messages
    createMessage: async (req, res) => {
        try {
            const { _id: createdBy } = req.user
            let { type = 'notification', topic = '', messageDescription, relatedObjectId } = req.body;
            // 1. If the message type is 'message' and topic id is empty
            if(_.isEmpty(topic) && type === 'message')
            {
                //2. Create new topic
                const topicObj = await topicController.buildTopic({createdBy, relatedObjectId});
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
                type
            });
            // 6. Return 500 error if message was not successfully created
            if(!message) 
                return res.status(500).json({ success: false, message: 'Could not save message to database.' });

            // 7. Email recipients who have opted in to email communications
            
                   
            // 8. Return successful response with message data
            return res.status(201).json({ success: true, data: { message }});
        } catch (err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    },
    // DELETE api/v1/messages/:id
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
    
    // GET api/v1/messages
    // updateMessage: async(req, res) => {
    //     // check if user / publisher
    //     try {
    //         let {_id: userId} = req.user;

    //         const topics = await TopicModel.find({ 
    //             recipients: { $elemMatch : { $eq: userId }},
    //             status: 'active'
    //         });

    //         if (!topics) 
    //             return res.status(401).json({ success: false, message: 'An error occured' });
                    
    //         return res.status(200).json({ success: true, topics});

    //     } catch(err) {
    //         console.error(err.message);
    //         return res.status(500).json(err);
    //     }
    // }
}
