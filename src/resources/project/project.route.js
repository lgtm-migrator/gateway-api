import express from 'express'
import { Data } from '../tool/data.model'
import { ROLES } from '../user/user.roles'
import passport from "passport";
import { utils } from "../auth";
import {addTool, editTool, deleteTool, setStatus, getTools, getToolsAdmin} from '../tool/data.repository';
import { findPostsByTopicId } from "../discourse/discourse.service";

const router = express.Router();

// @router   POST /api/v1/
// @desc     Add project user
// @access   Private
router.post('/', 
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
    async (req, res) => {
      await addTool(req)
      .then(response => {
        return res.json({ success: true, response});
      })
      .catch(err => {
        return res.json({ success: false, err});
      })
    }
);


// @router   GET /api/v1/
// @desc     Returns List of Project Objects
// @access   Private
router.get(
  '/',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
    req.params.type = 'project';
    let role = req.user.role;

    if (role === ROLES.Admin) {
      await getToolsAdmin(req)
        .then((data) => {
          return res.json({ success: true, data });
        })
        .catch((err) => {
          return res.json({ success: false, err });
        });
    } else if (role === ROLES.Creator) {
      await getTools(req)
        .then((data) => {
          return res.json({ success: true, data });
        })
        .catch((err) => {
          return res.json({ success: false, err });
        });
    }
  }
);


/**
 * {get} /project​/:project​ID Project
 * 
 * Return the details on the tool based on the tool ID.
 */
router.get('/:projectID', async (req, res) => {
  var q = Data.aggregate([
      { $match: { $and: [{ id: parseInt(req.params.projectID) }] } },
      { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
  ]);
   q.exec((err, data) => {
    if (data.length > 0) {
      var p = Data.aggregate([
          { $match: { $and: [{ "relatedObjects": { $elemMatch: { "objectId": req.params.projectID } } }] } },
      ]);

      p.exec( async (err, relatedData) => {
          relatedData.forEach((dat) => {
              dat.relatedObjects.forEach((x) => {
                  if (x.objectId === req.params.projectID && dat.id !== req.params.projectID) {
                      if (typeof data[0].relatedObjects === "undefined") data[0].relatedObjects=[];
                      data[0].relatedObjects.push({ objectId: dat.id, reason: x.reason, objectType: dat.type })
                  }
              })
          });

          if (err) return res.json({ success: false, error: err });
          
          let discourseTopic = {};
          if (data[0] && data[0].discourseTopicId) {
            discourseTopic = await findPostsByTopicId(data[0].discourseTopicId);
          }

        return res.json({ success: true, data: data, discourseTopic: discourseTopic });
      });
    }
    else{
      return res.json({
        success: false,
        error: `Project not found for project id ${req.params.projectID}`,
      });
    }
  });
});

// @router   PUT /api/v1/status
// @desc     Set project status
// @access   Private
router.patch('/:id',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin),
    async (req, res) => {
      await setStatus(req)
        .then(response => {
          return res.json({success: true, response});
        })
        .catch(err => {
          return res.json({success: false, err});
        });
    }
);


// @router   PUT /api/v1/
// @desc     Edit project user
// @access   Private
router.put('/:id', 
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
    async (req, res) => {
      await editTool(req)
      .then(response => {
        return res.json({ success: true, response});
      })
      .catch(err => {
        return res.json({ success: false, err});
      })
    }
);


/**
 * {get} /project/edit/:id Project
 * 
 * Return the details on the project based on the project ID for edit.
 */
router.get('/edit/:projectID', async (req, res) => { 
    var query = Data.aggregate([
        { $match: { $and: [{ id: parseInt(req.params.projectID) }] } },
        { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
    ]);
    query.exec((err, data) => {
        if(data.length > 0){
            return res.json({ success: true, data: data });
        }
        else {
            return res.json({success: false, error: `Project not found for project id ${req.params.id}`})
        }
    });
});

module.exports = router;