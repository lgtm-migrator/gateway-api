import express from 'express'
import { DataRequestModel } from '../datarequests/datarequests.model';

const router = express.Router();

router.get('/', async (req, res) => {
    var q = DataRequestModel.find({});

    q.exec((err, data) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, data: data });
      });
});

module.exports = router; 