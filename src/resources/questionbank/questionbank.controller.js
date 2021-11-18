import Controller from '../base/controller';
import { logger } from '../utilities/logger';

const logCategory = 'questionbank';

export default class QuestionbankController extends Controller {
	constructor(questionbankService) {
		super(questionbankService);
		this.questionbankService = questionbankService;
	}

	async getQuestionbank(req, res) {
		try {
            // Extract id parameter from query string
			const { id } = req.params;
            // If no id provided, it is a bad request
			if (!id) {
				return res.status(400).json({
					success: false,
					message: 'You must provide a questionbank identifier',
				});
			}
            // Find the questionbank
			const options = { lean: true };
			const questionbank = await this.questionbankService.getQuestionbank(id, req.query, options);
            // Return if no questionbank found
			if (!questionbank) {
				return res.status(404).json({
					success: false,
					message: 'A questionbank could not be found with the provided id',
				});
            }
            // Return the questionbank
			return res.status(200).json({
				success: true,
				...questionbank
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

	async getQuestionbanks(req, res) {
		try {
			// Find the relevant questionbanks
			const questionbanks = await this.questionbankService.getQuestionbanks(req.query).catch(err => {
				logger.logError(err, logCategory);
			});
			// Return the questionbanks
			return res.status(200).json({
				success: true,
				data: questionbanks,
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
