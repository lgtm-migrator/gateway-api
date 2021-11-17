import constants from '../resources/utilities/constants.util';

const authoriseUserForPublisher = (req, res, next) => {
	const isAdminUser = req.user.teams.map(team => team.type).includes(constants.teamTypes.ADMIN);

	if (!isAdminUser) {
		const isCustodianUser = req.user.teams.map(team => team.type).includes(constants.teamTypes.PUBLISHER)
			? req.user.teams.map(team => team.publisher._id.toString()).includes(req.params.publisherID.toString())
			: false;

		if (!isCustodianUser || req.params.publisherID === constants.teamTypes.ADMIN) {
			return res.status(401).json({
				success: false,
				message: 'You are not authorised to view these datasets',
			});
		}
	}
	next();
};

const validateSearchParameters = (req, res, next) => {
	const sortOptions = constants.datasetSortOptions;
	const datasetStatuses = ['active', 'inReview', 'draft', 'rejected', 'archive'];

	let {
		query: { search = '', datasetIndex = 0, maxResults = 10, datasetSort = 'recentActivity', status },
	} = req;

	if (!(datasetSort in sortOptions)) {
		return res.status(500).json({
			success: false,
			message: `The sort parameter must be one of [${Object.keys(sortOptions).join(', ')}]`,
		});
	}

	if (!status || !datasetStatuses.includes(status)) {
		return res.status(500).json({
			success: false,
			message: `A status parameter must be given and be one of [${datasetStatuses.join(', ')}]`,
		});
	}

	req.query = {
		search: search.replace(/[-"@.*+/?^${}()|[\]\\]/g, ''),
		datasetIndex: parseInt(datasetIndex),
		maxResults: parseInt(maxResults),
		datasetSort: sortOptions[datasetSort],
		status: status,
	};

	next();
};

export { authoriseUserForPublisher, validateSearchParameters };
