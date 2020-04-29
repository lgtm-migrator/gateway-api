import express from 'express';
import passport from "passport";
import { utils } from "../../../auth";
import { ROLES } from '../../../utils'
import { Data, MessagesModel } from '../../../database/schema';

const router = express.Router();
  
  /**
   * {get} /accountstatusupdate Search tools
   * 
   * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
   * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
   */
  router.post(
    '/',
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