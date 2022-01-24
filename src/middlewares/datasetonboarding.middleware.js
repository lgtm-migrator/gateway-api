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
	const sortOptions = Object.keys(constants.datasetSortOptions);
	const datasetStatuses = Object.values(constants.datasetStatuses);

	let {
		query: {
			search = '',
			page = 1,
			limit = process.env.API_DEFAULT_RESULTS_LIMIT,
			sortBy = process.env.API_DEFAULT_SORT_OPTION,
			sortDirection = process.env.API_DEFAULT_SORT_DIRECTION,
			status,
		},
	} = req;

	if (page < 1 || limit < 1 || !parseInt(page) || !parseInt(limit)) {
		return res.status(400).json({
			success: false,
			message: 'The page and / or limit parameter(s) must be integers > 0',
		});
	}

	if (req.params.publisherID === constants.teamTypes.ADMIN) {
		if (!status) status = 'inReview';
		if (status !== 'inReview') {
			return res.status(401).json({
				success: false,
				message: 'Only inReview datasets can be accessed by the admin team',
			});
		}
	} else {
		if (status) {
			if (status.split(',').length > 1) {
				status.split(',').forEach(status => {
					if (!datasetStatuses.includes(status)) {
						return res.status(400).json({
							success: false,
							message: `The status parameter must be one of or a combination of [${datasetStatuses.join(
								', '
							)}]. Multiple statuses must be delimited by a ',' (comma - with no space)`,
						});
					}
				});
			} else if (!datasetStatuses.includes(status)) {
				return res.status(400).json({
					success: false,
					message: `The status parameter must be one of or a combination of [${datasetStatuses.join(
						', '
					)}]. Multiple statuses must be delimited by a ',' (comma - with no space)`,
				});
			}
		}
	}

	if (!sortOptions.includes(sortBy)) {
		return res.status(400).json({
			success: false,
			message: `The sortBy parameter must be one of [${sortOptions.join(', ')}]`,
		});
	}

	if (!['asc', 'desc'].includes(sortDirection)) {
		return res.status(400).json({
			success: false,
			message: `The sort direction must be either ascending [asc] or descending [desc]`,
		});
	}

	if (sortBy === 'popularity' && status !== constants.datasetStatuses.ACTIVE) {
		return res.status(400).json({
			success: false,
			message: `Sorting by popularity is only available for active datasets [status=active]`,
		});
	}

	req.query = {
		search: search.replace(/[-"@.*+/?^${}()|[\]\\]/g, ''),
		page: parseInt(page),
		limit: parseInt(limit),
		sortBy: sortBy,
		sortDirection: sortDirection,
		status: status,
	};

	next();
};

export { authoriseUserForPublisher, validateSearchParameters };
