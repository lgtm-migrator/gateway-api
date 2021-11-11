module.exports = {
	'/api/v1/person/{id}': {
		get: {
			summary: 'Returns details for a person.',
			tags: ['Person'],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The ID of the person',
					schema: {
						type: 'string',
						example: 900000014,
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
	'/api/v1/person': {
		get: {
			summary: 'Returns an array of person objects.',
			tags: ['Person'],
			responses: {
				200: {
					description: 'OK',
				},
			},
		},
		post: {
			summary: 'Returns a new person object.',
			tags: ['Person'],
			requestBody: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['firstname', 'lastname', 'bio', 'link', 'orcid', 'emailNotifications', 'terms'],
							properties: {
								firstname: {
									type: 'string',
								},
								lastname: {
									type: 'string',
								},
								bio: {
									type: 'string',
								},
								link: {
									type: 'string',
								},
								orcid: {
									type: 'string',
								},
								emailNotifications: {
									type: 'boolean',
								},
								terms: {
									type: 'boolean',
								},
							},
							example: {
								firstname: 'John',
								lastname: 'Smith',
								bio: 'Researcher',
								link: 'http://google.com',
								orcid: 'https://orcid.org/123456789',
								emailNotifications: false,
								terms: true,
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
			summary: 'Returns edited person object.',
			tags: ['Person'],
			responses: {
				200: {
					description: 'OK',
				},
			},
			requestBody: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['id', 'bio', 'link', 'orcid', 'emailNotifications', 'terms'],
							properties: {
								id: {
									type: 'string',
								},
								bio: {
									type: 'string',
								},
								link: {
									type: 'string',
								},
								orcid: {
									type: 'string',
								},
								emailNotifications: {
									type: 'boolean',
								},
								terms: {
									type: 'boolean',
								},
							},
							example: {
								id: '5268590523943617',
								bio: 'Research assistant',
								link: 'http://google.com',
								orcid: 'https://orcid.org/123456789',
								emailNotifications: false,
								terms: true,
							},
						},
					},
				},
			},
		},
	},
};
