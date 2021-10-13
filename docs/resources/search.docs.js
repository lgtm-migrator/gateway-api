module.exports = {
	'/api/v1/search': {
		get: {
			tags: ['Search'],
			summary: 'Search for HDRUK /search?search',
			parameters: [
				{
					in: 'query',
					name: 'params',
					schema: {
						type: 'object',
						properties: {
							search: {
								type: 'string',
								example: 'Epilepsy',
							},
							type: {
								type: 'string',
								example: 'all',
							},
							category: {
								type: 'string',
								example: 'API',
							},
							programmingLanguage: {
								type: 'string',
								example: 'Javascript',
							},
							features: {
								type: 'string',
								example: 'Arbitrage',
							},
							topics: {
								type: 'string',
								example: 'Epilepsy',
							},
							startIndex: {
								type: 'string',
								example: 0,
							},
							maxResults: {
								type: 'string',
								example: 10,
							},
						},
					},
					style: 'form',
					explode: true,
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
