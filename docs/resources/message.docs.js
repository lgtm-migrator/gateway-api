module.exports = {
	'/api/v1/messages/{id}': {
		delete: {
			summary: 'Delete a Message',
			security: [
				{
					cookieAuth: [],
				},
			],
			tags: ['Messages'],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The ID of the Message',
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
		put: {
			summary: 'Update a single Message',
			security: [
				{
					cookieAuth: [],
				},
			],
			tags: ['Messages'],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The ID of the Message',
					schema: {
						type: 'string',
						example: '5ee249426136805fbf094eef',
					},
				},
			],
			requestBody: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								isRead: {
									type: 'boolean',
								},
							},
						},
						examples: {
							'Update message to read': {
								value: '{\n    "isRead": true\n}',
							},
						},
					},
				},
			},
			responses: {
				204: {
					description: 'OK',
				},
			},
		},
	},
	'/api/v1/messages/unread/count': {
		get: {
			summary: 'Returns the number of unread messages for the authenticated user',
			security: [
				{
					cookieAuth: [],
				},
			],
			tags: ['Messages'],
			responses: {
				200: {
					description: 'OK',
				},
			},
		},
	},
	'/api/v1/messages': {
		post: {
			summary: 'Returns a new Message object and creates an associated parent Topic if a Topic is not specified in request body',
			security: [
				{
					cookieAuth: [],
				},
			],
			tags: ['Messages'],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								isRead: {
									type: 'boolean',
								},
								messageDescription: {
									type: 'string',
								},
								messageType: {
									type: 'string',
								},
							},
							required: ['isRead', 'messageDescription', 'messageType'],
						},
						examples: {
							'Create new message': {
								value: '{\n    "isRead": false,\n    "messageDescription": "this is an example",\n    "messageType": "message"\n}',
							},
						},
					},
				},
			},
			responses: {
				201: {
					description: 'OK',
				},
			},
		},
	},
};
