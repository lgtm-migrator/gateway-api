import express from 'express';
import { statsService } from '../dependency';
import { logger } from '../../utilities/logger';

const router = express.Router();
const logCategory = 'Stats';

router.get('', logger.logRequestMiddleware({ logCategory, action: 'Viewed KPI stats' }), async (req, res) => {
	try {
		let selectedMonthStart = new Date(req.query.selectedDate);
		selectedMonthStart.setMonth(selectedMonthStart.getMonth());
		selectedMonthStart.setDate(1);
		selectedMonthStart.setHours(0, 0, 0, 0);

		let selectedMonthEnd = new Date(req.query.selectedDate);
		selectedMonthEnd.setMonth(selectedMonthEnd.getMonth() + 1);
		selectedMonthEnd.setDate(0);
		selectedMonthEnd.setHours(23, 59, 59, 999);

		let result;

		switch (req.query.kpi) {
			case 'technicalmetadata':
				const { totalDatasets = 0, datasetsMetadata = 0 } = await statsService.getTechnicalMetadataStats().catch(err => {
					logger.logError(err, logCategory);
				});

				result = res.json({
					success: true,
					data: {
						totalDatasets,
						datasetsMetadata,
					},
				});
				break;

			case 'searchanddar':
				const [searchStats, dataAccessRequestStats] = await Promise.all([
					statsService.getSearchStatsByMonth(selectedMonthStart, selectedMonthEnd),
					statsService.getDataAccessRequestStats(selectedMonthStart, selectedMonthEnd),
				]).catch(err => {
					logger.logError(err, logCategory);
				});

				const { totalMonth = 0, noResultsMonth = 0 } = searchStats;
				const accessRequestsMonth = dataAccessRequestStats || 0;

				result = res.json({
					success: true,
					data: {
						totalMonth,
						noResultsMonth,
						accessRequestsMonth,
					},
				});
				break;

			case 'uptime':
				const { averageUptime = 0 } = await statsService.getUptimeStatsByMonth(selectedMonthStart, selectedMonthEnd).catch(err => {
					logger.logError(err, logCategory);
				});

				result = res.json({
					success: true,
					data: averageUptime,
				});
				break;

			case 'topdatasets':
				const topDatasetResults = await statsService.getTopDatasetsByMonth(selectedMonthStart, selectedMonthEnd).catch(err => {
					logger.logError(err, logCategory);
				});

				result = res.json({
					success: true,
					data: topDatasetResults,
				});
				break;

			default:
				result = res.status(400).json({
					success: false,
					message: 'Invalid KPI was requested',
				});
				break;
		}
		return result;
	} catch (err) {
		logger.logError(err, logCategory);
		return res.status(500).json({
			success: false,
			message: 'A server error occurred, please try again',
		});
	}
});

module.exports = router;
