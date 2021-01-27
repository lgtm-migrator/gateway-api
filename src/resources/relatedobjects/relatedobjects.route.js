import express from 'express';
import _ from 'lodash';
import { Data } from '../tool/data.model';
import { Course } from '../course/course.model';

const router = express.Router();

/**
 * {get} /relatedobjects/:id
 * 
 * Return the details on the relatedobject based on the ID.
 */
router.get('/:id', async (req, res) => {
    console.log(`in relatedobjects.route`);
    let id = req.params.id;
    if (!isNaN(id)) {
        let q = Data.aggregate([
            { $match: { $and: [{ id: parseInt(id) }] } },
            { $lookup: { from: 'tools', localField: 'authors', foreignField: 'id', as: 'persons' } },
        ]);
        q.exec((err, data) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({ success: true, data: data });
        });
    } else {
        try {
            // Get related dataset
            let dataVersion = await Data.findOne({ datasetid: id });

            if (!_.isNil(dataVersion)) {
                id = dataVersion.pid;
            }

            let data = await Data.findOne({ pid: id, activeflag: 'active' });

            if (_.isNil(data)) {
                data = await Data.findOne({ pid: id, activeflag: 'archive' }).sort({ createdAt: -1 });
                if (_.isNil(data)) {
                    data = dataVersion;
                }
            }

            return res.json({ success: true, data: [data] });
        } catch (err) {
            return res.json({ success: false, error: err });
        }
    }
});

router.get('/course/:id', async (req, res) => {
    var id = req.params.id;

    var q = Course.aggregate([
        { $match: { $and: [{ id: parseInt(id) }] } },
        // { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
    ]);
    q.exec((err, data) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, data: data });
    });

});

module.exports = router;