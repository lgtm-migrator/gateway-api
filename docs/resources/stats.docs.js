module.exports = {
	'/api/v1/stats/topSearches': {
		get: {
			summary: 'Returns top searches for a given month and year.',
			tags: ['Stats'],
			parameters: [
				{
					name: 'month',
					in: 'query',
					required: true,
					description: 'Month number.',
					schema: {
						type: 'string',
						example: 7,
					},
				},
				{
					name: 'year',
					in: 'query',
					required: true,
					description: 'Year.',
					schema: {
						type: 'string',
						example: 2020,
					},
				},
			],
			responses: {
				200: {
					description: 'OK',
				},
			},
		},
	},
	'/api/v1/stats': {
		get: {
			summary:
				'Returns the details on recent searches, popular objects, unmet demands or recently updated objects based on the rank query parameter.',
			tags: ['Stats'],
			parameters: [
				{
					name: 'rank',
					in: 'query',
					required: true,
					description: 'The type of stat.',
					schema: {
						type: 'string',
						example: 'unmet',
					},
				},
				{
					name: 'type',
					in: 'query',
					required: true,
					description: 'Resource type.',
					schema: {
						type: 'string',
						example: 'Tools',
					},
				},
				{
					name: 'month',
					in: 'query',
					required: true,
					description: 'Month number.',
					schema: {
						type: 'string',
						example: 7,
					},
				},
				{
					name: 'year',
					in: 'query',
					required: true,
					description: 'Year.',
					schema: {
						type: 'string',
						example: 2020,
					},
				},
			],
			responses: {
				200: {
					description: 'OK',
				},
			},
		},
	},
	'/api/v1/kpis': {
		get: {
			summary: 'Returns information for KPIs, based on the KPI type and selectedDate parameters.',
			tags: ['KPIs'],
			parameters: [
				{
					name: 'type',
					in: 'query',
					required: true,
					description: 'The type of KPI.',
					schema: {
						type: 'string',
						example: 'uptime',
					},
				},
				{
					name: 'selectedDate',
					in: 'query',
					required: true,
					description: 'Full date time string.',
					schema: {
						type: 'string',
						example: 'Wed Jul 01 2020 01:00:00 GMT 0100 (British Summer Time)',
					},
				},
			],
			responses: {
				200: {
					description: 'OK',
				},
			},
		},
	},
};
