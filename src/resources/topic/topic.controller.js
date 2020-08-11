import mongoose from 'mongoose';
import { TopicModel } from './topic.model';
import { Data as ToolModel } from '../tool/data.model';

module.exports = {
    // TODO Lookup teams and insert into recipients
    buildRecipients: async (teamId, createdBy) => {
        // NB Recipients to be injected once teams has been completed PMc
        return [
            "5e6f984a0a7300dc8f6fb195", 
            "5eb29430861979081c1f6acd", 
            "5eb2f98760ac5289acdd2511", 
            "5ec3e1a996d46c775670a88d", 
            "5ede1713384b64b655b9dd13", 
            "5f03530178e28143d7af2eb1"
        ];
    },
    buildTopic: async (context) => {
        try {
            let subTitle = '';
            const { createdBy, relatedObjectId} = context;
            // 1. Topic cannot be created without related object i.e. data/project/tool/paper
            if(!relatedObjectId)
                return undefined;
            // 2. Find the related object in MongoDb
            const tool = await ToolModel.findById(relatedObjectId);
            // 3. Return undefined if no object exists
            if(!tool)
                return undefined;
            // 4. Deconstruct tool props
            let { name: title, type, datasetfields } = tool;
            // 5. Switch based on related object type
            switch(type) {
                // If dataset, we require the publisher
                case 'dataset':
                    ({publisher: subTitle} = datasetfields);
                    break;
                default:
                    console.log('default');
            }
            // 6. Create new topic against related object with recipients
            const topic = await TopicModel.create({
                title,
                subTitle,
                relatedObjectId,
                createdBy,
                createdDate: Date.now(),
                recipients: buildRecipients(teamId, createdBy)
            });
            // 7. Return created object
            return topic;
        } catch (err) {
            console.error(err.message);
            return undefined;
        }
    },
    // POST /api/v1/topics
    createTopic: async (req, res) => {
        try {
            const { _id: createdBy } = req.user;
            const { relatedObjectId } = req.body;
            const topic = await buildTopic({createdBy, relatedObjectId});

            if(!topic)
                return res.status(500).json({ success: false, message: 'Could not save topic to database.' });

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

            if (!topics) 
                return res.status(401).json({ success: false, message: 'An error occured' });
                    
            return res.status(200).json({ success: true, topics});

        } catch(err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    },
    // GET api/v1/topics/:id
    getTopicById: async(req, res) => {
        try {
            let {_id: userId } = req.user;

            const topic = await TopicModel.findOne({ 
                    _id: new mongoose.Types.ObjectId(req.params.id), 
                    recipients: { $elemMatch : { $eq: userId }}
            });

            if (!topic) 
                return res.status(500).json({ success: false, message: 'An error occured' });
                    
            return res.status(200).json({ success: true, topic});
        }
        catch (err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    }
}
