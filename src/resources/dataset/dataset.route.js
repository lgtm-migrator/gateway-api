import express from 'express'
import { Data } from '../tool/data.model'
import { loadDataset, loadDatasets } from './dataset.service';
import { getToolsAdmin } from '../tool/data.repository';
const router = express.Router();
const rateLimit = require("express-rate-limit");

const datasetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 10, // start blocking after 10 requests
    message: "Too many calls have been made to this api from this IP, please try again after an hour"
});

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

// @router   GET /api/v1/datasets/pidList
// @desc     Returns List of PIDs with linked datasetIDs
// @access   Public
router.get(
    '/pidList/',
    datasetLimiter,
    async (req, res) => {
        var q = Data.find(
            { "type" : "dataset", "pid" : { "$exists" : true } }, 
            { "pid" : 1, "datasetid" : 1 }
        ).sort({ "pid" : 1 });
        
        q.exec((err, data) => {
            var listOfPIDs = []
            
            data.forEach((item) => {
                if (listOfPIDs.find(x => x.pid === item.pid)) {
                    var index = listOfPIDs.findIndex(x => x.pid === item.pid)
                    listOfPIDs[index].datasetIds.push(item.datasetid)
                }
                else {
                    listOfPIDs.push({"pid":item.pid, "datasetIds":[item.datasetid]})
                }
            
            })

            return res.json({ success: true, data: listOfPIDs });
        })        
    }
);

router.get('/:datasetID', async (req, res) => {

    let datasetId = req.params.datasetID;
    let isLatestVersion = true;
    
    // Search for a dataset based on pid
    let data = await Data.aggregate([
        { $match: { $and: [{ pid: datasetId }, {activeflag: 'active'}] } }
    ]).exec();
   
    if(data && data.length > 0){
        // Set the actual datasetId value based on pid provided
        datasetId = data[0].datasetid;
    }
    else{
        // Search for a dataset based on datasetID
        data = await Data.aggregate([
            { $match: { $and: [{ datasetid: datasetId }] } }
        ]).exec();
        
        // Pull a dataset version from MDC if it doesn't exist on our DB
        if (data.length === 0) {
            data[0] = await loadDataset(datasetId)
        }

        isLatestVersion = (data[0].activeflag === 'active');
    }

    let pid = data[0].pid;

    let p = Data.aggregate([
        { $match: {"relatedObjects": { $elemMatch: { "objectId": {$in : [datasetId, pid] } } }} },
    ]);

    p.exec( async (err, relatedData) => {
        relatedData.forEach((dat) => {
            dat.relatedObjects.forEach((x) => {
                if ((x.objectId === datasetId && dat.id !== datasetId) || (x.objectId === pid && dat.id !== pid)){
                    if (typeof data[0].relatedObjects === "undefined") data[0].relatedObjects=[];
                    data[0].relatedObjects.push({ objectId: dat.id, reason: x.reason, objectType: dat.type, user: x.user, updated: x.updated })
                }
            })
        });

        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, isLatestVersion: isLatestVersion, data: data });
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