import express from 'express';
import { ROLES } from '../user/user.roles';
import { Data } from '../tool/data.model';
import { Course } from './course.model';
import passport from 'passport';
import { utils } from '../auth';
import { UserModel } from '../user/user.model';
import { MessagesModel } from '../message/message.model';
import {
  addCourse,
  editTool,
  deleteTool,
  setStatus,
  getTools,
  getToolsAdmin,
} from './course.repository';
import emailGenerator from '../utilities/emailGenerator.util';
import inputSanitizer from '../utilities/inputSanitizer';
const hdrukEmail = `enquiry@healthdatagateway.org`;
const router = express.Router();

// @router   POST /api/v1/Course
// @desc     Add Course as user
// @access   Private
router.post(
  '/',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
    await addCourse(req)
      .then((response) => {
        return res.json({ success: true, response });
      })
      .catch((err) => {
        return res.json({ success: false, err });
      });
  }
);

// @router   PUT /api/v1/{id}
// @desc     Edit tools user
// @access   Private
// router.put('/{id}',
router.put(
  '/:id',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
    await editTool(req)
      .then((response) => {
        return res.json({ success: true, response });
      })
      .catch((err) => {
        return res.json({ success: false, error: err.message });
      });
  }
);

// @router   GET /api/v1/get/admin
// @desc     Returns List of Tool objects
// @access   Private
router.get(
  '/getList',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
    req.params.type = 'tool';
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
// @desc     Returns List of Tool Objects No auth
//           This unauthenticated route was created specifically for API-docs
// @access   Public
router.get(
  '/',
  async (req, res) => {
    req.params.type = 'tool';
      await getToolsAdmin(req)
        .then((data) => {
          return res.json({ success: true, data });
        })
        .catch((err) => {
          return res.json({ success: false, err });
        });
  }
);

// @router   PATCH /api/v1/status
// @desc     Set tool status
// @access   Private
router.patch(
  '/:id',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin),
  async (req, res) => {
    await setStatus(req)
      .then((response) => {
        return res.json({ success: true, response });
      })
      .catch((err) => {
        return res.json({ success: false, error: err.message });
      });
  }
);

/**
 * {get} /tool/:id Tool
 *
 * Return the details on the tool based on the tool ID.
 */
router.get('/:id', async (req, res) => {
  var query = Course.aggregate([
    { $match: { id: parseInt(req.params.id) } },
    {
      $lookup: {
        from: 'tools',
        localField: 'creator',
        foreignField: 'id',
        as: 'creator',
      },
    }
  ]);
  query.exec((err, data) => {
    if (data.length > 0) {
      var p = Data.aggregate([
        {
          $match: {
            $and: [
              { relatedObjects: { $elemMatch: { objectId: req.params.id } } },
            ],
          },
        },
      ]);
      p.exec((err, relatedData) => {
        relatedData.forEach((dat) => {
          dat.relatedObjects.forEach((x) => {
            if (x.objectId === req.params.id && dat.id !== req.params.id) {
              let relatedObject = {
                objectId: dat.id,
                reason: x.reason,
                objectType: dat.type,
                user: x.user, 
                updated: x.updated
              };
              data[0].relatedObjects = [relatedObject, ...data[0].relatedObjects || []];
            }
          });
        });

        if (err) return res.json({ success: false, error: err });

        return res.json({
        success: true,
        data: data
        });
      });
    } else {
      return res.status(404).send(`Course not found for Id: ${req.params.id}`);
    }
  });
});

/**
 * {get} /tool/edit/:id Tool
 *
 * Return the details on the tool based on the tool ID for edit.
 */
router.get('/edit/:id', async (req, res) => {
  var query = Data.aggregate([
    { $match: { $and: [{ id: parseInt(req.params.id) }] } },
    {
      $lookup: {
        from: 'tools',
        localField: 'authors',
        foreignField: 'id',
        as: 'persons',
      },
    },
  ]);
  query.exec((err, data) => {
    if (data.length > 0) {
      return res.json({ success: true, data: data });
    } else {
      return res.json({
        success: false,
        error: `Tool not found for tool id ${req.params.id}`,
      });
    }
  });
});




//Validation required if Delete is to be implemented
// router.delete('/:id',
//   passport.authenticate('jwt'),
//   utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
//     async (req, res) => {
//       await deleteTool(req, res)
//         .then(response => {
//           return res.json({success: true, response});
//         })
//         .catch(err => {
//           res.status(204).send(err);
//         });
//     }
// );

module.exports = router;



