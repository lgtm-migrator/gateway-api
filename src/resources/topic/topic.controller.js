import express from 'express';
import { TopicModel } from './topic.model';
import { Data as ToolModel } from '../tool/data.model';

module.exports = {
    // POST /api/v1/topics
    postTopic: async (req, res) => {
        try {

            // TODO Lookup teams and insert into recipients

            let subTitle = '';

            let {id: createdBy} = req.user;

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
                recipients: [947228017269611, 6818273838765221, 5385077600698822, 6936200071297669, 21385050357328940, 6689395059831886]
            });
    
            if(!topic) 
                return res.status(500).json({ success: false, message: 'Could not save topic to database.' });
            
            
            return res.status(201).json({ success: true, data: { topic }});
    
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
            let {id: userId} = req.user;
            TopicModel.aggregate([
                // add in the currentUser as userId
                { $addFields: { "userId": userId }},
                // find if status active and user in recipients arr
                { $match: { $and: [ { status: 'active' }, { userId: { $in: recipients} } ]}},
                // project
                { $project: { _id: 1, title: 1, subTitle: 1, status: 1, createdDate: 1 }}
            ]).exec(err, result => {
                if(err)
                    return res.status(401).json({ success: false, message: 'No topics found.' });

                    return res.status(200).json({ success: true, data: { result }});
            })

        } catch(err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    },
    // GET api/v1/topics/:id
    getTopicById: async(req, res) => {
        try {
            let {id: userId } = req.user;
            TopicModel.aggregate([
                // Find topic Id
                { $match: { _id: req.params.id } },
                // add in the currentUser as userId
                { $addFields: { "userId": userId }},
                // find if user in recipients
                { $match: {userId: { $in : 'recipients' }}},
                // Perform lookup to messages
                { $lookup: { from: 'messages', localField: '_id', foreignField: 'topicId', as: 'messages' } },
                // lookup user as not using documentObjectId
                { $lookup: { from: 'users', localField: 'id', foreignField: 'id', as: 'user' } },
                // Reduce response payload 
                { $project: { 
                        _id: 1, 
                        title: 1, 
                        subTitle: 1, 
                        recipients: 1, 
                        status: 1, 
                        createdDate: 1, 
                        createdBy: { 
                            firstname: '$user.firstname', 
                            lastname: '$user.lastname', 
                            id: '$user.id' }, 
                        'messages': 1 
                    } 
                }
            ]).exec((err, result) => {
                if (err) {
                    return res.status(401).json({ success: false, message: err.message });
                }
                return res.status(200).json({ success: true, data: { result }});
            });
        }
        catch (err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    }
}
