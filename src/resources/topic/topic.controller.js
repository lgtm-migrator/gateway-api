import mongoose from 'mongoose';
import { TopicModel } from './topic.model';
import { Data as ToolModel } from '../tool/data.model';
import _ from 'lodash';
module.exports = {
    buildRecipients: async (team, createdBy) => {
        // 1. Cause error if no members found
        if(_.isNull(team)) {
            console.error('A topic cannot be created without a receiving team');
            return [];
        }
        let { members } = team;
        if(_.isNull(members || members.length === 0)) {
            console.error('A topic cannot be created with only the creating user');
            return [];
        }
        let recipients = members.map(m => m.memberid);
        // 2. Return team recipients plus the user that created the message
        recipients = [...recipients, createdBy];
        return recipients;
    },
    buildTopic: async (context) => {
        try {
            let subTitle = '';
            let datasets = [];
            let tags = [];
            const { createdBy, relatedObjectIds } = context;
            // 1. Topic cannot be created without related object i.e. data/project/tool/paper
            if(_.isEmpty(relatedObjectIds)) {
                console.error('No related object Id passed to build topic');
                return undefined;
            }
            // 2. Find the related object(s) in MongoDb and include team data
            const tools = await ToolModel.find().where('_id').in(relatedObjectIds).populate({ path: 'publisher', populate: { path: 'team' }});
            // 3. Return undefined if no object exists
            if(_.isEmpty(tools)) {
                console.error(`Failed to find related tool(s) with objectId(s): ${relatedObjectIds.join(', ')}`);
                return undefined;
            }
            // 4. Iterate through each tool
            tools.forEach(tool => {
                // 5. Switch based on related object type
                switch(tool.type) {
                    // 6. If dataset, we require the publisher
                    case 'dataset':
                        let { name: datasetTitle, datasetid = '' } = tool;
                        subTitle = _.isEmpty(subTitle) ? datasetTitle : `${subTitle}, ${datasetTitle}`
                        datasets.push({ datasetId: datasetid, publisher: title });
                        tags.push(datasetTitle);
                        break;
                    default:
                        console.log('default');
                }
            });
            // 7. Get recipients for topic/message using the first tool (same team exists as each publisher is the same)
            let { publisher = '' } = tools[0];
            if(_.isEmpty(publisher)) {
                console.error(`No publisher associated to this dataset`);
                return undefined;
            }
            let { team = [] } = publisher;
            if(_.isEmpty(team)) {
                console.error(`No team associated to publisher, cannot message`);
                return undefined;
            }
            const recipients = await module.exports.buildRecipients(team, createdBy);
            if(_.isEmpty(recipients)) {
                console.error('A topic cannot be created without recipients');
                return undefined;
            }
            // Future extension could be to iterate through tools at this point to generate a topic for each publisher
            // This also requires refactor of above code to break down dataset titles into individual messages
            // 8. Create new topic against related objects with recipients
            const topic = await TopicModel.create({
                title,
                subTitle,
                relatedObjectIds,
                createdBy,
                createdDate: Date.now(),
                recipients,
                datasets,
                tags
            });
            // 9. Return created object
            return topic;
        } catch (err) {
            console.error(err.message);
            return undefined;
        }
    },
    findTopic: async (topicId, userId) => {
        try {
            const topic = await TopicModel.findOne({ 
                    _id: new mongoose.Types.ObjectId(topicId), 
                    recipients: { $elemMatch : { $eq: userId }}
            });
            if (!topic) 
                return undefined
            // Append property to indicate the number of unread messages
            topic.topicMessages.forEach(message => {
                if(!message.readBy.includes(userId)) {
                    topic.unreadMessages ++;
                }
            })
            return topic;
        }
        catch (err) {
            console.error(err.message);
            return undefined;
        }
    },
    // POST /api/v1/topics
    createTopic: async (req, res) => {
        try {
            const { _id: createdBy } = req.user;
            const { relatedObjectIds } = req.body;
            const topic = await buildTopic({createdBy, relatedObjectIds });
            if(!topic)
                return res.status(500).json({ success: false, message: 'Could not save topic to database.' });
                return res.status(201).json({ success: true, topic }); 
        } catch (err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    },
    // DELETE api/v1/topics/:id
    deleteTopic: async(req, res) => { 
        try {
            const { id } = req.params;
            if(!id) 
                return res.status(404).json({ success: false, message: 'Topic Id not found.' });
            const topic = await TopicModel.findByIdAndUpdate( id, { isDeleted: true, status: 'closed', expiryDate: Date.now() }, {new: true});
            console.log(topic);
            return res.status(204).json({success: true});
        } catch (err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    },
    // GET api/v1/topics
    getTopics: async(req, res) => {
        // check if user / publisher
        try {
            let {_id: userId} = req.user;
            const topics = await TopicModel.find({ 
                recipients: { $elemMatch : { $eq: userId }},
                status: 'active'
            });
            // Append property to indicate the number of unread messages
            topics.forEach(topic => {
                topic.unreadMessages = 0;
                topic.topicMessages.forEach(message => {
                    if(!message.readBy.includes(userId)) {
                        topic.unreadMessages ++;
                    }
                    // Calculate last unread message date at topic level
                    topic.lastUnreadMessage = topic.topicMessages.reduce((a, b) => {
                        console.log (Date(a.createdDate) > new Date(b.createdDate) ? a : b);
                        return (new Date(a.createdDate) > new Date(b.createdDate) ? a : b).createdDate;
                    });
                })
            });
            // Sort topics by most unread first followed by created date
            topics.sort((a, b) => b.unreadMessages - a.unreadMessages || b.lastUnreadMessage - a.lastUnreadMessage || b.createdDate - a.createdDate);
            return res.status(200).json({ success: true, topics });
        } catch(err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    },
    // GET api/v1/topics/:id
    getTopicById: async(req, res) => {
        try {
            // 1. Get the topic from the database
            const topic = await module.exports.findTopic(req.params.id, req.user._id);
            // 2. Keep a copy of the unmodified topic for returning in this response
            const dispatchTopic = topic.toJSON();
            if(!topic)
                return res.status(404).json({ success: false, message: 'Could not find topic specified.' });
            // 3. If there any unread messages, mark them as read 
            if(topic.unreadMessages > 0) {
                topic.topicMessages.forEach(async (message) => {
                    message.readBy.push(req.user._id)
                    await message.save();
                });
                topic.unreadMessages = 0;
                // 4. Save topic to Mongo
                await topic.save();
            }
            // 5. Return original topic so unread messages are displayed correctly
            return res.status(200).json({ success: true, topic: dispatchTopic });
        } catch (err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    }
}