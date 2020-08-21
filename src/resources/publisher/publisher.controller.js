import mongoose from 'mongoose';
import { PublisherModel } from './publisher.model';
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
    }
}
