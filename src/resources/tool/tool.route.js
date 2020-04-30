import express from 'express'
import { ROLES } from '../../../utils'
import { Data, Reviews } from '../../../database/schema';
import passport from "passport";
import { utils } from "../../../auth";

const router = express.Router()

/**
 * {get} /tool/:toolID Tool
 * 
 * Return the details on the tool based on the tool ID.
 */
router.get('/:toolID', async (req, res) => {
    var q = Data.aggregate([
      { $match: { $and: [{ id: parseInt(req.params.toolID) }] } },
      { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
    ]);
    q.exec((err, data) => {
      var r = Reviews.aggregate([
        { $match: { $and: [{ toolID: parseInt(req.params.toolID) }, { activeflag: 'active' }] } },
        { $sort: {date: -1}},
        { $lookup: { from: "tools", localField: "reviewerID", foreignField: "id", as: "person" } },
        { $lookup: { from: "tools", localField: "replierID", foreignField: "id", as: "owner" } }
      ]);
      r.exec((err, reviewData) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, data: data, reviewData: reviewData });
      });
  
    });
  });

  /**
 * {post} /tool/review/add Add review
 * 
 * Authenticate user to see if add review should be displayed.
 * When they submit, authenticate the user, validate the data and add review data to the DB.
 * We will also check the review (Free word entry) for exclusion data (node module?)
 */
router.post(
    '/review/add',
    passport.authenticate('jwt'),
    utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
    async (req, res) => {
    let reviews = new Reviews();
    const { toolID, reviewerID, rating, projectName, review } = req.body;
  
    reviews.reviewID = parseInt(Math.random().toString().replace('0.', ''));
    reviews.toolID = toolID;
    reviews.reviewerID = reviewerID;
    reviews.rating = rating;
    reviews.projectName = projectName;
    reviews.review = review;
    reviews.activeflag = 'review';
    reviews.date = Date.now();
  
    reviews.save((err) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, id: reviews.reviewID });
    });
  });
  
  /**
   * {post} /tool/reply/add Add reply
   * 
   * Authenticate user to see if add reply should be displayed.
   * When they submit, authenticate the user, validate the data and add reply data to the DB.
   * We will also check the review (Free word entry) for exclusion data (node module?)
   */
  router.post(
    '/reply',
    passport.authenticate('jwt'),
    utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
    async (req, res) => {
    const { reviewID, replierID, reply } = req.body;
    Reviews.findOneAndUpdate({ reviewID: reviewID },
    {
      replierID: replierID,
      reply: reply,
      replydate: Date.now()
    }, (err) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true });
    });
  });
  
  /**
   * {post} /tool/review/approve Approve review
   * 
   * Authenticate user to see if user can approve.
   */
  router.post(
    '/review/approve',
    passport.authenticate('jwt'),
    utils.checkIsInRole(ROLES.Admin),
    async (req, res) => {
    const { id, activeflag } = req.body;
    Reviews.findOneAndUpdate({ reviewID: id },
      {
        activeflag: activeflag
      }, (err) => {
          if (err) return res.json({ success: false, error: err });
          return res.json({ success: true });
      });
  });
  
  /**
   * {delete} /tool/review/reject Reject review
   * 
   * Authenticate user to see if user can reject.
   */
  router.delete(
    '/review/reject',
    passport.authenticate('jwt'),
    utils.checkIsInRole(ROLES.Admin),
    async (req, res) => {
    const { id } = req.body;
    Reviews.findOneAndDelete({ reviewID: id }, (err) => {
      if (err) return res.send(err);
      return res.json({ success: true });
    });
  });
  
  /**
   * {delete} /tool/review/delete Delete review
   * 
   * When they delete, authenticate the user and remove the review data from the DB.
   */
  router.delete(
    '/review/delete',
    passport.authenticate('jwt'),
    utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
    async (req, res) => {
    const { id } = req.body;
    Data.findOneAndDelete({ id: id }, (err) => {
      if (err) return res.send(err);
      return res.json({ success: true });
    });
  });

module.exports = router