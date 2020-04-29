import express from 'express';
import passport from "passport";
import { utils } from "../../../auth";
import { ROLES } from '../../../utils'
import { Data, MessagesModel } from '../../../database/schema';

const router = express.Router();
 
  /**
   * {get} /accountsearch Search tools
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

  module.exports = router;