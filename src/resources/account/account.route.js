import express from 'express';
import passport from "passport";
import { utils } from "../auth";
import { ROLES } from '../user/user.roles'
import { Data } from '../tool/data.model';

const router = express.Router();
 
  /**
   * {delete} /api/v1/accounts
   * 
   * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
   * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
   */
  router.delete(
    '/',
    passport.authenticate('jwt'),
    utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
    async (req, res) => {
    const { id } = req.body;
    Data.findOneAndDelete({ id: id }, (err) => {
      if (err) return res.send(err);
      return res.json({ success: true });
    });
  });

  /**
   * {get} /api/v1/accounts/admin
   * 
   * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
   * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
   */
  router.get(
    '/admin',
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

  /**
 * {get} /api/v1/accounts
 * 
 * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
 * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
 */
router.get(
    '/',
    passport.authenticate('jwt'),
    utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
    async (req, res) => {
    var result;
    var startIndex = 0;
    var maxResults = 25;
    var typeString = "";
    var idString = "";
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
    if (req.query.id) {
      idString = req.query.id;
    }
    if (req.query.toolState) {
      toolStateString = req.query.toolState;
    }
  
    var q = Data.aggregate([
      { $match: { $and: [{ type: typeString }, { authors: parseInt(idString) }, { activeflag: toolStateString }] } },
      { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
    ]).skip(parseInt(startIndex)).limit(parseInt(maxResults));
    q.exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      result = res.json({ success: true, data: data });
    });
    return result;
  });

  /**
   * {put} /api/v1/accounts/status
   * 
   * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
   * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
   */
  router.put(
    '/status',
    passport.authenticate('jwt'),
    utils.checkIsInRole(ROLES.Admin),
    async (req, res) => {
    const { id, activeflag } = req.body;
  
    Data.findOneAndUpdate({ id: id },
      {
        activeflag: activeflag
      }, (err) => {
        var p = Data.find({ id: id });
        p.exec((err, data) => {
          for (var i = 0; i < data[0].authors.length; i++) {
            let message = new MessagesModel();
            message.messageID = parseInt(Math.random().toString().replace('0.', ''));
            message.messageTo = data[0].authors[i];
            message.messageObjectID = id;
            message.messageType = 'approved';
            message.messageSent = Date.now();
            message.save((err) => {});
          }
        });
        
        let message = new MessagesModel();
        message.messageID = parseInt(Math.random().toString().replace('0.', ''));
        message.messageTo = 0;
        message.messageObjectID = id;
        message.messageType = 'approved';
        message.messageSent = Date.now();
        message.save((err) => {});
  
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true });
      });
  });

  module.exports = router;