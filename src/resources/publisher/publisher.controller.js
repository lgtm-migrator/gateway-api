import mongoose from 'mongoose';
import { PublisherModel } from './publisher.model';
import { DataRequestModel } from '../datarequest/datarequest.model';
import { Data } from '../tool/data.model';
import _ from 'lodash';

module.exports = {
    // GET api/v1/publishers/:id
    getPublisherById: async(req, res) => {
        try {
            // 1. Get the publisher from the database
            const publisher = await PublisherModel.findOne({name: req.params.id});
            if(!publisher) {
                return res.status(200).json({ success: true, publisher: { dataRequestModalContent: {}, allowsMessaging: false } });
            }
            // 2. Return publisher
            return res.status(200).json({ success: true, publisher });
        } catch (err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    },

    // GET api/v1/publishers/:id/datasets
    getPublisherDatasets: async(req, res) => {
        try {
            // 1. Get the datasets for the publisher from the database
            let datasets = await Data.find({ type: 'dataset', 'datasetfields.publisher': req.params.id }).populate('publisher').select('datasetid name description datasetfields.abstract _id datasetfields.publisher datasetfields.contactPoint publisher');
            if(!datasets) {
                return res.status(404).json({ success: false });
            }
            // 2. Map datasets to flatten datasetfields nested object
            datasets = datasets.map(dataset => {
				let { _id, datasetid: datasetId, name, description, publisher:publisherObj, datasetfields: { abstract, publisher, contactPoint }} = dataset;
				return { _id, datasetId, name, description, abstract, publisher, publisherObj, contactPoint };
			});
            // 3. Return publisher datasets
            return res.status(200).json({ success: true, datasets });
        } catch (err) {
            console.error(err.message);
            return res.status(500).json(err);
        }
    },

    // GET api/v1/publishers/:id/dataaccessrequests
    getPublisherDataAccessRequests: async (req, res) => {
        try {
        // 1. Deconstruct the request
        let { _id } = req.user;
        
        // 2. Lookup publisher team
        const publisher = await PublisherModel.findOne({name: req.params.id}).populate('team', 'members');
        if(!publisher) {
            return res.status(404).json({ success: false });
        }

        // 3. Check the requesting user is a member of the custodian team
        let found = false
        if(_.has(publisher.toObject(), 'team.members')) {
            let { members } = publisher.team.toObject();
            found = members.some(el => el.memberid.toString() === _id.toString());
        }

        if(!found)
            return res.status(401).json({status: 'failure', message: 'Unauthorised'});

        // 4. Find all datasets owned by the publisher (no linkage between DAR and publisher in historic data)
        let datasetIds = await Data.find({ type: 'dataset', 'datasetfields.publisher': req.params.id }).distinct('datasetid');

        // 5. Find all applications where any datasetId exists
        let applications = await DataRequestModel.find( { $or: [{dataSetId:{ $in:datasetIds }}, {datasetIds:{$elemMatch:{ $in:datasetIds }}}]}).sort({"updatedAt": -1}).populate('datasets dataset mainApplicant');

        // 6. Return all applications
        return res.status(200).json({ success: true, data: applications });
        } catch(err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'An error occurred searching for custodian applications' });
        }
    }
}
