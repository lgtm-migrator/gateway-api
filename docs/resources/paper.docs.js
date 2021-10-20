module.exports = {
	'/api/v1/papers': {
		post: {
			summary: 'Returns a Paper object with ID.',
			security: [
				{
					cookieAuth: [],
				},
			],
			tags: ['Papers'],
			requestBody: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['name'],
							properties: {
								type: {
									type: 'string',
								},
								name: {
									type: 'string',
								},
								link: {
									type: 'string',
								},
								description: {
									type: 'string',
								},
								categories: {
									type: 'object',
									properties: {
										category: {
											type: 'string',
										},
										programmingLanguage: {
											type: 'array',
											items: {
												type: 'string',
											},
										},
										programmingLanguageVersion: {
											type: 'string',
										},
									},
								},
								licence: {
									type: 'string',
								},
								authors: {
									type: 'array',
									items: {
										type: 'number',
									},
								},
								tags: {
									type: 'object',
									properties: {
										features: {
											type: 'array',
											items: {
												type: 'string',
											},
										},
										topics: {
											type: 'array',
											items: {
												type: 'string',
											},
										},
									},
								},
							},
							example: {
								type: 'paper',
								name: 'Epilepsy data research',
								link: 'http://epilepsy.org',
								description: 'Epilespy data research description',
								categories: {
									category: 'API',
									programmingLanguage: ['Javascript'],
									programmingLanguageVersion: '0.0.0',
								},
								licence: 'MIT licence',
								authors: [4495285946631793],
								tags: {
									features: ['Arbitrage'],
									topics: ['Epilepsy'],
								},
							},
						},
					},
				},
			},
			responses: {
				200: {
					description: 'OK',
				},
			},
		},
		get: {
			summary: 'Return List of Paper objects.',
			tags: ['Papers'],
			parameters: [
				{
					in: 'query',
					name: 'limit',
					required: false,
					description: 'Limit the number of results',
					schema: {
						type: 'integer',
						example: 3,
					},
				},
				{
					in: 'query',
					name: 'offset',
					required: false,
					description: 'Index to offset the search results',
					schema: {
						type: 'integer',
						example: 1,
					},
				},
				{
					in: 'query',
					name: 'q',
					required: false,
					description: 'Filter using search query',
					schema: {
						type: 'string',
						example: 'epilepsy',
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
	'/api/v1/papers/{id}': {
		get: {
			summary: 'Returns Paper object.',
			tags: ['Papers'],
			parameters: [
				{
					name: 'id',
					in: 'path',
					required: true,
					description: 'The ID of the user',
					schema: {
						type: 'integer',
						format: 'int64',
						minimum: 1,
						example: 8370396016757367,
					},
				},
			],
			responses: {
				200: {
					description: 'OK',
				},
			},
		},
		patch: {
			summary: 'Change status of the Paper object.',
			security: [
				{
					cookieAuth: [],
				},
			],
			tags: ['Papers'],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					schema: {
						type: 'integer',
						example: 7485531672584456,
					},
				},
			],
			requestBody: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['name'],
							properties: {
								id: {
									type: 'number',
								},
								activeflag: {
									type: 'string',
								},
							},
							example: {
								activeflag: 'active',
							},
						},
					},
				},
			},
			responses: {
				200: {
					description: 'OK',
				},
			},
		},
		put: {
			summary: 'Returns edited Paper object.',
			security: [
				{
					cookieAuth: [],
				},
			],
			tags: ['Papers'],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The ID of the paper',
					schema: {
						type: 'integer',
						format: 'int64',
						example: 7485531672584456,
					},
				},
			],
			requestBody: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['name'],
							properties: {
								id: {
									type: 'number',
								},
								type: {
									type: 'string',
								},
								name: {
									type: 'string',
								},
								link: {
									type: 'string',
								},
								description: {
									type: 'string',
								},
								categories: {
									type: 'object',
									properties: {
										category: {
											type: 'string',
										},
										programmingLanguage: {
											type: 'array',
											items: {
												type: 'string',
											},
										},
										programmingLanguageVersion: {
											type: 'string',
										},
									},
								},
								licence: {
									type: 'string',
								},
								authors: {
									type: 'array',
									items: {
										type: 'number',
									},
								},
								tags: {
									type: 'object',
									properties: {
										features: {
											type: 'array',
											items: {
												type: 'string',
											},
										},
										topics: {
											type: 'array',
											items: {
												type: 'string',
											},
										},
									},
								},
								toolids: {
									type: 'array',
									items: {
										type: 'string',
									},
								},
							},
							example: {
								id: 7485531672584456,
								type: 'paper',
								name: 'Test Paper Title 2',
								link: 'http://localhost:8080/epilepsy',
								description: 'Test abstract 2',
								categories: {
									category: 'API',
									programmingLanguage: ['Javascript'],
									programmingLanguageVersion: '1.0.0',
								},
								licence: 'MIT licence',
								authors: [4495285946631793],
								tags: {
									features: ['Arbitrage'],
									topics: ['Epilepsy'],
								},
								toolids: [],
							},
						},
					},
				},
			},
			responses: {
				200: {
					description: 'OK',
				},
			},
		},
	},
	'/api/v2/papers': {
		get: {
			summary: 'Returns a list of paper objects',
			tags: ['Papers v2.0'],
			parameters: [
				{
					name: 'search',
					in: 'query',
					description:
						'Full text index search function which searches for partial matches in various fields including name and description.  The response will contain a metascore indicating the relevancy of the match, by default results are sorted by the most relevant first unless a manual sort query parameter has been added.',
					schema: {
						type: 'string',
					},
					example: 'Exploration',
				},
				{
					name: 'page',
					in: 'query',
					description: 'A specific page of results to retrieve',
					schema: {
						type: 'number',
					},
					example: 1,
				},
				{
					name: 'limit',
					in: 'query',
					description: 'Maximum number of results returned per page',
					schema: {
						type: 'number',
					},
					example: 10,
				},
				{
					name: 'sort',
					in: 'query',
					description:
						'Fields to apply sort operations to.  Accepts multiple fields in ascending and descending.  E.g. name for ascending or -name for descending.  Multiple fields should be comma separated as shown in the example below.',
					schema: {
						type: 'string',
					},
					example: 'name,-counter',
				},
				{
					name: 'fields',
					in: 'query',
					description:
						'Limit the size of the response by requesting only certain fields.  Note that some additional derived fields are always returned.  Multiple fields should be comma separate as shown in the example below.',
					schema: {
						type: 'string',
					},
					example: 'name,counter,description',
				},
				{
					name: 'count',
					in: 'query',
					description: 'Returns the number of the number of entities matching the query parameters provided instead of the result payload',
					schema: {
						type: 'boolean',
					},
					example: true,
				},
			],
			description:
				"Version 2.0 of the courses API introduces a large number of parameterised query string options to aid requests in collecting the data that is most relevant for a given use case. The query parameters defined below support a variety of comparison operators such as equals, contains, greater than, and less than. Using dot notation, any field can be queried, please see some examples below.  Note - This response is limited to 100 records by default.  Please use the 'page' query parameter to access records beyond the first 100.  The 'limit' query parameter can therefore only be specified up to a maximum of 100.",
			responses: {
				200: {
					description: 'Successful response containing a list of papers matching query parameters',
				},
			},
		},
	},
	'/api/v2/papers/{id}': {
		get: {
			summary: 'Returns paper object',
			tags: ['Papers v2.0'],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The ID of the paper',
					schema: {
						type: 'number',
						example: 13296138992670704,
					},
				},
			],
			description: 'Returns a paper object by matching unique identifier in the default format that is stored as within the Gateway',
			responses: {
				200: {
					description: 'Successful response containing a single paper object',
				},
				404: {
					description: 'A paper could not be found by the provided paper identifier',
				},
			},
		},
	},
};
