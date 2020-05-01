import express from 'express'
import { utils } from "../auth";
import passport from "passport";
import { ROLES } from '../user/user.roles'
import { MessagesModel } from '../message/message.model'

const router = express.Router()

router.get('/:personID',
passport.authenticate('jwt'),
utils.checkIsInRole(ROLES.Creator),
async (req, res) => {
    var idString = "";

    if (req.query.id) {
    idString = parseInt(req.query.id);
    }
    var m = MessagesModel.aggregate([
    { $match: { $and: [{ messageTo: idString}] } },
    { $lookup: { from: "tools", localField: "messageObjectID", foreignField: "id", as: "tool" } }
    ]);
    m.exec((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, newData: data });
    });
});

module.exports = router