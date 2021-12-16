module.exports = {
	'/api/v2/activitylog': {
		post: {
			summary: 'Search activity logs for a given dataset or data access request',
			security: [
				{
					cookieAuth: [],
				},
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['versionIds', 'type'],
							properties: {
								versionIds: {
									type: 'array',
								},
								type: {
									type: 'array',
								},
							},
							example: {
								versionIds: ['618cd6170d111006c0550fa3', '618cd556f19753063504a492'],
								type: 'dataset',
							},
						},
					},
				},
			},
			description:
				'Returns a list of activity logs for a given set of versionIds sorted into thier respective versions. Activity logs can either be for datasets or data access requests. The requesting user must be an admin user or a member of the custodian team to which the version IDs relate.',
			tags: ['Activity Logs'],
			responses: {
				200: {
					description: 'Successful response including the JSON payload.',
				},
				401: {
					description: 'Unauthorised.',
				},
			},
		},
	},
	'/api/v2/activitylog/{type}': {
		post: {
			summary: 'Create a manual activity log for a data access requesr',
			security: [
				{
					cookieAuth: [],
				},
			],
			parameters: [
				{
					in: 'path',
					name: 'type',
					required: true,
					description: 'The type of activity log. Functionality only exists in current API for data access requests.',
					schema: {
						type: 'string',
						example: 'data_request',
					},
				},
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['description', 'timestamp', 'versionId'],
							properties: {
								description: {
									type: 'string',
									description: 'The text associated with the manual log.',
								},
								timestamp: {
									type: 'string',
									format: 'date-time',
									description: 'Timestamp of when the log was created.',
								},
								versionId: {
									type: 'string',
									description: 'The versionId of the data access request version the activity log relates to.',
								},
							},
							example: { description: 'Test', timestamp: '2021-11-11T12:03:49.714Z', versionId: '615b2ba0e33a38453bcf306b' },
						},
					},
				},
			},
			description:
				'Creates a manual activity log for a data access request version. The user must be an admin user or a member of the custodian team to which the log relates.',
			tags: ['Activity Logs'],
			responses: {
				200: {
					description: 'Successful response including the updated JSON payload for the associated data access request version.',
				},
				400: {
					description: 'Bad request, including missing information in request body.',
				},
				401: {
					description: 'Unauthorised.',
				},
				401: {
					description: 'Data access request for submitted version I',
				},
			},
		},
	},
	'/api/v2/activitylog/{type}/{id}': {
		delete: {
			summary: 'Delete a manually created activity log for a data access request',
			security: [
				{
					cookieAuth: [],
				},
			],
			parameters: [
				{
					in: 'path',
					name: 'type',
					required: true,
					description: 'The type of activity log. Functionality only exists in current API for data access requests.',
					schema: {
						type: 'string',
						example: 'data_request',
					},
				},
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The id of the manually created activity log.',
					schema: {
						type: 'string',
					},
				},
			],
			description:
				'Deletes a manually created activity log for a data access request version. The user must be a member of the relevant custodian team or an admin user.',
			tags: ['Activity Logs'],
			responses: {
				200: {
					description: 'Successful deletion, including payload for updated version.',
				},
				400: {
					description: 'Bad request - only manually created logs can be deleted.',
				},
				401: {
					description: 'Unauthorised.',
				},
				404: {
					description: 'Log not found for submitted version ID.',
				},
			},
		},
	},
};
