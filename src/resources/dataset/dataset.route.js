import express from 'express'
import { Data } from '../tool/data.model'
import { loadDataset, loadDatasets } from './dataset.service';
import { getToolsAdmin } from '../tool/data.repository';
const router = express.Router();


router.post('/', async (req, res) => {
    //Check to see if header is in json format
    var parsedBody = {}
    if (req.header('content-type') === 'application/json') {
        parsedBody = req.body;
    } else {
        parsedBody = JSON.parse(req.body);
    }
    //Check for key
    if (parsedBody.key !== process.env.cachingkey) {
        return res.json({ success: false, error: "Caching failed" });
    }

    loadDatasets(parsedBody.override || false);
    return res.json({ success: true, message: "Caching started" });
});

router.get('/:datasetID', async (req, res) => {
    var q = Data.aggregate([
        { $match: { $and: [{ datasetid: req.params.datasetID }] } }
    ]);
     q.exec(async (err, data) => {
        if (data.length === 0) data[0] = await loadDataset(req.params.datasetID)

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
            return res.json({ success: true, data: data });
        });
    });
});


// @router   GET /api/v1/
// @desc     Returns List of Dataset Objects No auth
//           This unauthenticated route was created specifically for API-docs
// @access   Public
router.get(
    '/',
    async (req, res) => {
      req.params.type = 'dataset';
        await getToolsAdmin(req)
          .then((data) => {
            return res.json({ success: true, data });
          })
          .catch((err) => {
            return res.json({ success: false, err });
          });
    }
  );

module.exports = router;