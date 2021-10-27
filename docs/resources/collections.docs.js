module.exports = {
	'/api/v1/collections/getList': {
		get: {
			summary: 'Returns a list of collections',
			security: [
				{
					cookieAuth: [],
				},
			],
			parameters: [],
			description: 'Returns a list of collections',
			tags: ['Collections'],
			responses: {
				200: {
					description: 'Successful response containing a list of collections',
				},
				401: {
					description: 'Unauthorized',
				},
			},
		},
	},
	'/api/v1/collections/{id}': {
		get: {
			summary: 'Returns a specific collection',
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The ID of the collection',
					schema: {
						type: 'integer',
						format: 'int64',
						minimum: 1,
						example: 2181307729084665,
					},
				},
			],
			description: 'Returns a single, public collection including its related resource(s)',
			tags: ['Collections'],
			responses: {
				200: {
					description: 'Successful response containing a single collection object',
				},
				404: {
					description: 'Collection not found for ID: {id}',
				},
			},
		},
	},
	'/api/v1/collections/relatedobjects/{id}': {
		get: {
			summary: 'Returns related resource(s) of a collection',
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The ID of the collection',
					schema: {
						type: 'integer',
						format: 'int64',
						minimum: 1,
						example: 5968326934600661,
					},
				},
			],
			description: 'Returns an array of the related resource(s) of a given collection',
			tags: ['Collections'],
			responses: {
				200: {
					description: 'Successful response containing the related resource(s)',
				},
			},
		},
	},
	'/api/v1/collections/entityid/{id}': {
		get: {
			summary: 'Returns collection array for a given entity',
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The ID of the entity',
					schema: {
						type: 'string',
						format: 'uuid',
						example: 'c1f4b16c-9dfa-48e5-94ee-f0aa58c270e4',
					},
				},
			],
			description: 'Returns an array of the collection(s) in which a given entity (e.g., dataset or paper) can be found',
			tags: ['Collections'],
			responses: {
				200: {
					description: 'Successful response containing the collection(s)',
				},
			},
		},
	},
	'/api/v1/collections/edit/{id}': {
		put: {
			summary: 'Edit a collection',
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The ID of the collection',
					schema: {
						type: 'integer',
						format: 'int64',
						minimum: 1,
						example: 5968326934600661,
					},
				},
			],
			description:
				'Edit a collection by posting the updated collection object. This JSON body is validated server-side for structure and field type',
			tags: ['Collections'],
			responses: {
				200: {
					description: 'Successful response detailing whether the update was successful or not',
				},
			},
		},
	},
	'/api/v1/collections/status/{id}': {
		put: {
			summary: 'Change the status of a collection',
			security: [
				{
					cookieAuth: [],
				},
			],
			parameters: [],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								activeflag: {
									type: 'string',
									enum: ['active', 'archive'],
								},
							},
						},
					},
				},
			},
			description: 'Change the status of a collection',
			tags: ['Collections'],
			responses: {
				200: {
					description: 'Successful response detailing whether the change of status was successful or not',
				},
			},
		},
	},
	'/api/v1/collections/add': {
		post: {
			summary: 'Add a new collection',
			security: [
				{
					cookieAuth: [],
				},
			],
			parameters: [],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							$ref: '#/components/schemas/Collections',
						},
					},
				},
			},
			description:
				'Add a collection by posting a new collection object conforming to the schema. This JSON body is validated server-side for structure and field type',
			tags: ['Collections'],
			responses: {
				200: {
					description: 'Successful response detailing whether the new collection addition was successful or not',
				},
			},
		},
	},
	'/api/v1/collections/delete/{id}': {
		delete: {
			summary: 'Delete a collection',
			security: [
				{
					cookieAuth: [],
				},
			],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The ID of the collection',
					schema: {
						type: 'integer',
						format: 'int64',
						minimum: 1,
						example: 5968326934600661,
					},
				},
			],
			description: 'Delete a collection',
			tags: ['Collections'],
			responses: {
				200: {
					description: 'Successful response detailing whether deleting the collection was a success',
				},
				401: {
					description: 'Unauthorized',
				},
			},
		},
	},
};
