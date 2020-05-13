import express from 'express';
import { createDiscourseTopic, findPostsByTopicId } from './discourse.service';
import { Data } from '../tool/data.model';
import { ROLES } from '../user/user.roles'
import passport from "passport";
import { utils } from "../auth";

const router = express.Router();

/**
 * @route /api/v1/discourse/topic/tool/:toolId
 * @description This routes create a Discourse new topic if the tool exists and is active.
 * @return This routes returns an object { link: linkToDiscourseTopic, posts: Array of Discourse posts, (should be empty) }
 */
router.put(
  '/tool/:toolId',
  passport.authenticate('jwt'),
  utils.checkIsInRole(ROLES.Admin, ROLES.Creator),
  async (req, res) => {
    const toolId = parseInt(req.params.toolId);

    try {
      const tool = await Data.findOne({ id: toolId });
      if (!tool) {
        return res.status(404).json({ succes: false, error: 'Tool not found.' });
      }

      const topicId = await createDiscourseTopic(tool);

      const discourseTopic = await findPostsByTopicId(topicId);

      return res.json({succes: true, data: discourseTopic });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ succes: false, error: 'Error creating the topic, please try again later...' });
    }
  }
);

module.exports = router;
