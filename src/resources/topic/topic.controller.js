import express from 'express';
import mongoose from 'mongoose';
import { TopicModel } from './topic.model';
import { Data as ToolModel } from '../tool/data.model';

module.exports = {
    // POST /api/v1/topics
    postTopic: async (req, res) => {
        try {

            // TODO Lookup teams and insert into recipients

            let subTitle = '';

            let {_id: createdBy} = req.user;

            const { relatedEntity } = req.body;

            if(!relatedEntity)
                return res.status(404).json({ success: false, message: 'No related entity.' });

            const tool = await ToolModel.findById(relatedEntity);

            if(!tool)
                return res.status(404).json({ success: false, message: 'Tool not found.' });

            // deconstruct tool
            let { name: title, type, datasetfields } = tool;

            switch(type) {
                case 'dataset':
                    ({publisher: subTitle} = datasetfields);
                    break;
                default:
                    console.log('default');
            }

            console.log(`FIELDS ${title} ${subTitle}`);

            const topic = await TopicModel.create({
                title,
                subTitle,
                relatedEntity,
                createdBy,
                createdDate: Date.now(),
                recipients: [
                    "5e6f984a0a7300dc8f6fb195", 
                    "5eb29430861979081c1f6acd", 
                    "5eb2f98760ac5289acdd2511", 
                    "5ec3e1a996d46c775670a88d", 
                    "5ede1713384b64b655b9dd13", 
                    "5f03530178e28143d7af2eb1"
                ]
            });
    
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
                return res.status(401).json({ success: false, message: 'An error occured' });
                    
            return res.status(200).json({ success: true, topic});
        }
        catch (err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    }
}
