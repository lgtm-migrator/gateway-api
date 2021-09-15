import express from 'express';
import GlobalController from './global.controller';
import { globalService } from './dependency';
import { logger } from '../utilities/logger';

const router = express.Router();
const globalController = new GlobalController(globalService);
const logCategory = 'Global';

// @route   GET /api/v1/global
// @desc    Returns a single global document based on provided locale and query params
// @access  Public
router.get('/', logger.logRequestMiddleware({ logCategory, action: 'Retrieved global data for locale' }), (req, res) =>
	globalController.getGlobal(req, res)
);

module.exports = router;
