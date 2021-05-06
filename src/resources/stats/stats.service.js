export default class StatsService {
	constructor(statsRepository) {
		this.statsRepository = statsRepository;
	}

	getSnapshots(query = {}) {
		return this.statsRepository.getSnapshots(query);
	}

	createSnapshot() {
		// Get current date
		const date = new Date(new Date().setHours(0, 0, 0));
		// Get stats
		let data = {
			date,
			entityCounts: {
				tools: 151,
				papers: 985,
				persons: 1133,
				courses: 195,
				datasets: 641,
				datasetsWithMetadata: 341,
				projects: 261,
				accessRequests: 253,
			},
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

	async getDataAccessRequesStatsByMonth(startMonth, endMonth) {
		const accessRequestsMonth = await this.statsRepository.getDataAccessRequesStatsByMonth(startMonth, endMonth);
		return {
			accessRequestsMonth,
		};
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
		switch(entityType){
			case 'course':
				return this.statsRepository.getPopularCourses();
			default:
				return this.statsRepository.getPopularEntitiesByType(entityType);
		}
	}

	async getRecentlyUpdatedEntitiesByType(entityType) {
		switch(entityType){
			case 'course':
				return this.statsRepository.getRecentlyUpdatedCourses();
			case 'dataset':
				return this.statsRepository.getRecentlyUpdatedDatasets();
			default:
				return this.statsRepository.getRecentlyUpdatedEntitiesByType(entityType);
		}
	}

	async getTotalSearchesByUsers() {
		return this.statsRepository.getTotalSearchesByUsers();
	}
}

const entityTypeMap = {
	Datasets: 'dataset',
	Tools: 'tool',
	Projects: 'project',
	Courses: 'course',
	Papers: 'papers',
	People: 'person'
};