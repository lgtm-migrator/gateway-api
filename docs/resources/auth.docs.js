module.exports = {
	'/oauth/token': {
		post: {
			tags: ['Authorization'],
			description:
				'OAuth2.0 token endpoint responsible for issuing short-lived json web tokens (JWT) for access to secure Gateway APIs.  For client credentials grant flow, a valid client id and secret must be provided to identify your application and provide the expected permissions.  This type of authentication is reserved for team based connectivity through client applications and is not provided for human user access.  For more information, contact the HDR-UK team.',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								grant_type: {
									type: 'string',
									description: 'The OAuth2.0 grant type that will be used to provide authentication.',
								},
								client_id: {
									type: 'string',
									description:
										'A unique identifer provided to your team by the HDR-UK team at the time of onboarding to the Gateway.  Contact the HDR-UK team for issue of new credentials.',
								},
								client_secret: {
									type: 'string',
									description:
										'A long (50 character) string provided by the HDR-UK team at the time of onboarding to the Gateway.  Contact the HDR-UK team for issue of new credentials.',
								},
							},
							required: ['grant_type', 'client_secret', 'client_id'],
						},
						examples: {
							'Client Credentials Grant Flow': {
								value: {
									grant_type: 'client_credentials',
									client_id: '2ca1f61a90e3547',
									client_secret: '3f80fecbf781b6da280a8d17aa1a22066fb66daa415d8befc1',
								},
							},
						},
					},
				},
			},
			responses: {
				200: {
					description: 'Successful response containing json web token (JWT) that will authorize an HTTP request against secured resources.',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									access_token: {
										type: 'string',
										description:
											'The encoded json web token (JWT) that must be appended to the Authorization of subsequent API HTTP requests in order to access secured resources.',
									},
									token_type: {
										type: 'string',
										description: 'The type of token issued, in this case, a json web token (JWT).',
									},
									expires_in: {
										type: 'integer',
										description: 'The length of time in seconds before the issued JWT expires, defaulted to 900 seconds (15 minutes).',
									},
								},
							},
							examples: {
								'Client Credentials Grant Flow': {
									value: {
										access_token:
											'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7Il9pZCI6IjYwMGJmYzk5YzhiZjcwMGYyYzdkNWMzNiIsInRpbWVTdGFtcCI2MTYxMjM4MzkwMzE5Nn0sImlhdCI6MTYxMjM4MzkwMywiZXhwIjoxNjEyMzg0ODAzfQ.-YvUBdjtJvdrRacz6E8-cYPQlum4TrEmiCFl8jO5a-M',
										token_type: 'jwt',
										expires_in: 900,
									},
								},
							},
						},
					},
				},
				400: {
					description: 'Failure response caused by incomplete or invalid client credentials being passed to the endpoint.',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: {
										type: 'boolean',
										description: 'A field that indicates the API request failed.',
									},
									message: {
										type: 'string',
										description: 'A message indicating that the request failed for a given reason.',
									},
								},
							},
							examples: {
								'Invalid Client Credentials': {
									value: {
										success: false,
										message: 'Invalid client credentials were provided for the authorisation attempt',
									},
								},
								'Incomplete Client Credentials': {
									value: {
										success: false,
										message: 'Incomplete client credentials were provided for the authorisation attempt',
									},
								},
								'Invalid Grant Type': {
									value: {
										success: false,
										message: 'An invalid grant type has been specified',
									},
								},
							},
						},
					},
				},
			},
		},
	},
};
