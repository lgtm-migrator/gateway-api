import Controller from '../base/controller';
import { logger } from '../utilities/logger';

const logCategory = 'Stats';

export default class StatsController extends Controller {
	constructor(statsService) {
		super(statsService);
		this.statsService = statsService;
	}

	async getSnapshots(req, res) {
		try {
			// Find the relevant snapshots
			let snapshots = await this.statsService.getSnapshots(req.query);
			// Return the snapshots
			return res.status(200).json({
				success: true,
				data: snapshots,
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'A server error occurred, please try again',
			});
		}
	}

	async createSnapshot(req, res) {
		try {
			// Check to see if header is in json format
			let parsedBody = {};
			if (req.header('content-type') === 'application/json') {
				parsedBody = req.body;
			} else {
				parsedBody = JSON.parse(req.body);
			}
			// Check for key
			if (parsedBody.key !== process.env.snapshotKey || parsedBody.error === true) {
				return res.status(400).json({ success: false, error: 'Snapshot could not be taken' });
			}
			// Create snapshot of stats at this point in time
			let snapshot = await this.statsService.createSnapshot().catch(err => {
				logger.logError(err, logCategory);
			});
			// Return snapshot data
			return res.status(201).json({
				success: true,
				data: snapshot,
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'A server error occurred, please try again',
			});
		}
	}
}
