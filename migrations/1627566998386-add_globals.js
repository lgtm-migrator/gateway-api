import { GlobalModel } from '../src/resources/global/global.model';

/**
 * Make any changes you need to make to the database here
 */
async function up() {
	// Write migration here
	await GlobalModel.updateOne({ localeId: globalData.localeId }, globalData, { upsert: true });
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down() {
	// Write migration here
	await GlobalModel.deleteOne({ localeId: globalData.localeId });
}

const globalData = {
	languageCode: 'en',
	localeId: 'en-gb',
	entry: {
		name: 'dataUtility',
		items: [
			{
				key: 'allowable_uses',
				dimension: 'Allowable uses',
				category: 'Access & Provision',
				definition: 'Allowable dataset usages as per the licencing agreement, following ethical and IG approval',
				includeInWizard: true,
				wizardStepTitle: 'Allowable uses',
				wizardStepDescription: 'What is your type of project? (optional)',
				wizardStepOrder: 1,
				entries: [
					{
						displayOrder: 1,
						definition: 'Available for specific academic research uses only',
						label: 'Academic research',
						impliedValues: ['platinum', 'gold', 'silver', 'bronze'],
					},
					{
						displayOrder: 2,
						definition:
							'Available for wider commercial uses (in line with ethical and IG approval), and addition to academic and other non-commercial uses',
						label: 'Commercial',
						impliedValues: ['platinum', 'gold'],
					},
					{
						displayOrder: 3,
						definition:
							'Available for limited commercial uses (e.g. relating to a specific domain), in addition to academic and other non-commercial uses',
						label: 'Non-profit',
						impliedValues: ['platinum', 'gold', 'silver'],
					},
				],
			},
			{
				key: 'time_lag',
				dimension: 'Time Lag',
				category: 'Access & Provision',
				definition: 'Lag between the data being collected and added to the dataset',
				includeInWizard: true,
				wizardStepTitle: 'Time lag',
				wizardStepDescription: 'What time lag is acceptable? (optional)',
				wizardStepOrder: 2,
				entries: [
					{
						value: 'platinum',
						displayOrder: 1,
						definition: 'Effectively real-time data',
						label: 'Real-time data',
					},
					{
						value: 'gold',
						displayOrder: 2,
						definition: 'Approximately 1 week',
						label: '1 week',
					},
					{
						value: 'silver',
						displayOrder: 3,
						definition: 'Effectively real-time data',
						label: 'Approximately 1 month',
					},
					{
						value: 'bronze',
						displayOrder: 4,
						definition: 'Effectively real-time data',
						label: 'Approximately 1 year',
					},
				],
			},
			{
				key: 'timeliness',
				dimension: 'Timeliness',
				category: 'Access & Provision',
				definition: 'Average data access request timeframe',
				entries: [
					{
						value: 'platinum',
						displayOrder: 1,
						definition: 'Less than 2 weeks',
					},
					{
						value: 'gold',
						displayOrder: 2,
						definition: 'Less than 1 month',
					},
					{
						value: 'silver',
						displayOrder: 3,
						definition: 'Less than 3 months',
					},
					{
						value: 'bronze',
						displayOrder: 4,
						definition: 'Less than 6 months',
					},
				],
			},
			{
				key: 'data_quality_management_process',
				dimension: 'Data Quality Management Process',
				category: 'Technical Quality',
				definition: 'The level of maturity of the data quality management processes ',
				entries: [
					{
						value: 'platinum',
						displayOrder: 1,
						definition: 'Externally verified compliance with the data management plan, e.g. by ISO, CQC, ICO or other body',
					},
					{
						value: 'silver',
						displayOrder: 2,
						definition: 'Evidence that the data management plan has been implemented is available',
					},
					{
						value: 'bronze',
						displayOrder: 3,
						definition: 'A documented data management plan covering collection, auditing, and management is available for the dataset',
					},
				],
			},
			{
				key: 'pathway_coverage',
				dimension: 'Pathway coverage',
				category: 'Coverage',
				definition: 'Representation of multi-disciplinary healthcare data',
				entries: [
					{
						value: 'platinum',
						displayOrder: 1,
						definition: 'Contains data across more than two tiers',
						impliedValues: ['platinum', 'gold', 'silver', 'bronze'],
					},
					{
						value: 'gold',
						displayOrder: 2,
						definition: 'Contains multimodal data or data that is linked across two tiers (e.g. primary and secondary care)',
						impliedValues: ['gold', 'silver', 'bronze'],
					},
					{
						value: 'silver',
						displayOrder: 3,
						definition: 'Contains data from multiple specialties or services within a single tier of care',
						impliedValues: ['silver', 'bronze'],
					},
					{
						value: 'bronze',
						displayOrder: 4,
						definition: 'Contains data from a single speciality or area',
						impliedValues: ['bronze'],
					},
				],
			},
			{
				key: 'length_of_follow_up',
				dimension: 'Length of follow up',
				category: 'Coverage',
				definition: 'Average timeframe in which a patient appears in a dataset (follow up period)',
				wizardStepTitle: 'Length of follow up',
				wizardStepDescription: 'What time frame for patients appearing in datasets is acceptable? (optional)',
				includeInWizard: true,
				wizardStepOrder: 3,
				entries: [
					{
						value: 'platinum',
						displayOrder: 1,
						definition: 'More than 10 years',
						label: 'More than 10 years',
						impliedValues: ['platinum', 'gold', 'silver', 'bronze'],
					},
					{
						value: 'gold',
						displayOrder: 2,
						definition: 'Between 1-10 years',
						label: 'Between 1-10 years',
						impliedValues: ['gold', 'silver', 'bronze'],
					},
					{
						value: 'silver',
						displayOrder: 3,
						definition: 'Between 6-12 months',
						label: 'Between 6-12 months',
						impliedValues: ['silver', 'bronze'],
					},
					{
						value: 'bronze',
						displayOrder: 4,
						definition: 'Between 1-6 months',
						label: 'Between 1-6 months',
						impliedValues: ['bronze'],
					},
				],
			},
			{
				key: 'availability_of_additional_documentation_and_support',
				dimension: 'Availability of additional documentation and support',
				category: 'Data Documentation',
				definition: 'Available dataset documentation in addition to the data dictionary',
				entries: [
					{
						value: 'platinum',
						displayOrder: 1,
						definition: 'As Gold, plus support personnel available to answer questions',
					},
					{
						value: 'gold',
						displayOrder: 2,
						definition:
							'As Silver, plus dataset publication was supported with a journal article explaining the dataset in detail, or dataset training materials',
					},
					{
						value: 'silver',
						displayOrder: 3,
						definition: 'Comprehensive ReadMe describing extracting and use of data, Dataset FAQS available, Visual data model provided',
					},
					{
						value: 'bronze',
						displayOrder: 4,
						definition: 'Past journal articles demonstrate that knowledge of the data exists',
					},
				],
			},
			{
				key: 'data_model',
				dimension: 'Data Model',
				category: 'Data Documentation',
				definition: 'Availability of clear, documented data model',
				includeInWizard: true,
				wizardStepTitle: 'Data model',
				wizardStepDescription: 'What availability of the data model is acceptable? (optional)',
				wizardStepOrder: 4,
				entries: [
					{
						value: 'platinum',
						displayOrder: 1,
						definition: 'Data Model conforms to a national standard and key fields codified using a national/international standard',
						label: 'Conforms to national standard and codified to national/international standard',
            impliedValues: ['platinum', 'gold', 'silver', 'bronze']
					},
					{
						value: 'gold',
						displayOrder: 2,
						definition: 'Key fields codified using a national or international standard',
						label: 'Codified using national/international standard',
            impliedValues: ['gold', 'silver', 'bronze']
					},
					{
						value: 'silver',
						displayOrder: 3,
						definition: 'Key fields codified using a local standard',
						label: 'Codified using local standard',
            impliedValues: ['silver', 'bronze']
					},
					{
						value: 'bronze',
						displayOrder: 4,
						definition: 'Known and accepted data model but some key field un-coded or free text',
						label: 'Known and accepted data model ',
            impliedValues: ['bronze']
					},
				],
			},
			{
				key: 'data_dictionary',
				dimension: 'Data Dictionary',
				category: 'Data Documentation',
				definition: 'Provided documented data dictionary and terminologies',
				entries: [
					{
						value: 'platinum',
						displayOrder: 1,
						definition: 'Dictionary is based on international standards and includes mapping',
					},
					{
						value: 'gold',
						displayOrder: 2,
						definition: 'Dictionary relates to national definitions',
					},
					{
						value: 'silver',
						displayOrder: 3,
						definition: 'Definitions compiled into local data dictionary which is available online',
					},
					{
						value: 'bronze',
						displayOrder: 4,
						definition: 'Data definitions available',
					},
				],
			},
			{
				key: 'provenance',
				dimension: 'Provenance',
				category: 'Data Documentation',
				definition: 'Clear description of source and history of the dataset, providing a "transparent data pipeline"',
				includeInWizard: true,
				wizardStepTitle: 'Provenance',
				wizardStepDescription: 'What availability of the dataset source is acceptable? (optional)',
				wizardStepOrder: 5,
				entries: [
					{
						value: 'platinum',
						displayOrder: 1,
						definition:
							'Ability to view earlier versions, including versions before any transformations have been applied data (in line with deidentification and IG approval) and review the impact of each stage of data cleaning',
						label: 'Earlier and ‘raw’ versions and the impact of each stage of data cleaning',
            impliedValues: ['platinum', 'gold', 'silver', 'bronze']
					},
					{
						value: 'gold',
						displayOrder: 2,
						definition: 'All original data items listed, all transformations, rules and exclusion listed and impact of these',
						label: 'All original data items, transformations, rules, exclusions and impact listed',
            impliedValues: ['gold', 'silver', 'bronze']
					},
					{
						value: 'silver',
						displayOrder: 3,
						definition: 'Source of the dataset and any transformations, rules and exclusions documented',
						label: 'Dataset source, any transformations, rule and exclusions documented',
            impliedValues: ['silver', 'bronze']
					},
					{
						value: 'bronze',
						displayOrder: 4,
						definition: 'Source of the dataset is documented',
						label: 'Dataset source documented',
            impliedValues: ['bronze']
					},
				],
			},
			{
				key: 'linkages',
				dimension: 'Linkages',
				category: 'Value & Interest',
				definition: 'Ability to link with other datasets',
				entries: [
					{
						value: 'platinum',
						displayOrder: 1,
						definition: 'Existing linkage with reusable or downstream approvals',
					},
					{
						value: 'gold',
						displayOrder: 2,
						definition:
							'List of restrictions on the type of linkages detailed. List of previously successful dataset linkages performed, with navigable links to linked datasets via at DOI/URL',
					},
					{
						value: 'silver',
						displayOrder: 3,
						definition: 'Available linkages outlined and/or List of datasets previously successfully linked provided',
					},
					{
						value: 'bronze',
						displayOrder: 4,
						definition: 'Identifiers to demonstrate ability to link to other datasets',
					},
				],
			},
			{
				key: 'data_enrichments',
				dimension: 'Data Enrichments',
				category: 'Value & Interest',
				definition: 'Data sources enriched with annotations, image labels, phenomes, derivations, NLP derived data labels',
				entries: [
					{
						value: 'platinum',
						displayOrder: 1,
						definition: 'The data include additional derived fields, or enriched data',
					},
					{
						value: 'gold',
						displayOrder: 2,
						definition: 'The data include additional derived fields, or enriched data used by other available data sources',
					},
					{
						value: 'silver',
						displayOrder: 3,
						definition: 'The derived fields or enriched data were generated from, or used by, a peer reviewed algorithm',
					},
					{
						value: 'bronze',
						displayOrder: 4,
						definition: 'The data includes derived fields or enriched data from a national report',
					},
				],
			},
		],
	},
};

module.exports = { up, down };
