import Controller from '../base/controller';
import { logger } from '../utilities/logger';

const logCategory = 'dataUseRegister';

export default class DataUseRegisterController extends Controller {
	constructor(dataUseRegisterService) {
		super(dataUseRegisterService);
		this.dataUseRegisterService = dataUseRegisterService;
	}

	async getDataUseRegister(req, res) {
		try {
			// Extract id parameter from query string
			const { id } = req.params;
			// If no id provided, it is a bad request
			if (!id) {
				return res.status(400).json({
					success: false,
					message: 'You must provide a dataUseRegister identifier',
				});
			}
			// Find the dataUseRegister
			const options = { lean: true };
			const dataUseRegister = await this.dataUseRegisterService.getDataUseRegister(id, req.query, options);
			// Return if no dataUseRegister found
			if (!dataUseRegister) {
				return res.status(404).json({
					success: false,
					message: 'A dataUseRegister could not be found with the provided id',
				});
			}
			// Return the dataUseRegister
			return res.status(200).json({
				success: true,
				...dataUseRegister,
			});
		} catch (err) {
			// Return error response if something goes wrong
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: 'A server error occurred, please try again',
			});
		}
	}

	async getDataUseRegisters(req, res) {
		try {
			// Find the relevant dataUseRegisters
			const dataUseRegisters = await this.dataUseRegisterService.getDataUseRegisters(req.query).catch(err => {
				logger.logError(err, logCategory);
			});
			// Return the dataUseRegisters
			return res.status(200).json({
				success: true,
				data: dataUseRegisters,
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

	async updateDataUseRegister(req, res) {
		try {
			// Find the relevant dataUseRegisters
			const dataUseRegisters = await this.dataUseRegisterService.getDataUseRegisters(req.query).catch(err => {
				logger.logError(err, logCategory);
			});
			// Return the dataUseRegisters
			return res.status(200).json({
				success: true,
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
