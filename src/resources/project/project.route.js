import express from 'express'
import { Data } from '../tool/data.model'
import { ROLES } from '../user/user.roles'
import passport from "passport";
import { utils } from "../auth";
import {addTool, editTool, deleteTool, setStatus, getTools, getToolsAdmin} from '../tool/data.repository';
import { findPostsByTopicId } from "../discourse/discourse.service";

const router = express.Router();

// @router   POST /api/v1/add
// @desc     Add project user
// @access   Private
router.post('/add', 
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

// @router   PUT /api/v1/edit
// @desc     Edit project user
// @access   Private
router.put('/edit', 
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

// @router   DELETE /api/v1/delete
// @desc     Delete project user
// @access   Private
router.delete('/delete',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
    async (req, res) => {
      await deleteTool(req)
        .then(response => {
          return res.json({success: true, response});
        })
        .catch(err => {
          return res.json({success: false, err});
        });
    }
);

// @router   GET /api/v1/get/admin
// @desc     Get projects
// @access   Private
router.get('/get/admin',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin),
    async (req, res) => {
      req.params.type = "project";
      await getToolsAdmin(req)
        .then(data => {
          return res.json({success: true, data});
        })
        .catch(err => {
          return res.json({success: false, err});
        });
    }
);

// @router   GET /api/v1/get/admin
// @desc     Get projects for an author
// @access   Private
router.get('/get',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
    async (req, res) => {
      req.params.type = "project";
      await getTools(req)
        .then(data => {
          return res.json({success: true, data});
        })
        .catch(err => {
          return res.json({success: false, err});
        });
    }
);

// @router   PUT /api/v1/status
// @desc     Set project status
// @access   Private
router.put('/status',
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
        var p = Data.aggregate([
            { $match: { $and: [{ "relatedObjects": { $elemMatch: { "objectId": req.params.projectID } } }] } },
        ]);
        p.exec((err, relatedData) => {
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
            if (data[0].discourseTopicId) {
              discourseTopic = await findPostsByTopicId(data[0].discourseTopicId);
            }

        return res.json({ success: true, data: data, discourseTopic: discourseTopic });
        });
    });
});

module.exports = router;