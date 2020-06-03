import express from 'express'

import { Data } from '../tool/data.model'

const router = express.Router();

router.get('/:datasetid', async (req, res) => {
    var q = Data.aggregate([
        {$match: { $and: [{datasetids: req.params.datasetid}, {type: "project"} ]}}
    ]);
    q.exec((err, data) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, data: data });
    });
});

module.exports = router;