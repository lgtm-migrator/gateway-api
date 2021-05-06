import express from 'express';
import { RecordSearchData } from '../../search/record.search.model';
import { Data } from '../../tool/data.model';
import { DataRequestModel } from '../../datarequests/datarequests.model';
//import { getHdrDatasetId } from './kpis.route';
import { Course } from '../../course/course.model';
import { statsService } from '../dependency';
import { logger } from '../../utilities/logger';

const router = express.Router();
const logCategory = 'Stats';

router.get('', logger.logRequestMiddleware({ logCategory, action: 'Viewed stats' }), async (req, res) => {
	try {
		const { query = {} } = req;
		const { type: entityType, month, year } = query;

		let result;
		let data;

		switch (req.query.rank) {
			case 'recent':
				data = await statsService.getRecentSearches().catch(err => {
					logger.logError(err, logCategory);
				});

				result = res.json({
					success: true,
					data,
				});
				break;

			case 'popular':
				data = await statsService.getPopularEntitiesByType(entityType).catch(err => {
					logger.logError(err, logCategory);
				});

				result = res.json({
					success: true,
					data,
				});
				break;

			case 'updates':
				data = await statsService.getRecentlyUpdatedEntitiesByType(entityType).catch(err => {
					logger.logError(err, logCategory);
				});

				result = res.json({
					success: true,
					data,
				});
				break;

			case 'unmet':
				const monthInt = parseInt(month);
				const yearInt = parseInt(year);
				data = await statsService.getUnmetSearchesByMonth(entityType, monthInt, yearInt).catch(err => {
					logger.logError(err, logCategory);
				});

				result = res.json({
					success: true,
					data,
				});
				break;

			default:
				const dayCounts = await statsService.getTotalSearchesByUsers().catch(err => {
					logger.logError(err, logCategory);
				});

				//set the aggregate queries
				var aggregateQueryTypes = [
					{
						$match: {
							$and: [
								{ activeflag: 'active' },
								{ 'datasetfields.publisher': { $ne: 'OTHER > HEALTH DATA RESEARCH UK' } },
								{ 'datasetfields.publisher': { $ne: 'HDR UK' } },
							],
						},
					},
					{ $group: { _id: '$type', count: { $sum: 1 } } },
				];

				//set the aggregate queries
				const courseQuery = [
					{
						$match: {
							$and: [{ activeflag: 'active' }],
						},
					},
					{ $group: { _id: '$type', count: { $sum: 1 } } },
				];

				var aggregateAccessRequests = [
					{
						$match: {
							$or: [
								{ applicationStatus: 'submitted' },
								{ applicationStatus: 'approved' },
								{ applicationStatus: 'rejected' },
								{ applicationStatus: 'inReview' },
								{ applicationStatus: 'approved with conditions' },
							],
						},
					},
					{ $project: { datasetIds: 1 } },
				];

				var y = DataRequestModel.aggregate(aggregateAccessRequests);
				let courseData = Course.aggregate(courseQuery);

				let counts = {}; //hold the type (i.e. tool, person, project, access requests) counts data
				await courseData.exec((err, res) => {
					if (err) return res.json({ success: false, error: err });

					let { count = 0 } = res[0];
					counts['course'] = count;
				});

				q.exec((err, dataSearches) => {
					if (err) return res.json({ success: false, error: err });

					var x = Data.aggregate(aggregateQueryTypes);
					x.exec((errx, dataTypes) => {
						if (errx) return res.json({ success: false, error: errx });

						for (var i = 0; i < dataTypes.length; i++) {
							//format the result in a clear and dynamic way
							counts[dataTypes[i]._id] = dataTypes[i].count;
						}

						y.exec(async (err, accessRequests) => {
							//let hdrDatasetID = await getHdrDatasetId();
							let hdrDatasetIds = [];
							hdrDatasetID.map(hdrDatasetid => {
								hdrDatasetIds.push(hdrDatasetid.datasetid);
							});
							let accessRequestsCount = 0;

							if (err) return res.json({ success: false, error: err });

							accessRequests.map(accessRequest => {
								if (accessRequest.datasetIds && accessRequest.datasetIds.length > 0) {
									accessRequest.datasetIds.map(datasetid => {
										if (!hdrDatasetIds.includes(datasetid)) {
											accessRequestsCount++;
										}
									});
								}

								counts['accessRequests'] = accessRequestsCount;
							});
						});
					});
				});

				// data = {
				// 	typecounts: counts,
				// 	daycounts: {
				// 		day: dataSearches[0].lastDay[0].count,
				// 		week: dataSearches[0].lastWeek[0].count,
				// 		month: dataSearches[0].lastMonth[0].count,
				// 		year: dataSearches[0].lastYear[0].count,
				// 	},
				// },

				result = res.json({
					success: true,
					data,
				});

				break;
		}
		return result;
	} catch (err) {
		console.error(err.message);
		return res.json({ success: false, error: err.message });
	}
});

router.get('/topSearches', logger.logRequestMiddleware({ logCategory, action: 'Viewed top search stats' }), async (req, res) => {
	try {
		const monthInt = parseInt(req.query.month);
		const yearInt = parseInt(req.query.year);
		const data = await statsService.getTopSearchesByMonth(monthInt, yearInt).catch(err => {
			logger.logError(err, logCategory);
		});
		return res.json({
			success: true,
			data,
		});
	} catch (err) {
		logger.logError(err, logCategory);
		return res.status(500).json({
			success: false,
			message: 'A server error occurred, please try again',
		});
	}
});

module.exports = router;
