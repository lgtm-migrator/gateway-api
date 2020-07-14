import express from 'express'
import { Data } from '../tool/data.model'
import { utils } from "../auth";
import passport from "passport";
import { ROLES } from '../user/user.roles'
import {addTool, editTool, deleteTool, setStatus, getTools, getToolsAdmin} from '../tool/data.repository';
const urlValidator = require('../utilities/urlValidator');

const router = express.Router()

router.post('/',
    passport.authenticate('jwt'),
    utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
    async (req, res) => {
      const { firstname, lastname, bio, emailNotifications, terms } = req.body;
      let link = urlValidator.validateURL(req.body.link);
      let orcid = urlValidator.validateOrcidURL(req.body.orcid);
      let data = Data();
      console.log(req.body)
      data.id = parseInt(Math.random().toString().replace('0.', ''));
      data.firstname = firstname,
      data.lastname = lastname,
      data.type = "person";
      data.bio = bio;
      data.link = link;
      data.orcid = orcid;
      data.emailNotifications = emailNotifications;
      data.terms = terms;    
      let newPersonObj = await data.save();
      if(!newPersonObj)
        return res.json({ success: false, error: "Can't persist data to DB" });
      
      return res.json({ success: true, data: newPersonObj});
  });

router.put('/',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
  const { id, bio, emailNotifications, terms } = req.body;
  const type = 'person';
  let link = urlValidator.validateURL(req.body.link);
  let orcid = urlValidator.validateOrcidURL(req.body.orcid);
  console.log(req.body)
  await Data.findOneAndUpdate({ id: id },
    {
      type,
      bio,
      link,
      orcid,
      emailNotifications,
      terms
    },
    {new:true})
    .then(person => {
      return res.json({ success: true, data: person});
    })
    .catch(err =>{
      return res.json({ success: false, error: err });
    })
  });

  /**
 * {get} /person/:personID Person
 * 
 * Return the details on the tool based on the tool ID.
 */
router.get('/:id', async (req, res) => {
    //req.params.id is how you get the id from the url

    var q = Data.aggregate([
        { $match: { $and: [{ id: parseInt(req.params.id) }] } },
        { $lookup: { from: "tools", localField: "id", foreignField: "authors", as: "tools" } },
        { $lookup: { from: "reviews", localField: "id", foreignField: "reviewerID", as: "reviews" } }
    ]);
    q.exec((err, data) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, data: data });
    });
});

// @router   GET /api/v1/person
// @desc     Get paper for an author
// @access   Private
router.get('/',
  async (req, res) => {
    let personArray = [];
    req.params.type = "person";
    await getToolsAdmin(req)
      .then(data => {
          data.map((personObj) => {
            personArray.push(
              {     
                "id":personObj.id,
                "type":personObj.type,
                "firstname":personObj.firstname,
                "lastname":personObj.lastname,
                "bio":personObj.bio,
                "sociallinks":personObj.sociallinks,
                "company":personObj.company,
                "link":personObj.link,
                "orcid":personObj.orcid,
                "activeflag":personObj.activeflag,
                "createdAt":personObj.createdAt,
                "updatedAt":personObj.updatedAt,
                "__v":personObj.__v,
                "emailNotifications":personObj.emailNotifications,
                "terms":personObj.terms,
                "counter":personObj.counter
              }
            );
          })
        return res.json({success: true, data: personArray});
        })
        .catch(err => {
          return res.json({success: false, err});
      });
  }
);
  
module.exports = router