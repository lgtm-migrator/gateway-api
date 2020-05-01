import express from 'express';
import passport from "passport";
import { utils } from "../auth";
import { ROLES } from '../../../utils'
import { Data, MessagesModel } from '../../../database/schema';

const router = express.Router();

  /**
   * {get} /accountsearch Search tools
   * 
   * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
   * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
   */
  router.get(
    '/',
    passport.authenticate('jwt'),
    utils.checkIsInRole(ROLES.Admin),
    async (req, res) => {
    var result;
    var startIndex = 0;
    var maxResults = 25;
    var typeString = "";
    var toolStateString = "";
  
    if (req.query.startIndex) {
      startIndex = req.query.startIndex;
    }
    if (req.query.maxResults) {
      maxResults = req.query.maxResults;
    }
    if (req.query.type) {
      typeString = req.query.type;
    }
    if (req.query.toolState) {
      toolStateString = req.query.toolState;
    }
  
    var searchQuery = {
      $and: [
        { type: typeString },
        { activeflag: toolStateString }
      ]
    };
  
    var q = Data.aggregate([
      { $match: { $and: [{ type: typeString }, { activeflag: toolStateString }] } },
      { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
    ]).skip(parseInt(startIndex)).limit(parseInt(maxResults));
    q.exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      result = res.json({ success: true, data: data });
    });
    return result;
  });

  module.exports = router;