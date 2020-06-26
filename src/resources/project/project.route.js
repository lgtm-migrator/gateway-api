import express from 'express'
import { Data } from '../tool/data.model'

const router = express.Router();

/**
 * {get} /project​/:project​ID Project
 * 
 * Return the details on the tool based on the tool ID.
 */
router.get('/:projectID', async (req, res) => {
    var q = Data.aggregate([
        { $match: { $and: [{ id: parseInt(req.params.projectID) }] } },
        { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
    ]);
    q.exec((err, data) => {
        var p = Data.aggregate([
            { $match: { $and: [{ "relatedObjects": { $elemMatch: { "objectId": req.params.projectID } } }] } },
        ]);
        p.exec((err, relatedData) => {
            relatedData.forEach((dat) => {
                dat.relatedObjects.forEach((x) => {
                    if (x.objectId === req.params.projectID && dat.id !== req.params.projectID) {
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