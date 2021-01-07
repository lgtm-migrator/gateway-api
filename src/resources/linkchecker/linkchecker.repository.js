import { Data } from '../tool/data.model';
import _ from 'lodash';

export function getObjectResult(searchAll, searchQuery) {
	var newSearchQuery = JSON.parse(JSON.stringify(searchQuery));
	newSearchQuery['$and'].push({ $or: [{ type: 'paper' }, { type: 'project' }, { type: 'tool' }] });

	var queryObject = [
		{ $match: newSearchQuery },
		{ $lookup: { from: 'tools', localField: 'authors', foreignField: 'id', as: 'persons' } },
		{
			$project: {
				_id: 0,
				id: 1,
				name: 1,
				type: 1,
				description: 1,
				resultsInsights: 1,
				link: 1,
				'persons.id': 1,
			},
		},
	];

	if (searchAll) queryObject.push({ $sort: { name: 1 } });
	else queryObject.push({ $sort: { score: { $meta: 'textScore' } } });

	var q = Data.aggregate(queryObject);
	return new Promise((resolve, reject) => {
		q.exec((err, data) => {
			if (typeof data === 'undefined') resolve([]);
			else resolve(data);
		});
	});
}
