import express from 'express'
import { Data } from '../tool/data.model'
import { loadDatasets } from './dataset.service';
const router = express.Router();


router.post('/', async (req, res) => {
    //Check for key
    if (req.body.key !== process.env.cachingkey) {
        return res.json({ success: false, error: "Caching failed" });
    }

    loadDatasets(req.body.override || false);
    return res.json({ success: false, message: "Caching started" });
});

router.get('/:datasetID', async (req, res) => {
    var q = Data.aggregate([
        { $match: { $and: [{ datasetid: req.params.datasetID }] } }
    ]);
     q.exec((err, data) => {
        var p = Data.aggregate([
            { $match: { $and: [{ "relatedObjects": { $elemMatch: { "objectId": req.params.datasetID } } }] } },
        ]);

        p.exec( async (err, relatedData) => {
            relatedData.forEach((dat) => {
                dat.relatedObjects.forEach((x) => {
                    if (x.objectId === req.params.datasetID && dat.id !== req.params.datasetID) {
                        if (typeof data[0].relatedObjects === "undefined") data[0].relatedObjects=[];
                        data[0].relatedObjects.push({ objectId: dat.id, reason: x.reason, objectType: dat.type, user: x.user, updated: x.updated })
                    }
                })
            });

            if (err) return res.json({ success: false, error: err });
            
            let discourseTopic = {};
            if (data[0].discourseTopicId) {
              discourseTopic = await findPostsByTopicId(data[0].discourseTopicId);
            }

          return res.json({ success: true, data: data, discourseTopic: discourseTopic });
        });
    });
});

module.exports = router;