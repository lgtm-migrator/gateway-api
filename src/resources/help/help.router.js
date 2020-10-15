import express from "express";
import { Help } from "./help.model";

const router = express.Router();

// @router   GET /api/help/:category
// @desc     Get Help FAQ for a category
// @access   Public
router.get("/:category", async (req, res) => {
    let query = Help.aggregate([
        { $match: { $and: [{ active: true }, { category: req.params.category }] } }
    ]);
    query.exec((err, data) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, data: data });
    });
});

module.exports = router;