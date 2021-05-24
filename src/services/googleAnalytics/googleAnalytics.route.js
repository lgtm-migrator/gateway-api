import express from 'express';
import { getUsersGA, getTotalUsersGA } from './googleAnalytics';
import { logger } from '../../resources/utilities/logger';

const router = express.Router();
const logCategory = 'Stats';

//returns the number of unique users within a set timeframe specified by the start date and end date params passed
router.get(
	'/userspermonth',
	logger.logRequestMiddleware({ logCategory, action: 'Viewed Google Analytics users per month stat' }),
	async (req, res) => {
		try {
			const { startDate, endDate } = req.query;
			const { data = {} } = await getUsersGA(startDate, endDate).catch(err => {
				logger.logError(err, logCategory);
			});

			return res.json({ success: true, data });
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'A server error occurred, please try again',
			});
		}
	}
);

//returns the total number of unique users
router.get(
	'/totalusers',
	logger.logRequestMiddleware({ logCategory, action: 'Viewed Google Analytics total users stat' }),
	async (req, res) => {
		try {
			const { data = {} } = await getTotalUsersGA().catch(err => {
				logger.logError(err, logCategory);
			});

			return res.json({ success: true, data });
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'A server error occurred, please try again',
			});
		}
	}
);

module.exports = router;
