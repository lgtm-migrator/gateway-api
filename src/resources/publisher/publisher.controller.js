import mongoose from 'mongoose';
import { PublisherModel } from './publisher.model';
import { Data } from '../tool/data.model';
import _ from 'lodash';

module.exports = {
    // GET api/v1/publishers/:id
    getPublisherById: async(req, res) => {
        try {
            // 1. Get the publisher from the database
            const publisher = await PublisherModel.findOne({name: req.params.id});
            if(!publisher) {
                return res.status(404).json({ success: false });
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
    }
}
