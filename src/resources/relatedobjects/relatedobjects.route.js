import express from 'express'
import { Data } from '../tool/data.model'
import axios from 'axios';

const router = express.Router();

/**
 * {get} /relatedobjects/:id
 * 
 * Return the details on the relatedobject based on the ID.
 */
router.get('/:id', async (req, res) => {
    var id = req.params.id;
    if (!isNaN(id)) {
        var q = Data.aggregate([
            { $match: { $and: [{ id: parseInt(id) }] } },
            { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
        ]);
        q.exec((err, data) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({ success: true, data: data });
        });
    }
    else {
        var q = Data.aggregate([
            { $match: { $and: [{ datasetid: id }] } }
        ]);
        q.exec((err, data) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({ success: true, data: data });
        });
    }
});

module.exports = router;