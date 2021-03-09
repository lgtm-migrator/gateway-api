import Controller from '../base/controller';

export default class DatasetController extends Controller {
	constructor(datasetService) {
        super(datasetService);
		this.datasetService = datasetService;
	}

	async getDataset(req, res) {
		try {
            // Extract id parameter from query string
			const { id } = req.params;
            // If no id provided, it is a bad request
			if (!id) {
				return res.status(400).json({
					success: false,
					message: 'You must provide a dataset identifier',
				});
			}
            // Find the dataset
			let dataset = await this.datasetService.getDataset(id, req.query);
            // Return if no dataset found
			if (!dataset) {
				return res.status(404).json({
					success: false,
					message: 'A dataset could not be found with the provided id',
				});
            }
            // Return the dataset
			return res.status(200).json({
				success: true,
				...dataset
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
    
    async getDatasets(req, res) {
		try {
            // Find the datasets
            let datasets = await this.datasetService.getDatasets(req.query);
            // Return the datasets
			return res.status(200).json({
				success: true,
				data: datasets
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
}
