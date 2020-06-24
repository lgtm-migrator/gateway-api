import express from 'express'
import { ROLES } from '../user/user.roles'
import passport from "passport";
import { utils } from "../auth";
// import { UserModel } from '../user/user.model'
import { Collections } from '../collections/collections.model';

const router = express.Router()

router.post('/add',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {

    let collections = new Collections();

    const {name, description, imageLink, authors, relatedObjects } = req.body;
   
    collections.id = parseInt(Math.random().toString().replace('0.', ''));
    collections.name = name;
    collections.description = description;
    collections.imageLink = imageLink;
    collections.authors = authors;
    collections.relatedObjects = relatedObjects;
    collections.activeflag = 'active'; 

    collections.save((err) => {
        if (err) {
            return res.json({ success: false, error: err })
        } else {
            return res.json({ success: true, id: collections.id })
        }
    });

  }); 

  module.exports = router;
