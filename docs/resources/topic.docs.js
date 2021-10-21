module.exports = {
	'/api/v1/topics': {
		post: {
			summary: 'Returns a new Topic object with ID (Does not create any associated messages)',
			security: [
				{
					cookieAuth: [],
				},
			],
			tags: ['Topics'],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								relatedObjectIds: {
									type: 'array',
									items: {
										type: 'string',
									},
								},
							},
						},
						examples: {
							'Create a new topic': {
								value: "{\n    \"relatedObjectIds\": \"['1','2','3']\"\n}",
							},
						},
					},
				},
			},
			responses: {
				201: {
					description: 'A new Topic',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									_id: {
										type: 'object',
										description: 'Generated ID',
									},
									title: {
										type: 'string',
										description: 'Title of message',
									},
									subtitle: {
										type: 'string',
										description: 'Subtitle of message',
									},
									relatedObjectIds: {
										type: 'array',
										items: {
											type: 'string',
										},
										description: 'Object ID this Topic is related to',
									},
									createdBy: {
										type: 'object',
										description: 'User that created the topic',
									},
									createdDate: {
										type: 'string',
										description: 'Date the topic was created',
									},
									recipients: {
										type: 'array',
										items: {
											type: 'string',
										},
										description: 'Collection of user IDs',
									},
									tags: {
										type: 'array',
										items: {
											type: 'string',
										},
										description: 'Collection of tags to describe topic',
									},
								},
							},
						},
					},
				},
			},
		},
		get: {
			summary: 'Returns a list of all topics that the authenticated user is a recipient or member of',
			security: [
				{
					cookieAuth: [],
				},
			],
			tags: ['Topics'],
			responses: {
				200: {
					description: 'Ok',
				},
			},
		},
	},
	'/api/v1/topics/{id}': {
		get: {
			summary: 'Returns Topic object by ID',
			security: [
				{
					cookieAuth: [],
				},
			],
			tags: ['Topics'],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The ID of the topic',
					schema: {
						type: 'string',
						example: '5ee249426136805fbf094eef',
					},
				},
			],
			responses: {
				200: {
					description: 'Ok',
				},
			},
		},
		delete: {
			summary: 'Soft deletes a message Topic but does not affect associated messages',
			security: [
				{
					cookieAuth: [],
				},
			],
			tags: ['Topics'],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The ID of the Topic',
					schema: {
						type: 'string',
						example: '5ee249426136805fbf094eef',
					},
				},
			],
			responses: {
				204: {
					description: 'Ok',
				},
			},
		},
	},
};
