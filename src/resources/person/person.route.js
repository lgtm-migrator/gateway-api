import express from 'express'
import { Data } from '../tool/data.model'
import { utils } from "../auth";
import passport from "passport";
import { ROLES } from '../user/user.roles'
const urlValidator = require('../utilities/urlValidator');

const router = express.Router()

router.post(
    '/edit',
    passport.authenticate('jwt'),
    utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
    async (req, res) => {
    const { id, type, bio, emailNotifications, terms } = req.body;
    let link = urlValidator.validateURL(req.body.link);
    let orcid = urlValidator.validateOrcidURL(req.body.orcid);
    console.log(req.body)
    Data.findOneAndUpdate({ id: id },
  
      {
        type,
        bio,
        link,
        orcid,
        emailNotifications,
        terms
      }, (err) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true });
      });
  
  });

  /**
 * {get} /person/:personID Person
 * 
 * Return the details on the tool based on the tool ID.
 */
router.get('/:personID', async (req, res) => {
    //req.params.id is how you get the id from the url

    var q = Data.aggregate([
        { $match: { $and: [{ id: parseInt(req.params.personID) }] } },
        { $lookup: { from: "tools", localField: "id", foreignField: "authors", as: "tools" } },
        { $lookup: { from: "reviews", localField: "id", foreignField: "reviewerID", as: "reviews" } }
    ]);
    q.exec((err, data) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, data: data });
    });
});
  
module.exports = router