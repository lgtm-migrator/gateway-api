export const datasetActivityLogMocks = [
	{
		_id: '6189679675a82a0867ce55b9',
		eventType: 'newDatasetVersionSubmitted',
		logType: 'dataset',
		timestamp: '12345',
		user: '616993c3034a7d773064e208',
		userDetails: { firstName: 'John', lastName: 'Smith', role: 'custodian' },
		version: '1.0.0',
		versionId: '6189673475a82a0867ce54fa',
		userTypes: ['admin', 'custodian'],
		__v: 0,
	},
	{
		_id: '618967d475a82a0867ce56b0',
		eventType: 'newDatasetVersionSubmitted',
		logType: 'dataset',
		timestamp: '12345',
		user: '616993c3034a7d773064e208',
		userDetails: { firstName: 'John', lastName: 'Smith', role: 'custodian' },
		version: '2.0.0',
		versionId: '618967b075a82a0867ce5650',
		userTypes: ['admin', 'custodian'],
		__v: 0,
	},
];

export const formattedJSONResponseMock = [
	{
		version: 'Version 2.0.0',
		versionNumber: 2,
		meta: {
			dateSubmitted: '12345',
			dateCreated: '12345',
			applicationStatus: 'active',
		},
		events: [
			{
				_id: '618967d475a82a0867ce56b0',
				eventType: 'newDatasetVersionSubmitted',
				logType: 'dataset',
				timestamp: '12345',
				user: '616993c3034a7d773064e208',
				userDetails: {
					firstName: 'John',
					lastName: 'Smith',
					role: 'custodian',
				},
				version: '2.0.0',
				versionId: '618967b075a82a0867ce5650',
				userTypes: ['admin', 'custodian'],
				__v: 0,
			},
		],
	},
	{
		version: 'Version 1.0.0',
		versionNumber: 1,
		meta: {
			dateSubmitted: '12345',
			dateCreated: '12345',
			applicationStatus: 'rejected',
		},
		events: [
			{
				_id: '6189679675a82a0867ce55b9',
				eventType: 'newDatasetVersionSubmitted',
				logType: 'dataset',
				timestamp: '12345',
				user: '616993c3034a7d773064e208',
				userDetails: {
					firstName: 'John',
					lastName: 'Smith',
					role: 'custodian',
				},
				version: '1.0.0',
				versionId: '6189673475a82a0867ce54fa',
				userTypes: ['admin', 'custodian'],
				__v: 0,
			},
		],
	},
];

export const datasetVersionsMock = [
	{
		_id: '6189673475a82a0867ce54fa',
		timestamps: {
			created: '12345',
			submitted: '12345',
		},
		datasetVersion: '1.0.0',
		activeflag: 'rejected',
	},
	{
		_id: '618967b075a82a0867ce5650',
		timestamps: {
			created: '12345',
			submitted: '12345',
		},
		datasetVersion: '2.0.0',
		activeflag: 'active',
	},
];
