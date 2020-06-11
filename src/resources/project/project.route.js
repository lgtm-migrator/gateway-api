import express from 'express'
import { Data } from '../tool/data.model'
import { findPostsByTopicId } from "../discourse/discourse.service";

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
    q.exec(async (err, data) => {
        if (err) return res.json({ success: false, error: err });

        let discourseTopic = {};
        if (data[0].discourseTopicId) {
          discourseTopic = await findPostsByTopicId(data[0].discourseTopicId);
        }

        return res.json({ success: true, data: data, discourseTopic: discourseTopic });
    });
});

module.exports = router;