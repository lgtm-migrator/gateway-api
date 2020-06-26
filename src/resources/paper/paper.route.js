import express from 'express'
import { Data } from '../tool/data.model'

const router = express.Router();

/**
 * {get} /paper​/:paper​ID Paper
 * 
 * Return the details on the paper based on the tool ID.
 */
router.get('/:paperID', async (req, res) => {
    var q = Data.aggregate([
        { $match: { $and: [{ id: parseInt(req.params.paperID) }] } },
        { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
    ]);
    q.exec((err, data) => {
        var p = Data.aggregate([
            { $match: { $and: [{ "relatedObjects": { $elemMatch: { "objectId": req.params.paperID } } }] } },
        ]);
        p.exec((err, relatedData) => {
            relatedData.forEach((dat) => {
                dat.relatedObjects.forEach((x) => {
                    if (x.objectId === req.params.paperID && dat.id !== req.params.paperID) {
                        if (typeof data[0].relatedObjects === "undefined") data[0].relatedObjects=[];
                        data[0].relatedObjects.push({ objectId: dat.id, reason: x.reason, objectType: dat.type })
                    }
                })
            });

            if (err) return res.json({ success: false, error: err });
            return res.json({ success: true, data: data });
        });
    });
});

module.exports = router;