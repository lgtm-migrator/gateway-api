import express from 'express'
import { Data } from '../tool/data.model'
import { ROLES } from '../user/user.roles'
import passport from "passport";
import { utils } from "../auth";
import {addTool, editTool, deleteTool} from '../tool/data.repository';

const router = express.Router();

// @router   POST /api/v1/add
// @desc     Add paper user
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
// @desc     Edit paper user
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
// @desc     Delete paper user
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

/**
 * {get} /paper​/:paper​ID Paper
 * 
 * Return the details on the paper based on the tool ID.
 */
router.get('/:paperID', async (req, res) => {
    var q = Data.aggregate([
        { $match: { $and: [{ id: parseInt(req.params.paperID) }] } },
        { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
    ]);
    q.exec((err, data) => {
        var p = Data.aggregate([
            { $match: { $and: [{ "relatedObjects": { $elemMatch: { "objectId": req.params.paperID } } }] } },
        ]);
        p.exec((err, relatedData) => {
            relatedData.forEach((dat) => {
                dat.relatedObjects.forEach((x) => {
                    if (x.objectId === req.params.paperID && dat.id !== req.params.paperID) {
                        if (typeof data[0].relatedObjects === "undefined") data[0].relatedObjects=[];
                        data[0].relatedObjects.push({ objectId: dat.id, reason: x.reason, objectType: dat.type })
                    }
                })
            });

            if (err) return res.json({ success: false, error: err });
            return res.json({ success: true, data: data });
        });
    });
});

module.exports = router;