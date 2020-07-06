import express from 'express'

import { Data } from '../tool/data.model'

const router = express.Router();

router.get('/:datasetid', async (req, res) => {
    var p = Data.aggregate([
        { $match: { $and: [{ "relatedObjects": { $elemMatch: { "objectId": req.params.datasetid } } }] } },
    ]);
    p.exec((err, relatedData) => {
        var relatedObjects = [];
        relatedData.forEach((dat) => {
            dat.relatedObjects.forEach((x) => {
                console.log(x)
                if (x.objectId === req.params.datasetid && dat.id !== req.params.datasetid) {
                    relatedObjects.push({ objectId: dat.id, reason: x.reason, objectType: dat.type, user: x.user, updated: x.updated  })
                }
            })
        });
        console.log(relatedObjects)
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, data: relatedObjects });
    });
});

module.exports = router;