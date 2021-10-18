export default class StatsService {
	constructor(statsRepository) {
		this.statsRepository = statsRepository;
	}

	getSnapshots(query = {}) {
		return this.statsRepository.getSnapshots(query);
	}

	async createSnapshot() {
		const date = new Date(new Date().setHours(0, 0, 0, 0));
		const timezoneOffset = date.getTimezoneOffset() * 60000;
		const utcDate = new Date(date.getTime() - timezoneOffset);

		const [searchCounts, accessRequestCount, entityTotalCounts, coursesActiveCount, technicalStats] = await Promise.all([
			this.getTotalSearchesByUsers(),
			this.getDataAccessRequestStats(),
			this.getTotalEntityCounts(),
			this.getActiveCourseCount(),
			this.getTechnicalMetadataStats(),
		]);

		const data = {
			date: utcDate,
			entityCounts: {
				...entityTotalCounts,
				accessRequest: accessRequestCount,
				course: coursesActiveCount,
				datasetWithMetadata: technicalStats.datasetsMetadata,
			},
			searchCounts,
		};

		return this.statsRepository.createSnapshot(data);
	}

	async getTechnicalMetadataStats() {
		return this.statsRepository.getTechnicalMetadataStats();
	}

	async getSearchStatsByMonth(startMonth, endMonth) {
		const { totalMonth, noResultsMonth } = await this.statsRepository.getSearchStatsByMonth(startMonth, endMonth);
		return {
			totalMonth,
			noResultsMonth,
		};
	}

	async getDataAccessRequestStats(startMonth, endMonth) {
		return this.statsRepository.getDataAccessRequestStats(startMonth, endMonth);
	}

	async getUptimeStatsByMonth(startMonth, endMonth) {
		const monitoring = require('@google-cloud/monitoring');
		const projectId = 'hdruk-gateway';
		const client = new monitoring.MetricServiceClient();

		const request = {
			name: client.projectPath(projectId),
			filter:
				'metric.type="monitoring.googleapis.com/uptime_check/check_passed" AND resource.type="uptime_url" AND metric.label."check_id"="check-production-web-app-qsxe8fXRrBo" AND metric.label."checker_location"="eur-belgium"',
			interval: {
				startTime: {
					seconds: startMonth.getTime() / 1000,
				},
				endTime: {
					seconds: endMonth.getTime() / 1000,
				},
			},
			aggregation: {
				alignmentPeriod: {
					seconds: '86400s',
				},
				crossSeriesReducer: 'REDUCE_NONE',
				groupByFields: ['metric.label."checker_location"', 'resource.label."instance_id"'],
				perSeriesAligner: 'ALIGN_FRACTION_TRUE',
			},
		};

		// Writes time series data
		const [timeSeries] = await client.listTimeSeries(request);
		let dailyUptime = [];
		let averageUptime;

		timeSeries.forEach(data => {
			data.points.forEach(data => {
				dailyUptime.push(data.value.doubleValue);
			});

			averageUptime = (dailyUptime.reduce((a, b) => a + b, 0) / dailyUptime.length) * 100;
		});

		return { averageUptime };
	}

	async getTopDatasetsByMonth(startMonth, endMonth) {
		return this.statsRepository.getTopDatasetsByMonth(startMonth, endMonth);
	}

	async getTopSearchesByMonth(month, year) {
		return this.statsRepository.getTopSearchesByMonth(month, year);
	}

	async getObjectResult(type, searchQuery) {
		return this.statsRepository.getObjectResult(type, searchQuery);
	}

	async getUnmetSearchesByMonth(rawEntityType, month, year) {
		const entityType = entityTypeMap[rawEntityType];
		return this.statsRepository.getUnmetSearchesByMonth(entityType, month, year);
	}

	async getRecentSearches() {
		return this.statsRepository.getRecentSearches();
	}

	async getPopularEntitiesByType(entityType) {
		switch (entityType) {
			case 'course':
				return this.statsRepository.getPopularCourses();
			case 'dataUseRegister':
				return this.statsRepository.getPopularDataUses();
			default:
				return this.statsRepository.getPopularEntitiesByType(entityType);
		}
	}

	async getActiveCourseCount() {
		return this.statsRepository.getActiveCourseCount();
	}

	async getActiveDataUsesCount() {
		return this.statsRepository.getActiveDataUsesCount();
	}

	async getRecentlyUpdatedEntitiesByType(entityType) {
		switch (entityType) {
			case 'course':
				return this.statsRepository.getRecentlyUpdatedCourses();
			case 'dataset':
				return this.statsRepository.getRecentlyUpdatedDatasets();
			case 'dataUseRegister':
				return this.statsRepository.getRecentlyUpdatedDataUses();
			default:
				return this.statsRepository.getRecentlyUpdatedEntitiesByType(entityType);
		}
	}

	async getTotalSearchesByUsers() {
		return this.statsRepository.getTotalSearchesByUsers();
	}

	async getTotalEntityCounts() {
		const data = await this.statsRepository.getTotalEntityCounts();
		const counts = data.reduce((obj, entityType) => {
			const { _id: type, count } = entityType;
			obj = {
				...obj,
				[type]: count,
			};
			return obj;
		}, {});

		return counts;
	}
}

const entityTypeMap = {
	Datasets: 'dataset',
	Tools: 'tool',
	Projects: 'project',
	Courses: 'course',
	Papers: 'papers',
	People: 'person',
	DataUses: 'datause',
};
