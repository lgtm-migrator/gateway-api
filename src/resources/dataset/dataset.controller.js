export default class DatasetController {
	constructor(datasetService) {
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
					message: 'You must provide a dataset version id or a dataset persistent id',
				});
			}
            // Find the dataset
            let dataset = {};
            if(req.params.expanded) {
                dataset = await this.datasetService.getDatasetExpanded();
            } else {
                dataset = await this.datasetService.getDataset();
            }
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
				data: dataset,
			});
		} catch (err) {
            // Return error response if something goes wrong
            return res.status(500).json({
				success: false,
				message: 'A server error occurred, please try again',
			});
        }
    }
    
    async getDatasets(req, res) {
		try {
            // Parse filter options from query params
            // TODO

            // Find the datasets
            let datasets = [];
            if(req.params.expanded) {
                datasets = await this.datasetService.getDatasetsExpanded();
            } else {
                datasets = await this.datasetService.getDatasets();
            }
            // Return the datasets
			return res.status(200).json({
				success: true,
				data: datasets
			});
		} catch (err) {
            // Return error response if something goes wrong
            return res.status(500).json({
				success: false,
				message: 'A server error occurred, please try again',
			});
        }
	}
}
