module.exports = {
	'/api/v1/locations/{filter}': {
		summary: 'summary',
		get: {
			summary: 'Returns a spatial location object',
			description: 'Returns a spatial location object by matching unique filter parameters',
			tags: ['Spatial Location'],
			parameters: [
				{
					in: 'path',
					name: 'filter',
					required: true,
					description: 'The filter location name',
					schema: {
						type: 'string',
						example: 'london',
					},
				},
			],
			responses: {
				200: {
					description: 'Successful response containing a single course object',
				}
			},
		},
	},
};
