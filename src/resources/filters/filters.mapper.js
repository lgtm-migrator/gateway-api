export const datasetFilters = [
	{
		id: 1,
		label: 'Publisher',
		key: 'publisher',
		dataPath: 'datasetfields.publisher',
		type: 'contains',
		tooltip: null,
		closed: true,
		isSearchable: false,
		selectedCount: 0,
		filters: [],
		highlighted: [],
	},
	{
		id: 2,
		label: 'Keywords',
		key: 'features',
		alias: 'datasetfeatures',
		dataPath: 'tags.features',
		type: 'contains',
		tooltip: null,
		closed: true,
		isSearchable: false,
		selectedCount: 0,
		filters: [],
		highlighted: [],
	},
	{
		id: 3,
		label: 'Phenotype',
		key: 'phenotypes',
		dataPath: 'datasetfields.phenotypes',
		type: 'elementMatch',
		matchField: 'name',
		tooltip: null,
		closed: true,
		isSearchable: false,
		selectedCount: 0,
		filters: [],
		highlighted: [],
	},
	{
		id: 4,
		label: 'Coverage',
		key: 'coverage',
		dataPath: 'datasetv2.coverage',
		tooltip: 'The geographical area covered by the dataset.',
		closed: true,
		isSearchable: false,
		selectedCount: 0,
		filters: [
			{
				id: 5,
				label: 'Spatial',
				key: 'spatial',
				dataPath: 'datasetv2.coverage.spatial',
				type: 'contains',
				tooltip: null,
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [],
				highlighted: ['England'],
			},
			{
				id: 6,
				label: 'Physical sample availability',
				key: 'physicalSampleAvailability',
				dataPath: 'datasetv2.coverage.physicalSampleAvailability',
				type: 'contains',
				tooltip: null,
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [],
				highlighted: [],
			},
			{
				id: 7,
				label: 'Follow up',
				key: 'followup',
				dataPath: 'datasetv2.coverage.followup',
				type: 'contains',
				tooltip: 'The typical time span that a patient appears in the dataset',
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [],
				highlighted: [],
			},
		],
	},
	{
		id: 8,
		label: 'Provenance',
		key: 'provenancev2',
		dataPath: 'datasetv2.provenance',
		tooltip: null,
		closed: true,
		isSearchable: false,
		selectedCount: 0,
		filters: [
			{
				id: 9,
				label: 'Purpose',
				key: 'purpose',
				dataPath: 'datasetv2.provenance.origin.purpose',
				type: 'contains',
				tooltip: null,
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [],
				highlighted: [],
			},
			{
				id: 10,
				label: 'Source',
				key: 'source',
				dataPath: 'datasetv2.provenance.origin.source',
				type: 'contains',
				tooltip: null,
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [],
				highlighted: [],
			},
			{
				id: 11,
				label: 'Collection situation',
				key: 'collectionSituation',
				dataPath: 'datasetv2.provenance.origin.collectionSituation',
				type: 'contains',
				tooltip: null,
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [],
				highlighted: [],
			},
			{
				id: 12,
				label: 'Accrual periodicity',
				key: 'accrualPeriodicity',
				dataPath: 'datasetv2.provenance.temporal.accrualPeriodicity',
				type: 'contains',
				tooltip: 'The frequency of publishing.',
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [],
				highlighted: [],
			},
			{
				id: 13,
				label: 'Time lag ',
				key: 'timeLag',
				dataPath: 'datasetv2.provenance.temporal.timeLag',
				type: 'contains',
				tooltip: 'The typical time-lag between an event and the data for that event appearing in the dataset.',
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [],
				highlighted: [],
			},
		],
	},
	{
		id: 14,
		label: 'Access',
		key: 'accessibility',
		dataPath: 'datasetv2.accessibility',
		tooltip: null,
		closed: true,
		isSearchable: false,
		selectedCount: 0,
		filters: [
			{
				id: 15,
				label: 'Delivery lead time',
				key: 'deliveryLeadTime',
				dataPath: 'datasetv2.accessibility.access.deliveryLeadTime',
				type: 'contains',
				tooltip: 'Please provide an indication of the typical processing times based on the types of requests typically received.',
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [],
				highlighted: [],
			},
			{
				id: 16,
				label: 'Jurisdiction',
				key: 'jurisdiction',
				dataPath: 'datasetv2.accessibility.access.jurisdiction',
				type: 'contains',
				tooltip:
					'Select the country/state under whose laws the data subjects’ data is collected, processed and stored. Select all that apply.',
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [],
				highlighted: [],
			},
		],
	},
	{
		id: 17,
		label: 'Format and standards',
		key: 'formatAndStandards',
		dataPath: 'datasetv2.accessibility.formatAndStandards',
		tooltip: null,
		closed: true,
		isSearchable: false,
		selectedCount: 0,
		filters: [
			{
				id: 18,
				label: 'Vocabulary encoding scheme',
				key: 'vocabularyEncodingScheme',
				dataPath: 'datasetv2.accessibility.formatAndStandards.vocabularyEncodingScheme',
				type: 'contains',
				tooltip: 'Terminologies, ontologies and controlled vocabularies being used by the dataset.',
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [],
				highlighted: [],
			},
			{
				id: 19,
				label: 'Conforms to',
				key: 'conformsTo',
				dataPath: 'datasetv2.accessibility.formatAndStandards.conformsTo',
				type: 'contains',
				tooltip: 'Standardised data models that the dataset has been stored in or transformed to.',
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [],
				highlighted: [],
			},
			{
				id: 20,
				label: 'Language',
				key: 'language',
				dataPath: 'datasetv2.accessibility.formatAndStandards.language',
				type: 'contains',
				tooltip: 'Standardised data models that the dataset has been stored in or transformed to.',
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [],
				highlighted: [],
			},
		],
	},
	{
		id: 21,
		label: 'Data utility',
		key: 'datautility',
		dataPath: 'datasetfields.datautility',
		tooltip: null,
		closed: true,
		isSearchable: false,
		selectedCount: 0,
		filters: [
			{
				id: 22,
				label: 'Documentation',
				key: 'documentation',
				dataPath: 'datasetfields.datautility.documentation',
				tooltip: null,
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [
					{
						id: 23,
						label: 'Additional documentation and support',
						key: 'availability_of_additional_documentation_and_support',
						dataPath: 'datasetfields.datautility.availability_of_additional_documentation_and_support',
						type: 'contains',
						tooltip: 'Available dataset documentation in addition to the data dictionary.',
						closed: true,
						isSearchable: false,
						selectedCount: 0,
						filters: [],
						highlighted: [],
					},
					{
						id: 24,
						label: 'Data model',
						key: 'data_model',
						dataPath: 'datasetfields.datautility.data_model',
						type: 'contains',
						tooltip: 'Availability of clear, documented data model.',
						closed: true,
						isSearchable: false,
						selectedCount: 0,
						filters: [],
						highlighted: [],
					},
					{
						id: 25,
						label: 'Data dictionary',
						key: 'data_dictionary',
						dataPath: 'datasetfields.datautility.data_dictionary',
						type: 'contains',
						tooltip: 'Provided documented data dictionary and terminologies.',
						closed: true,
						isSearchable: false,
						selectedCount: 0,
						filters: [],
						highlighted: [],
					},
					{
						id: 26,
						label: 'Provenance',
						key: 'provenance',
						dataPath: 'datasetfields.datautility.provenance',
						type: 'contains',
						tooltip: 'Clear descriptions of source and history of the dataset, providing a ‘transparent data pipeline’.',
						closed: true,
						isSearchable: false,
						selectedCount: 0,
						filters: [],
						highlighted: [],
					},
				],
			},
			{
				id: 27,
				label: 'Technical quality',
				key: 'technicalquality',
				dataPath: 'datasetfields.datautility.technicalquality',
				tooltip: null,
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [
					{
						id: 28,
						label: 'Data Quality Management Process',
						key: 'data_quality_management_process',
						dataPath: 'datasetfields.datautility.data_quality_management_process',
						type: 'contains',
						tooltip: 'Available dataset documentation in addition to the data dictionary.',
						closed: true,
						isSearchable: false,
						selectedCount: 0,
						filters: [],
						highlighted: [],
					},
				],
			},
			{
				id: 29,
				label: 'Access and provision',
				key: 'accessandprovision',
				dataPath: 'datasetfields.datautility.accessandprovision',
				tooltip: null,
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [
					{
						id: 30,
						label: 'Allowable uses',
						key: 'allowable_uses',
						dataPath: 'datasetfields.datautility.allowable_uses',
						type: 'contains',
						tooltip: 'Allowable dataset usages as per the licencing agreement.',
						closed: true,
						isSearchable: false,
						selectedCount: 0,
						filters: [],
						highlighted: [],
					},
					{
						id: 31,
						label: 'Time lag',
						key: 'time_lag',
						dataPath: 'datasetfields.datautility.time_lag',
						type: 'contains',
						tooltip: 'Lag between the data being collected and added to the dataset.',
						closed: true,
						isSearchable: false,
						selectedCount: 0,
						filters: [],
						highlighted: [],
					},
					{
						id: 32,
						label: 'Timeliness',
						key: 'timeliness',
						dataPath: 'datasetfields.datautility.timeliness',
						type: 'contains',
						tooltip: 'Average data access request timeframe.',
						closed: true,
						isSearchable: false,
						selectedCount: 0,
						filters: [],
						highlighted: [],
					},
				],
			},
			{
				id: 33,
				label: 'Value and interest',
				key: 'valueandinterest',
				dataPath: 'datasetfields.datautility.valueandinterest',
				tooltip: null,
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [
					{
						id: 34,
						label: 'Linkages',
						key: 'linkages',
						dataPath: 'datasetfields.datautility.linkages',
						type: 'contains',
						tooltip: 'Ability to link with other datasets.',
						closed: true,
						isSearchable: false,
						selectedCount: 0,
						filters: [],
						highlighted: [],
					},
					{
						id: 35,
						label: 'Data Enrichments',
						key: 'data_enrichments',
						dataPath: 'datasetfields.datautility.data_enrichments',
						type: 'contains',
						tooltip: 'Data sources enriched with annotations, image labels, phenomes, derivations, NLP derived data labels.',
						closed: true,
						isSearchable: false,
						selectedCount: 0,
						filters: [],
						highlighted: [],
					},
				],
			},
			{
				id: 36,
				label: 'Coverage',
				key: 'dataUtility.coverage',
				dataPath: 'datasetfields.datautility.coverage',
				tooltip: null,
				closed: true,
				isSearchable: false,
				selectedCount: 0,
				filters: [
					{
						id: 37,
						label: 'Pathway coverage',
						key: 'pathway_coverage',
						dataPath: 'datasetfields.datautility.pathway_coverage',
						type: 'contains',
						tooltip: 'Representation of multi-disciplinary healthcare data.',
						closed: true,
						isSearchable: false,
						selectedCount: 0,
						filters: [],
						highlighted: [],
					},
					{
						id: 38,
						label: 'Length of follow up',
						key: 'length_of_follow_up',
						dataPath: 'datasetfields.datautility.length_of_follow_up',
						type: 'contains',
						tooltip: 'Data sources enriched with annotations, image labels, phenomes, derivations, NLP derived data labels.',
						closed: true,
						isSearchable: false,
						selectedCount: 0,
						filters: [],
						highlighted: [],
					},
				],
			},
		],
	},
	{
		id: 39,
		label: 'Technical Metadata',
		key: 'technicaldetails',
		dataPath: 'hasTechnicalDetails',
		type: 'boolean',
		tooltip: null,
		closed: true,
		isSearchable: false,
		selectedCount: 0,
		filters: [{ id: 999, label: 'Contains Technical Metadata', value: 'Contains Technical Metadata', checked: false }],
		highlighted: ['contains technical metadata'],
	},
];
