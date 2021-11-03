import moment from 'moment';

export const cohortBody = {
	cohort: {
		result: {
			counts: [
				{
					rquest_id: 'RQ-CC-666a461d-4efb-4df0-9f71-32c9d8a45395',
					count: '15015',
				},
				{
					rquest_id: 'RQ-CC-999a461d-4efb-4df0-9f71-32c9d8a45395',
					count: '4501',
				},
				{
					rquest_id: 'RQ-CC-111a461d-4efb-4df0-9f71-32c9d8a45395',
					count: '1420',
				},
			],
		},
		input: {
			collections: [
				{
					rquest_id: 'RQ-CC-666a461d-4efb-4df0-9f71-32c9d8a45395',
					external_id: '0bc0deeb-665d-46f3-bbd2-3a0d3fafe972',
				},
				{
					rquest_id: 'RQ-CC-999a461d-4efb-4df0-9f71-32c9d8a45395',
					external_id: '6d457b01-4d39-4af9-9b27-ae8a025df457',
				},
				{
					rquest_id: 'RQ-CC-111a461d-4efb-4df0-9f71-32c9d8a45395',
					external_id: 'df49e3e0-9362-40a4-b730-996e80ec6a1b',
				},
			],
			cohorts: [
				{
					name: 'cases',
					groups: [
						{
							rules: [
								{
									oper: '=',
									type: 'TEXT',
									varname: 'OMOP:4094814',
									value: 'TRUE',
								},
								{
									oper: '=',
									type: 'TEXT',
									varname: 'OMOP:8507',
									value: 'TRUE',
								},
								{
									oper: '!=',
									type: 'TEXT',
									varname: 'OMOP:8516',
									value: 'TRUE',
								},
							],
							rules_oper: 'AND',
						},
					],
					groups_oper: 'OR',
				},
			],
		},
		query_codes: [
			{
				description: 'Allergy to fish',
				category: 'Observation',
				varname: 'OMOP:4094814',
				value: 'TRUE',
			},
			{
				description: 'Alcoholism',
				category: 'Condition',
				varname: 'OMOP:8507',
				value: 'TRUE',
			},
			{
				description: 'Asthma',
				category: 'Condition',
				varname: 'OMOP:8516',
				value: 'TRUE',
			},
		],
		application: 'bcrquest_server',
		searched_codes: {
			searched_codes: [
				{
					rquest_id: 'RQ-CC-666a461d-4efb-4df0-9f71-32c9d8a45395',
					subsume: ['8516'],
				},
			],
		},
		query_url: 'https://rquest.test.healthdatagateway.org/bcrquest/#!search-results/RQ-5dcb930d-34ff-46e6-afd1-bc0e47fe8805',
	},
	description: 'Title of test cohort',
	user_id: '6936200071297669',
	items: [],
	relatedObjects: [],
	request_id: 'ID1634916312182',
};

export const user = {
	firstname: 'Richard',
	lastname: 'Hobbs',
	userId: 6936200071297669,
};

export const cohortDocumentExpected = {
	type: 'cohort',
	name: 'Title of test cohort',
	activeflag: 'draft',
	userId: '6936200071297669',
	uploaders: [6936200071297669],
	request_id: 'ID1634916312182',
	items: [],
	datasetPids: ['0bc0deeb-665d-46f3-bbd2-3a0d3fafe972', '6d457b01-4d39-4af9-9b27-ae8a025df457', 'df49e3e0-9362-40a4-b730-996e80ec6a1b'],
	filterCriteria: ['Allergy to fish', 'Alcoholism', 'Asthma'],
	relatedObjects: [
		{
			isLocked: true,
			objectId: 123,
			objectType: 'dataset',
			pid: '0bc0deeb-665d-46f3-bbd2-3a0d3fafe972',
			reason: 'The cohort discovery tool has identified this as one of the datasets where this cohort can be found.',
			updated: moment().format('DD MMM YYYY'),
			user: 'Richard Hobbs',
		},
		{
			isLocked: true,
			objectId: 456,
			objectType: 'dataset',
			pid: '6d457b01-4d39-4af9-9b27-ae8a025df457',
			reason: 'The cohort discovery tool has identified this as one of the datasets where this cohort can be found.',
			updated: moment().format('DD MMM YYYY'),
			user: 'Richard Hobbs',
		},
		{
			isLocked: true,
			objectId: 789,
			objectType: 'dataset',
			pid: 'df49e3e0-9362-40a4-b730-996e80ec6a1b',
			reason: 'The cohort discovery tool has identified this as one of the datasets where this cohort can be found.',
			updated: moment().format('DD MMM YYYY'),
			user: 'Richard Hobbs',
		},
	],
	rquestRelatedObjects: [],
	description: '',
	publicflag: true,
	totalResultCount: 20936,
	numberOfDatasets: 3,
	countsPerDataset: [
		{ pid: '0bc0deeb-665d-46f3-bbd2-3a0d3fafe972', count: '15015' },
		{ pid: '6d457b01-4d39-4af9-9b27-ae8a025df457', count: '4501' },
		{ pid: 'df49e3e0-9362-40a4-b730-996e80ec6a1b', count: '1420' },
	],
	cohort: {
		result: {
			counts: [
				{ rquest_id: 'RQ-CC-666a461d-4efb-4df0-9f71-32c9d8a45395', count: '15015' },
				{ rquest_id: 'RQ-CC-999a461d-4efb-4df0-9f71-32c9d8a45395', count: '4501' },
				{ rquest_id: 'RQ-CC-111a461d-4efb-4df0-9f71-32c9d8a45395', count: '1420' },
			],
		},
		input: {
			collections: [
				{ rquest_id: 'RQ-CC-666a461d-4efb-4df0-9f71-32c9d8a45395', external_id: '0bc0deeb-665d-46f3-bbd2-3a0d3fafe972' },
				{ rquest_id: 'RQ-CC-999a461d-4efb-4df0-9f71-32c9d8a45395', external_id: '6d457b01-4d39-4af9-9b27-ae8a025df457' },
				{ rquest_id: 'RQ-CC-111a461d-4efb-4df0-9f71-32c9d8a45395', external_id: 'df49e3e0-9362-40a4-b730-996e80ec6a1b' },
			],
			cohorts: [
				{
					name: 'cases',
					groups: [
						{
							rules: [
								{ oper: '=', type: 'TEXT', varname: 'OMOP:4094814', value: 'TRUE', description: 'Allergy to fish' },
								{ oper: '=', type: 'TEXT', varname: 'OMOP:8507', value: 'TRUE', description: 'Alcoholism' },
								{ oper: '!=', type: 'TEXT', varname: 'OMOP:8516', value: 'TRUE', description: 'Asthma' },
							],
							rules_oper: 'AND',
						},
					],
					groups_oper: 'OR',
				},
			],
		},
		query_codes: [
			{
				description: 'Allergy to fish',
				category: 'Observation',
				varname: 'OMOP:4094814',
				value: 'TRUE',
			},
			{
				description: 'Alcoholism',
				category: 'Condition',
				varname: 'OMOP:8507',
				value: 'TRUE',
			},
			{
				description: 'Asthma',
				category: 'Condition',
				varname: 'OMOP:8516',
				value: 'TRUE',
			},
		],
		application: 'bcrquest_server',
		searched_codes: { searched_codes: [{ rquest_id: 'RQ-CC-666a461d-4efb-4df0-9f71-32c9d8a45395', subsume: ['8516'] }] },
		query_url: 'https://rquest.test.healthdatagateway.org/bcrquest/#!search-results/RQ-5dcb930d-34ff-46e6-afd1-bc0e47fe8805',
	},
};
