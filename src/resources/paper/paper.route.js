import express from 'express'
import { Data } from '../tool/data.model'
import { ROLES } from '../user/user.roles'
import passport from "passport";
import { utils } from "../auth";
import {addTool, editTool, setStatus, getTools, getToolsAdmin} from '../tool/data.repository';

const router = express.Router();

// @router   POST /api/v1/
// @desc     Add paper user
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
// @desc     Returns List of Paper Objects Authenticated
// @access   Private
router.get(
  '/getList',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
    req.params.type = 'paper';
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

// @router   GET /api/v1/
// @desc     Returns List of Paper Objects No auth
//           This unauthenticated route was created specifically for API-docs
// @access   Public
router.get(
  '/',
  async (req, res) => {
    req.params.type = 'paper';
      await getToolsAdmin(req)
        .then((data) => {
          return res.json({ success: true, data });
        })
        .catch((err) => {
          return res.json({ success: false, err });
        });
  }
);

// @router   PATCH /api/v1/
// @desc     Change status of the Paper object.
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
// @desc     Returns edited Paper object.
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
 * {get} /paper​/:paper​ID Paper
 * 
 * Return the details on the paper based on the tool ID.
 */
router.get('/:paperID', async (req, res) => {
    var q = Data.aggregate([
        { $match: { $and: [{ id: parseInt(req.params.paperID) }, {type: 'paper'}] } },
        { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } },
        { $lookup: { from: "tools", localField: "uploader", foreignField: "id", as: "uploaderIs" } }
    ]);
    q.exec((err, data) => {
      if (data.length > 0) {
          var p = Data.aggregate([
              { $match: { $and: [{ "relatedObjects": { $elemMatch: { "objectId": req.params.paperID } } }] } },
          ]);
          p.exec((err, relatedData) => {
              relatedData.forEach((dat) => {
                  dat.relatedObjects.forEach((x) => {
                      if (x.objectId === req.params.paperID && dat.id !== req.params.paperID) {
                          if (typeof data[0].relatedObjects === "undefined") data[0].relatedObjects=[];
                          data[0].relatedObjects.push({ objectId: dat.id, reason: x.reason, objectType: dat.type, user: x.user, updated: x.updated })
                      }
                  })
              });
              if (err) return res.json({ success: false, error: err });
              return res.json({ success: true, data: data });
          });
    }
    else{
      return res.status(404).send(`Paper not found for Id: ${req.params.paperID}`);
    }
    });
});
// @router   PUT /api/v1/
// @desc     Returns edited Paper object.
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

router.get('/edit/:paperID', async (req, res) => { 
  var query = Data.aggregate([
      { $match: { $and: [{ id: parseInt(req.params.paperID) }] } },
      { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
  ]);
  query.exec((err, data) => {
      if(data.length > 0){
          return res.json({ success: true, data: data });
      }
      else {
          return res.json({success: false, error: `Paper not found for paper id ${req.params.id}`})
      }
  });
});

module.exports = router;