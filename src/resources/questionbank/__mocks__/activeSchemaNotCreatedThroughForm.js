export const dataRequestSchema = {
	_id: { $oid: '5fbabae775c2095bdbdc1533' },
	version: { $numberInt: '2' },
	publisher: 'ALLIANCE > SAIL',
	id: { $numberLong: '45651390300502031' },
	status: 'active',
	jsonSchema: {
		pages: [
			{
				description:
					'Who is going to be accessing the data?\n\nSafe People should have the right motivations for accessing research data and understand the legal and ethical considerations when using data that may be sensitive or confidential. Safe People should also have sufficient skills, knowledge and experience to work with the data effectively.  Researchers may need to undergo specific training or accreditation before accessing certain data or research environments and demonstrate that they are part of a bona fide research organisation.\n\nThe purpose of this section is to ensure that:\n- details of people who will be accessing the data and the people who are responsible for completing the application are identified\n- any individual or organisation that intends to access  the data requested is identified\n- all identified individuals have the necessary accreditation and/or expertise to work with the data effectively.',
				title: 'Safe people',
				active: true,
				pageId: 'safepeople',
			},
			{ description: 'Description', title: 'Safe project', active: false, pageId: 'safeproject' },
			{ description: 'Description', title: 'Safe data', active: false, pageId: 'safedata' },
			{ pageId: 'safesettings', active: false, title: 'Safe settings', description: 'Description' },
			{ title: 'Safe outputs', description: 'Description', pageId: 'safeoutputs', active: false },
		],
		formPanels: [
			{ panelId: 'primaryapplicant', index: { $numberDouble: '1.0' }, pageId: 'safepeople' },
			{ index: { $numberDouble: '2.0' }, pageId: 'safepeople', panelId: 'safepeople-otherindividuals' },
			{ index: { $numberDouble: '3.0' }, pageId: 'safeproject', panelId: 'safeproject-aboutthisapplication' },
			{ index: { $numberDouble: '4.0' }, pageId: 'safeproject', panelId: 'safeproject-projectdetails' },
			{ panelId: 'safeproject-funderinformation', index: { $numberDouble: '5.0' }, pageId: 'safeproject' },
			{ index: { $numberDouble: '6.0' }, pageId: 'safeproject', panelId: 'safeproject-sponsorinformation' },
			{ pageId: 'safeproject', index: { $numberDouble: '7.0' }, panelId: 'safeproject-declarationofinterest' },
			{ index: { $numberDouble: '8.0' }, pageId: 'safeproject', panelId: 'safeproject-intellectualproperty' },
			{ panelId: 'safedata-datafields', pageId: 'safedata', index: { $numberDouble: '9.0' } },
			{ index: { $numberDouble: '10.0' }, pageId: 'safedata', panelId: 'safedata-otherdatasetsintentiontolinkdata' },
			{ panelId: 'safedata-lawfulbasis', pageId: 'safedata', index: { $numberDouble: '11.0' } },
			{ panelId: 'safedata-confidentialityavenue', pageId: 'safedata', index: { $numberDouble: '12.0' } },
			{ pageId: 'safedata', index: { $numberDouble: '13.0' }, panelId: 'safedata-ethicalapproval' },
			{ index: { $numberDouble: '14.0' }, pageId: 'safesettings', panelId: 'safesettings-storageandprocessing' },
			{ pageId: 'safesettings', index: { $numberDouble: '15.0' }, panelId: 'safesettings-dataflow' },
			{ panelId: 'safeoutputs-outputsdisseminationplans', index: { $numberDouble: '16.0' }, pageId: 'safeoutputs' },
			{ pageId: 'safeoutputs', index: { $numberDouble: '17.0' }, panelId: 'safeoutputs-retention' },
		],
		questionPanels: [
			{
				questionSets: [{ questionSetId: 'primaryapplicant', index: { $numberDouble: '1.0' } }],
				pageId: 'safepeople',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				panelHeader:
					"Please list the individuals who will have access to the data requested, or are responsible for helping complete this application form. \n\nThis section should include key contact details for the person who is leading the project; key contact details for the person(s) who (are) leading the project from other organisations. Only one contact from each organisation is needed. \n\nThe 'Primary applicant' is the person filling out the application form and principal contact for the application. This is usually the person with operational responsibility for the proposal. Each application must have details for at least one person.\n\nPlease use the file upload function if you're not able to add all individuals via the form.",
				panelId: 'primaryapplicant',
				navHeader: 'Primary applicant',
			},
			{
				questionSets: [
					{ index: { $numberDouble: '1.0' }, questionSetId: 'safepeople-otherindividuals' },
					{ index: { $numberDouble: '100.0' }, questionSetId: 'add-safepeople-otherindividuals' },
				],
				pageId: 'safepeople',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				panelHeader:
					"Please list the individuals who will have access to the data requested, or are responsible for helping complete this application form. \n\nThis section should include key contact details for the person who is leading the project; key contact details for the person(s) who (are) leading the project from other organisations. Only one contact from each organisation is needed. \n\nThe 'Primary applicant' is the person filling out the application form and principal contact for the application. This is usually the person with operational responsibility for the proposal. Each application must have details for at least one person.\n\nPlease use the file upload function if you're not able to add all individuals via the form.",
				panelId: 'safepeople-otherindividuals',
				navHeader: 'Other individuals',
			},
			{
				navHeader: 'About this application',
				panelHeader: '',
				panelId: 'safeproject-aboutthisapplication',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				questionSets: [{ questionSetId: 'safeproject-aboutthisapplication', index: { $numberDouble: '1.0' } }],
				pageId: 'safeproject',
			},
			{
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				pageId: 'safeproject',
				questionSets: [{ index: { $numberDouble: '1.0' }, questionSetId: 'safeproject-projectdetails' }],
				navHeader: 'Project details',
				panelId: 'safeproject-projectdetails',
				panelHeader: '',
			},
			{
				navHeader: 'Funder information',
				panelHeader:
					"A funder is the organisation or body providing the financial resource to make the project possible, and may be different to the organisation detailed in the Safe people section. Please provide details of the main funder organisations supporting this project.\n\nPlease use the file upload function if you're not able to add all funders via the form.",
				panelId: 'safeproject-funderinformation',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				questionSets: [{ questionSetId: 'safeproject-funderinformation', index: { $numberDouble: '1.0' } }],
				pageId: 'safeproject',
			},
			{
				navHeader: 'Sponsor information',
				panelId: 'safeproject-sponsorinformation',
				panelHeader: "Please use the file upload function if you're not able to add all sponsors via the form.",
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				pageId: 'safeproject',
				questionSets: [{ index: { $numberDouble: '1.0' }, questionSetId: 'safeproject-sponsorinformation' }],
			},
			{
				navHeader: 'Declaration of interest',
				panelHeader: '',
				panelId: 'safeproject-declarationofinterest',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				questionSets: [{ questionSetId: 'safeproject-declarationofinterest', index: { $numberDouble: '1.0' } }],
				pageId: 'safeproject',
			},
			{
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				pageId: 'safeproject',
				questionSets: [{ index: { $numberDouble: '1.0' }, questionSetId: 'safeproject-intellectualproperty' }],
				navHeader: 'Intellectual property',
				panelId: 'safeproject-intellectualproperty',
				panelHeader: '',
			},
			{
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				questionSets: [{ questionSetId: 'safedata-datafields', index: { $numberDouble: '1.0' } }],
				pageId: 'safedata',
				navHeader: 'Data fields',
				panelHeader: '',
				panelId: 'safedata-datafields',
			},
			{
				navHeader: 'Other datasets - Intention to link data',
				panelId: 'safedata-otherdatasetsintentiontolinkdata',
				panelHeader: '',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				pageId: 'safedata',
				questionSets: [{ questionSetId: 'safedata-otherdatasetsintentiontolinkdata', index: { $numberDouble: '1.0' } }],
			},
			{
				navHeader: 'Lawful basis',
				panelId: 'safedata-lawfulbasis',
				panelHeader: '',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				pageId: 'safedata',
				questionSets: [{ index: { $numberDouble: '1.0' }, questionSetId: 'safedata-lawfulbasis' }],
			},
			{
				navHeader: 'Confidentiality avenue',
				panelId: 'safedata-confidentialityavenue',
				panelHeader: '',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				pageId: 'safedata',
				questionSets: [{ index: { $numberDouble: '1.0' }, questionSetId: 'safedata-confidentialityavenue' }],
			},
			{
				navHeader: 'Ethical approval',
				panelId: 'safedata-ethicalapproval',
				panelHeader:
					'This section details the research and ethics approval which you have obtained or sought for your project, or otherwise provides evidence as to why such approval is not necessary. For instance, for data analysis done on data deemed anonymous, no ethical approval is explicitly needed for said analyses. \n\nWhere such approval is not in place, it is important that you demonstrate why this is the case and provide assurances if approval is pending. If you need advice on whether ethics approval is necessary, you should approach your local ethics services in the first instance. Information about UK research ethics committees and ethical opinions can be found on the Health Research Authority (HRA) website.',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				pageId: 'safedata',
				questionSets: [{ questionSetId: 'safedata-ethicalapproval', index: { $numberDouble: '1.0' } }],
			},
			{
				panelHeader:
					"This section details in what way the proposal aims to store and use data, and controls in place to minimise risks associated with this storage and use. If you have indicated that your proposal seeks to store and use data exclusively through a recognised trusted research environment, then you do not need to complete this section.\n  In relation to personal data, means any operation or set of operations which is performed on personal data or on sets of personal data (whether or not by automated means, such as collection, recording, organisation, structuring, storage, alteration, retrieval, consultation, use, disclosure, dissemination, restriction, erasure or destruction).\n \n All Locations where processing will be undertaken, for the avoidance of doubt storage is considered processing. For each separate organisation processing data which is not fully anonymous a separate partner organisation form must also be completed.\n \n Processing, in relation to information or data means obtaining, recording or holding the information or data or carrying out any operation or set of operations on the information or data, including—\n a) organisation, adaptation or alteration of the information or data,\n b) retrieval, consultation or use of the information or data,\n c) disclosure of the information or data by transmission,\n dissemination or otherwise making available, or\n d) alignment, combination, blocking, erasure or destruction of the information or data.\n\nPlease note that where an applicant has explicit consent from participants (such as in cohort studies) to hold linked health records, and therefore request extraction of data held by SAIL back to their own research setting, rather than be accessed solely in the remote desktop environment SAIL providers, a user may apply in these circumstances to SAIL for such extraction, with justification provided through the means of their consent documentation and ethical approval to hold such data outside of our secure setting.\n\nPlease use the file upload function if you're not able to add all organisations via the form.",
				panelId: 'safesettings-storageandprocessing',
				navHeader: 'Storage and processing',
				questionSets: [{ questionSetId: 'safesettings-storageandprocessing', index: { $numberDouble: '1.0' } }],
				pageId: 'safesettings',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
			},
			{
				navHeader: 'Dataflow',
				panelHeader: '',
				panelId: 'safesettings-dataflow',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				questionSets: [{ index: { $numberDouble: '1.0' }, questionSetId: 'safesettings-dataflow' }],
				pageId: 'safesettings',
			},
			{
				panelHeader: '',
				panelId: 'safeoutputs-outputsdisseminationplans',
				navHeader: 'Outputs dissemination plans',
				questionSets: [{ questionSetId: 'safeoutputs-outputsdisseminationplans', index: { $numberDouble: '1.0' } }],
				pageId: 'safeoutputs',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
			},
			{
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				questionSets: [{ questionSetId: 'safeoutputs-retention', index: { $numberDouble: '1.0' } }],
				pageId: 'safeoutputs',
				navHeader: 'Retention',
				panelHeader: '',
				panelId: 'safeoutputs-retention',
			},
		],
		questionSets: [
			{
				questionSetId: 'safesettings-dataflow',
				questionSetHeader: 'Dataflow',
				questions: [
					{
						validations: [{ message: 'Please select an option', type: 'isLength', params: [{ $numberDouble: '1.0' }] }],
						question: 'Will the data be transferred outside of the United Kingdom?',
						questionId: 'safedatadataflowdatatransferedoutsideuk',
						input: {
							options: [
								{
									text: 'Yes',
									conditionalQuestions: [
										{
											input: { type: 'textareaInput' },
											questionId: 'safedatadataflowdatatransferedoutsideukdetails',
											question: 'If yes, please provide more details',
										},
									],
									value: 'Yes',
								},
								{ text: 'No', value: 'No' },
							],
							type: 'radioOptionsInput',
							required: true,
							label: 'Will the data be transferred outside of the United Kingdom?',
						},
					},
					{
						input: {
							options: [
								{ text: 'England/Wales', value: 'England/Wales' },
								{ value: 'United Kingdom', text: 'United Kingdom' },
								{ value: 'European Economic Area', text: 'European Economic Area' },
								{ text: 'Other', value: 'Other' },
							],
							type: 'checkboxOptionsInput',
							label: 'Please specify the regions where data will be processed.',
						},
						question: 'Please specify the regions where data will be processed.',
						questionId: 'safedatadataflowregionsdataprocessed',
					},
					{
						question: 'Please provide detailed information on data flows',
						questionId: 'safedatadataflowdetailedinformation',
						input: { type: 'textareaInput' },
					},
					{
						question: 'Please include a data flow diagram for the requested data and any additional datasets intended to be linked.',
						questionId: 'safedatadataflowdiagramenclosed',
						input: {
							label: 'Please include a data flow diagram for the requested data and any additional datasets intended to be linked.',
							options: [{ text: 'I have enclosed a copy of the dataflow', value: 'I have enclosed a copy of the dataflow' }],
							type: 'checkboxOptionsInput',
						},
					},
				],
			},
			{
				questionSetHeader: 'Outputs dissemination plans',
				questionSetId: 'safeoutputs-outputsdisseminationplans',
				questions: [
					{
						validations: [{ params: [{ $numberDouble: '1.0' }], message: 'Please enter a value', type: 'isLength' }],
						question: 'How will proposal findings be disseminated, to what audience and in what format?',
						questionId: 'safeoutputsoutputsdisseminationplansproposalfindings',
						input: { required: true, type: 'textareaInput' },
					},
					{
						question: 'Please include any milestones for outputs dissemination.',
						questionId: 'safeoutputsoutputsdisseminationplansmilestones',
						input: { type: 'textareaInput', required: true },
						validations: [{ type: 'isLength', message: 'Please enter a value', params: [{ $numberDouble: '1.0' }] }],
					},
					{
						questionId: 'safeoutputsoutputsdisseminationplansdisclosurecontrolpolicy',
						question:
							'What steps will be taken to ensure that individuals cannot be identified? Please describe what disclosure control policy will be applied.',
						input: { type: 'textareaInput', required: true },
						validations: [{ params: [{ $numberDouble: '1.0' }], message: 'Please enter a value', type: 'isLength' }],
					},
				],
			},
			{
				questions: [
					{
						validations: [{ params: [{ $numberDouble: '1.0' }], type: 'isLength', message: 'Please enter a value' }],
						input: { required: true, type: 'datePickerCustom' },
						questionId: 'safeoutputs-dataretention-retaindatadate',
						question: 'Please state the date until which you will retain the data',
					},
					{
						questionId: 'safeoutputsdataretentionretaindatadatereason',
						question: 'Please indicate the reason for this date',
						input: { type: 'textareaInput' },
					},
					{
						questionId: 'safeoutputsdataretentionretaindataextensionpermissions',
						question:
							'Please provide details of any permissions that will need to apply for an extension to during this period in order to retain a legal basis to hold the data (e.g. section 251)',
						input: { type: 'textareaInput' },
					},
				],
				questionSetId: 'safeoutputs-retention',
				questionSetHeader: 'Retention',
			},
		],
	},
	createdAt: { $date: { $numberLong: '1606034106629' } },
	updatedAt: { $date: { $numberLong: '1616431822002' } },
	__v: { $numberInt: '0' },
	formType: '5 safe',
	dataSetId: '',
	isCloneable: true,
};

//Combination of the questions in the active schema and the questions in the master schema
export const expectedQuestionStatus = {
	safedatadataflowdatatransferedoutsideuk: 1,
	safedatadataflowregionsdataprocessed: 1,
	safedatadataflowdetailedinformation: 1,
	safedatadataflowdiagramenclosed: 1,
	safeoutputsoutputsdisseminationplansproposalfindings: 1,
	safeoutputsoutputsdisseminationplansmilestones: 1,
	safeoutputsoutputsdisseminationplansdisclosurecontrolpolicy: 1,
	'safeoutputs-dataretention-retaindatadate': 1,
	safeoutputsdataretentionretaindatadatereason: 1,
	safeoutputsdataretentionretaindataextensionpermissions: 1,
	safepeopleprimaryapplicantfullname: 0,
	safepeopleprimaryapplicantjobtitle: 1,
	safepeopleprimaryapplicanttelephone: 0,
	safepeopleprimaryapplicantorcid: 1,
	safepeopleprimaryapplicantemail: 0,
	safepeopleotherindividualsfullname: 1,
	safepeopleotherindividualsjobtitle: 0,
	safepeopleotherindividualsorganisation: 0,
	safepeopleotherindividualsrole: 0,
	safepeopleotherindividualsaccessdata: 1,
	safepeopleotherindividualsaccreditedresearcher: 0,
	safepeopleotherindividualstraininginformationgovernance: 0,
	safepeopleotherindividualsexperience: 1,
};

export const expectedGuidance = {};
export const expectedCountOfChanges = 0;
