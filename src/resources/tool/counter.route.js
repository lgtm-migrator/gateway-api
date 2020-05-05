import express from 'express'
import { Data } from './data.model'

const router = express.Router();

router.post('/update', async (req, res) => {
  const { id, counter } = req.body;
  Data.findOneAndUpdate({ id: id }, { counter: counter }, (err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

module.exports = router;