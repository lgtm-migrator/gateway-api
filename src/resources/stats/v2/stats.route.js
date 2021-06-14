import express from 'express';
import StatsController from '../stats.controller';
import { statsService } from '../dependency';
import { logger } from '../../utilities/logger';

const router = express.Router();
const statsController = new StatsController(statsService);
const logCategory = 'Stats';


// @route   GET /api/v2/stats/snapshots
// @desc    Returns a collection of statistic snapshots based on supplied query parameters
// @access  Public
router.get(
	'/snapshots',
	logger.logRequestMiddleware({ logCategory, action: 'Viewed public Gateway statistic snapshot data' }),
    (req, res) => statsController.getSnapshots(req, res)
);

// @route   POST /api/v2/stats/snapshots
// @desc    Creates a stat snapshot at this point in time
// @access  Public
router.post(
	'/snapshots',
	logger.logRequestMiddleware({ logCategory, action: 'Creating new statistic snapshot' }),
    (req, res) => statsController.createSnapshot(req, res)
);

module.exports = router;
