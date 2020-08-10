import { TopicModel } from './topic.model';
import { Data as ToolModel } from '../tool/data.model';
import e from 'express';

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

            if(!id ) 
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

        // if user get topics for created
    },
    // GET api/v1/topics/:id
    getTopicById: async(req, res) => {
        try {

            // TODO: check if user in recipients if not throw error

            // let {_id } = req.user;

            // virtual populate only for topicById
            const topic = await TopicModel.findById(req.params.id).populate('messages');
    
            if(!topic) {
                return res.status(400).json({ success: false, message: 'No dataset from meta data catalogue.' });
            }

            //
    
            return res.status(200).json({ success: true, data: { topic }});
        }
        catch (err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    }
}
