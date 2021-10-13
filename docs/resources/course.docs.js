module.exports = {
	'/api/v2/courses': {
		get: {
			summary: 'Returns a list of courses',
			parameters: [
				{
					name: 'search',
					in: 'query',
					description:
						'Full text index search function which searches for partial matches in various fields including name and description.  The response will contain a metascore indicating the relevancy of the match, by default results are sorted by the most relevant first unless a manual sort query parameter has been added.',
					schema: {
						type: 'string',
					},
					example: 'Research',
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
						'Fields to apply sort operations to.  Accepts multiple fields in ascending and descending.  E.g. provider for ascending or -provider for descending.  Multiple fields should be comma separated as shown in the example below.',
					schema: {
						type: 'string',
					},
					example: 'provider,-counter',
				},
				{
					name: 'fields',
					in: 'query',
					description:
						'Limit the size of the response by requesting only certain fields.  Note that some additional derived fields are always returned.  Multiple fields should be comma separate as shown in the example below.',
					schema: {
						type: 'string',
					},
					example: 'provider,counter,description',
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
			tags: ['Courses v2.0'],
			responses: {
				200: {
					description: 'Successful response containing a list of course objects matching query parameters',
				},
			},
		},
	},
	'/api/v2/courses/{id}': {
		summary: 'summary',
		get: {
			summary: 'Returns a course object',
			description: 'Returns a course object by matching unique identifier in the default format that is stored as within the Gateway',
			tags: ['Courses v2.0'],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The ID of the course',
					schema: {
						type: 'number',
						example: 5540794872521069,
					},
				},
			],
			responses: {
				200: {
					description: 'Successful response containing a single course object',
				},
				404: {
					description: 'A course could not be found by the provided course identifier',
				},
			},
		},
	},
};
