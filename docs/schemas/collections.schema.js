module.exports = {
	$schema: 'http://json-schema.org/draft-07/schema',
	title: 'Collections schema',
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		description: {
			type: 'string',
		},
		imageLink: {
			type: 'string',
		},
		authors: {
			type: 'array',
			minItems: 0,
			items: {
				type: 'integer',
			},
		},
		relatedObjects: {
			type: 'array',
			minItems: 0,
			items: {
				type: 'object',
				properties: {
					reason: {
						type: 'string',
					},
					objectType: {
						type: 'string',
					},
					pid: {
						type: 'string',
					},
					user: {
						type: 'string',
					},
					updated: {
						type: 'string',
					},
				},
			},
		},
		publicflag: {
			type: 'boolean',
		},
		keywords: {
			type: 'array',
			minItems: 0,
			items: {
				type: 'integer',
			},
		},
	},
	required: ['name', 'description', 'publicflag', 'authors'],
};
