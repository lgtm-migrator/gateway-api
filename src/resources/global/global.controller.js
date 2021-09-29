import Controller from '../base/controller';
import { logger } from '../utilities/logger';

const logCategory = 'Global';

export default class GlobalController extends Controller {
	constructor(globalService) {
		super(globalService);
		this.globalService = globalService;
	}

	async getGlobal(req, res) {
		try {
			// Find the relevant global data
			const global = await this.globalService.getGlobal(req.query).catch(err => {
				logger.logError(err, logCategory);
			});
			// Return the global data
			return res.status(200).json({
				success: true,
				data: global,
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
