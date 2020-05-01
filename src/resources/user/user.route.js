import express from 'express'
import { ROLES } from '../../../utils'
import passport from "passport";
import { utils } from "../auth";
import { UserModel } from './user.model'

const router = express.Router();

// @router   POST /api/user
// @desc     find user by id
// @access   Private
router.get(
    '/:userID',
    passport.authenticate('jwt'),
    utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
    async (req, res) => {
    //req.params.id is how you get the id from the url
    var q = UserModel.find({ id: req.params.userID });
  
    q.exec((err, userdata) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, userdata: userdata });
    });
  });

module.exports = router