import auth from './resources/auth.docs';
import datarequest from './resources/datarequest.docs';
import publisher from './resources/publisher.docs';
import person from './resources/person.docs';
import search from './resources/search.docs';
import stats from './resources/stats.docs';
import message from './resources/message.docs';
import topic from './resources/topic.docs';
import dataset from './resources/dataset.docs';
import project from './resources/project.docs';
import paper from './resources/paper.docs';
import tool from './resources/tool.docs';
import course from './resources/course.docs';
import collection from './resources/collections.docs';
import activitylog from './resources/activitylog.docs';

import collectionsSchema from './schemas/collections.schema';

module.exports = {
	openapi: '3.0.1',
	info: {
		title: 'HDR UK API',
		description: 'API for Tools and artefacts repository.',
		version: '1.0.0',
	},
	servers: [
		{
			url: 'https://api.www.healthdatagateway.org/',
		},
		{
			url: 'http://localhost:3001/',
		},
		{
			url: 'https://api.{environment}.healthdatagateway.org:{port}/',
			variables: {
				environment: {
					default: 'latest',
					description: 'The Environment name.',
				},
				port: {
					enum: ['443'],
					default: '443',
				},
			},
		},
	],
	security: [
		{
			oauth2: [],
		},
	],
	paths: {
		...auth,
		...datarequest,
		...publisher,
		...person,
		...search,
		...stats,
		...message,
		...topic,
		...dataset,
		...project,
		...paper,
		...tool,
		...course,
		...collection,
		...activitylog,
	},
	components: {
		securitySchemes: {
			oauth2: {
				type: 'oauth2',
				flows: {
					clientCredentials: {
						tokenUrl: 'https://api.www.healthdatagateway.org/oauth/token',
						scopes: {},
					},
				},
			},
			cookieAuth: {
				type: 'http',
				scheme: 'bearer',
			},
		},
		schemas: {
			Collections: { ...collectionsSchema },
		},
	},
};
