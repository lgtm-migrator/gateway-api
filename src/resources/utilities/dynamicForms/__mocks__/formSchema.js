module.exports = [
	{
		pages: [
			{
				pageId: 'safepeople',
				active: true,
				title: 'Safe people',
				description: 'TODO',
			},
			{
				title: 'Safe project',
				pageId: 'safeproject',
				active: false,
				description: 'TODO',
			},
			{
				description: 'TODO',
				pageId: 'safesettings',
				active: false,
				title: 'Safe settings',
			},
			{
				description: 'TODO',
				title: 'Safe data',
				pageId: 'safedata',
				active: false,
			},
			{
				title: 'Safe outputs',
				active: false,
				pageId: 'safeoutputs',
				description: 'TODO',
			},
		],
		formPanels: [
			{ panelId: 'applicant', index: 1, pageId: 'safepeople' },
			{
				pageId: 'safepeople',
				index: 2,
				panelId: 'organisationconductingthestudy',
			},
			{ pageId: 'safeproject', index: 3, panelId: 'projectdetails' },
			{ panelId: 'commercialinterest', index: 4, pageId: 'safeproject' },
			{
				panelId: 'organisationwithcommercialinterest',
				pageId: 'safeproject',
				index: 5,
			},
			{ panelId: 'funding', pageId: 'safeproject', index: 6 },
			{ pageId: 'safeproject', index: 7, panelId: 'funderdetails' },
			{ panelId: 'sponsorship', index: 8, pageId: 'safeproject' },
			{ pageId: 'safeproject', index: 9, panelId: 'sponsordetails' },
			{
				panelId: 'geographicallocation',
				pageId: 'safesettings',
				index: 10,
			},
			{ index: 11, pageId: 'safesettings', panelId: 'storage' },
			{ index: 12, pageId: 'safesettings', panelId: 'localstorage' },
			{ pageId: 'safesettings', index: 13, panelId: 'dPA' },
			{
				panelId: 'dataSecurityandProtectionToolkitDSPToolkit',
				pageId: 'safesettings',
				index: 14,
			},
			{ index: 15, pageId: 'safesettings', panelId: 'iSO27001' },
			{ index: 16, pageId: 'safesettings', panelId: 'sLSP' },
			{ pageId: 'safesettings', index: 17, panelId: 'processing' },
			{ index: 18, pageId: 'safesettings', panelId: 'partnerorganisation' },
			{
				index: 19,
				pageId: 'safesettings',
				panelId: 'informationgovernanceassurance',
			},
			{ index: 20, pageId: 'safedata', panelId: 'datasetsrequested' },
			{ panelId: 'otherdatasets', pageId: 'safedata', index: 21 },
			{ pageId: 'safedata', index: 22, panelId: 'legalbasis' },
			{ index: 23, pageId: 'safedata', panelId: 'directcare' },
			{ panelId: 'informedconsent', pageId: 'safedata', index: 24 },
			{ panelId: 'section251exemption', pageId: 'safedata', index: 25 },
			{
				panelId: 'regulation3HealthServicesControlofPatientInformationRegulations2002',
				index: 26,
				pageId: 'safedata',
			},
			{ panelId: 'ethics', index: 27, pageId: 'safedata' },
			{ panelId: 'publication', index: 28, pageId: 'safeoutputs' },
			{ panelId: 'datadestruction', pageId: 'safeoutputs', index: 29 },
		],
		questionPanels: [
			{
				questionPanelHeaderText: 'Applicant details section',
				panelId: 'applicant',
				pageId: 'safepeople',
				navHeader: 'Applicant',
				questionSets: [
					{ index: 1, questionSetId: 'applicant' },
					{ index: 100, questionSetId: 'addApplicant' },
				],
			},
			{
				panelId: 'organisationconductingthestudy',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				questionSets: [{ index: 1, questionSetId: 'organisationconductingthestudy' }],
				navHeader: 'Organisation conducting the study',
				pageId: 'safepeople',
				panelHeader: 'Organisation conducting the study',
			},
			{
				navHeader: 'Project details',
				questionSets: [{ index: 1, questionSetId: 'projectdetails' }],
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				panelId: 'projectdetails',
				panelHeader: 'Project details',
				pageId: 'safeproject',
			},
			{
				navHeader: 'Commercial interest',
				questionSets: [{ index: 1, questionSetId: 'commercialinterest' }],
				panelId: 'commercialinterest',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				pageId: 'safeproject',
				panelHeader: 'Commercial interest',
			},
			{
				questionSets: [{ index: 1, questionSetId: 'organisationwithcommercialinterest' }],
				panelId: 'organisationwithcommercialinterest',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				navHeader: 'Organisation with commercial interest',
				panelHeader: 'Organisation with commercial interest',
				pageId: 'safeproject',
			},
			{
				pageId: 'safeproject',
				panelHeader: 'Funding',
				panelId: 'funding',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				questionSets: [{ index: 1, questionSetId: 'funding' }],
				navHeader: 'Funding',
			},
			{
				navHeader: 'Funder details',
				questionSets: [{ index: 1, questionSetId: 'funderdetails' }],
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				panelId: 'funderdetails',
				panelHeader: 'Funder details',
				pageId: 'safeproject',
			},
			{
				pageId: 'safeproject',
				panelHeader: 'Sponsorship',
				navHeader: 'Sponsorship',
				questionSets: [{ index: 1, questionSetId: 'sponsorship' }],
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				panelId: 'sponsorship',
			},
			{
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				panelId: 'sponsordetails',
				questionSets: [{ questionSetId: 'sponsordetails', index: 1 }],
				navHeader: 'Sponsor details',
				pageId: 'safeproject',
				panelHeader: 'Sponsor details',
			},
			{
				pageId: 'safesettings',
				panelHeader: 'Geographical location',
				navHeader: 'Geographical location',
				panelId: 'geographicallocation',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				questionSets: [{ questionSetId: 'geographicallocation', index: 1 }],
			},
			{
				navHeader: 'Storage',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				panelId: 'storage',
				questionSets: [{ index: 1, questionSetId: 'storage' }],
				pageId: 'safesettings',
				panelHeader: 'Storage',
			},
			{
				navHeader: 'Local storage',
				panelId: 'localstorage',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				questionSets: [{ index: 1, questionSetId: 'localstorage' }],
				panelHeader: 'Local storage',
				pageId: 'safesettings',
			},
			{
				panelHeader: 'DPA',
				pageId: 'safesettings',
				navHeader: 'DPA',
				questionSets: [{ questionSetId: 'dPA', index: 1 }],
				panelId: 'dPA',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
			},
			{
				panelHeader: 'Data Security and Protection Toolkit (DSP Toolkit)',
				pageId: 'safesettings',
				navHeader: 'Data Security and Protection Toolkit (DSP Toolkit)',
				panelId: 'dataSecurityandProtectionToolkitDSPToolkit',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				questionSets: [
					{
						questionSetId: 'dataSecurityandProtectionToolkitDSPToolkit',
						index: 1,
					},
				],
			},
			{
				panelHeader: 'ISO 27001',
				pageId: 'safesettings',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				panelId: 'iSO27001',
				questionSets: [{ questionSetId: 'iSO27001', index: 1 }],
				navHeader: 'ISO 27001',
			},
			{
				navHeader: 'SLSP',
				questionSets: [{ index: 1, questionSetId: 'sLSP' }],
				panelId: 'sLSP',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				panelHeader: 'SLSP',
				pageId: 'safesettings',
			},
			{
				pageId: 'safesettings',
				panelHeader: 'Processing',
				navHeader: 'Processing',
				questionSets: [{ questionSetId: 'processing', index: 1 }],
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				panelId: 'processing',
			},
			{
				navHeader: 'Partner organisation',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				panelId: 'partnerorganisation',
				questionSets: [{ questionSetId: 'partnerorganisation', index: 1 }],
				pageId: 'safesettings',
				panelHeader: 'Partner organisation',
			},
			{
				panelHeader: 'Information governance assurance',
				pageId: 'safesettings',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				panelId: 'informationgovernanceassurance',
				questionSets: [{ index: 1, questionSetId: 'informationgovernanceassurance' }],
				navHeader: 'Information governance assurance',
			},
			{
				navHeader: 'Datasets requested',
				questionSets: [{ index: 1, questionSetId: 'datasetsrequested' }],
				panelId: 'datasetsrequested',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				pageId: 'safedata',
				panelHeader: 'Datasets requested',
			},
			{
				panelHeader: 'Other datasets',
				pageId: 'safedata',
				panelId: 'otherdatasets',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				questionSets: [{ index: 1, questionSetId: 'otherdatasets' }],
				navHeader: 'Other datasets',
			},
			{
				panelHeader: 'Legal basis',
				pageId: 'safedata',
				navHeader: 'Legal basis',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				panelId: 'legalbasis',
				questionSets: [{ questionSetId: 'legalbasis', index: 1 }],
			},
			{
				questionSets: [{ questionSetId: 'directcare', index: 1 }],
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				panelId: 'directcare',
				navHeader: 'Direct care',
				pageId: 'safedata',
				panelHeader: 'Direct care',
			},
			{
				navHeader: 'Informed consent',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				panelId: 'informedconsent',
				questionSets: [{ questionSetId: 'informedconsent', index: 1 }],
				pageId: 'safedata',
				panelHeader: 'Informed consent',
			},
			{
				navHeader: 'Section 251 exemption',
				questionSets: [{ index: 1, questionSetId: 'section251exemption' }],
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				panelId: 'section251exemption',
				panelHeader: 'Section 251 exemption',
				pageId: 'safedata',
			},
			{
				panelId: 'regulation3HealthServicesControlofPatientInformationRegulations2002',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				questionSets: [
					{
						questionSetId: 'regulation3HealthServicesControlofPatientInformationRegulations2002',
						index: 1,
					},
				],
				navHeader: 'Regulation 3 Health Services (Control of Patient Information Regulations 2002)',
				panelHeader: 'Regulation 3 Health Services (Control of Patient Information Regulations 2002)',
				pageId: 'safedata',
			},
			{
				pageId: 'safedata',
				panelHeader: 'Ethics',
				navHeader: 'Ethics',
				questionSets: [{ index: 1, questionSetId: 'ethics' }],
				panelId: 'ethics',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
			},
			{
				navHeader: 'Publication',
				questionSets: [{ index: 1, questionSetId: 'publication' }],
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				panelId: 'publication',
				pageId: 'safeoutputs',
				panelHeader: 'Publication',
			},
			{
				questionSets: [{ questionSetId: 'datadestruction', index: 1 }],
				panelId: 'datadestruction',
				questionPanelHeaderText: 'TODO: We need a decription for this panel',
				navHeader: 'Data destruction',
				panelHeader: 'Data destruction',
				pageId: 'safeoutputs',
			},
		],
		questionSets: [
			{
				questionSetHeader: 'Applicant Details',
				questionSetId: 'applicant',
				questions: [
					{
						questionId: 'role',
						question: 'Role',
						input: {
							type: 'checkboxOptionsInput',
							options: [
								{
									text: 'Principle investigator',
									value: 'Principle investigator',
								},
								{ text: 'Main applicant', value: 'Main applicant' },
								{
									text: 'Investigator/collaborator',
									value: 'Investigator/collaborator',
								},
								{
									text: 'Other',
									value: 'Other',
									conditionalQuestions: [
										{
											questionId: 'roleOther',
											question: 'Other role please specify',
											input: { type: 'textInput' },
											validations: [{ type: 'isLength', params: [5] }],
										},
									],
								},
							],
						},
						guidance: 'Select a role for the individual.',
					},
					{
						questionId: 'fullname',
						question: 'Full name',
						input: {
							type: 'typeaheadUser',
							placeholder: 'Please select',
							options: ['javascript', 'node'],
						},
						validateOn: 'blur',
						validations: [{ type: 'isLength', params: [1] }],
						guidance: 'All applicants must have an account in the Gateway.',
					},
					{
						questionId: 'applicantjobtitle',
						question: 'Job Title',
						input: { type: 'textInput' },
						guidance: 'Job title.',
					},
					{
						questionId: 'bio',
						question: 'Affiliation',
						input: { type: 'textInput', disabled: true },
						guidance: 'University of Cambridge.',
					},
					{
						questionId: 'orcid',
						question: 'ORCID',
						input: { type: 'textInput', disabled: true },
						guidance: 'ORCID.',
					},
					{
						questionId: 'email',
						question: 'Email',
						input: { type: 'textInput', disabled: true },
						guidance: 'Email.',
					},
				],
			},
			{
				questions: [
					{
						questionId: 'organisationname',
						guidance: 'Enter guidance text here',
						validations: [{ params: [1], type: 'isLength' }],
						input: { type: 'textInput' },
						question: 'Organisation name',
					},
					{
						questionId: 'registeredaddressline1',
						validations: [{ type: 'isLength', params: [1] }],
						guidance: 'Enter guidance text here',
						input: { type: 'textInput' },
						question: 'Registered address (line 1)',
					},
					{
						questionId: 'registeredaddressline2',
						validations: [{ type: 'isLength', params: [1] }],
						guidance: 'Enter guidance text here',
						input: { type: 'textInput' },
						question: 'Registered address (line 2)',
					},
					{
						questionId: 'city',
						guidance: 'Enter guidance text here',
						validations: [{ params: [1], type: 'isLength' }],
						input: { type: 'textInput' },
						question: 'City',
					},
					{
						questionId: 'postcode',
						guidance: 'Enter guidance text here',
						validations: [{ params: [1], type: 'isLength' }],
						input: { type: 'textInput' },
						question: 'Postcode',
					},
					{
						questionId: 'country',
						guidance: 'Enter guidance text here',
						validations: [{ params: [1], type: 'isLength' }],
						input: { type: 'textInput' },
						question: 'Country',
					},
					{
						questionId: 'organisationtype',
						guidance: 'Enter guidance text here',
						validations: [{ type: 'isLength', params: [1] }],
						input: {
							options: [
								{
									text: 'Academic institution',
									value: 'Academic institution',
								},
								{ value: '(UK)', text: '(UK)' },
								{ text: 'Commercial', value: 'Commercial' },
								{
									value: 'CQC-registered health and/or social care provider',
									text: 'CQC-registered health and/or social care provider',
								},
								{
									text: 'CQC approved national contractor',
									value: 'CQC approved national contractor',
								},
								{ text: 'Local authority', value: 'Local authority' },
								{
									text: 'Government agency (health and social care)',
									value: 'Government agency (health and social care)',
								},
								{
									value: 'Government agency outside of health and adult social care',
									text: 'Government agency outside of health and adult social care',
								},
								{
									value: 'Independent sector organisation',
									text: 'Independent sector organisation',
								},
								{ text: 'Charity', value: 'Charity' },
								{
									value: 'International Organisation',
									text: 'International Organisation',
								},
								{
									value: 'Other (please specify)',
									text: 'Other (please specify)',
								},
							],
							type: 'selectInput',
						},
						question: 'Organisation type',
					},
				],
				questionSetHeader: 'Organisation conducting the study',
				questionSetId: 'organisationconductingthestudy',
			},
			{
				questionSetHeader: 'Project details',
				questions: [
					{
						input: { type: 'textInput' },
						question: 'Title of study',
						questionId: 'titleofstudy',
						validations: [{ params: [1], type: 'isLength' }],
						guidance: 'Enter guidance text here',
					},
					{
						input: {
							options: [
								{ text: 'Service evaluation', value: 'false' },
								{ value: 'false', text: 'Research' },
								{ value: 'false', text: 'Clinical audit' },
								{ text: 'Surveillance', value: 'false' },
								{ value: 'false', text: 'Other (please specify)' },
							],
							type: 'radioOptionsInput',
						},
						question: 'What is the study type?',
						questionId: 'whatisthestudytype',
						guidance: 'Enter guidance text here',
						validations: [{ params: [1], type: 'isLength' }],
					},
					{
						validations: [{ params: [1], type: 'isLength' }],
						questionId: 'thisapplicationis',
						question: 'This application is...',
						input: {
							type: 'radioOptionsInput',
							options: [
								{ value: 'false', text: 'A new application' },
								{
									text: 'An amendment to an existing application extension',
									value: 'false',
								},
								{ text: 'A renewal of an existing approval', value: 'false' },
								{
									value: 'false',
									text: 'Related to a previous application (approved or not)',
								},
							],
						},
					},
					{
						validations: [{ params: [1], type: 'isLength' }],
						questionId: 'pleaseprovidealaysummaryoftheproject',
						question: 'Please provide a lay summary of the project',
						input: { type: 'textareaInput' },
					},
					{
						question: 'What are the project aims, objectives and rationale?',
						input: { type: 'textareaInput' },
						validations: [{ params: [1], type: 'isLength' }],
						questionId: 'whataretheprojectaimsobjectivesandrationale',
					},
					{
						questionId: 'whatistheprojectMethodology',
						validations: [{ type: 'isLength', params: [1] }],
						input: { type: 'textareaInput' },
						question: 'What is the project Methodology?',
					},
					{
						question: 'What is the anticipated public health benefit and/or impact of conducting this project?',
						input: { type: 'textareaInput' },
						validations: [{ type: 'isLength', params: [1] }],
						questionId: 'whatistheanticipatedpublichealthbenefitandorimpactofconductingthisproject',
					},
					{
						validations: [{ params: [1], type: 'isLength' }],
						questionId: 'whenwillyouneedthedata',
						question: 'When will you need the data?',
						input: { type: 'textInput' },
					},
					{
						input: { type: 'textInput' },
						question: 'How long will you need the data? (months)',
						questionId: 'howlongwillyouneedthedatamonths',
						validations: [{ type: 'isLength', params: [1] }, { type: 'isNumeric' }],
					},
					{
						input: { type: 'textareaInput' },
						question:
							'Can you provide an outline of the public engagement strategy of the study or a brief explanation why there is no public engagement?',
						questionId: 'canyouprovideanoutlineofthepublicengagementstrategyofthestudyorabriefexplanationwhythereisnopublicengagement',
					},
				],
				questionSetId: 'projectdetails',
			},
			{
				questions: [
					{
						input: {
							options: [
								{ value: 'false', text: 'Yes' },
								{ text: 'No', value: 'false' },
							],
							type: 'radioOptionsInput',
						},
						question: 'Is there a commercial interest in the project, either by funding or direct input into project design or team?',
						questionId: 'isthereacommercialinterestintheprojecteitherbyfundingordirectinputintoprojectdesignorteam',
						validations: [{ type: 'isLength', params: [1] }],
					},
				],
				questionSetHeader: 'Commercial interest',
				questionSetId: 'commercialinterest',
			},
			{
				questionSetId: 'organisationwithcommercialinterest',
				questions: [
					{
						questionId: 'organisationname',
						guidance: 'Enter guidance text here',
						input: { type: 'textInput' },
						question: 'Organisation name',
					},
					{
						input: { type: 'textInput' },
						question: 'Registered address (line 1)',
						questionId: 'registeredaddressline1',
						guidance: 'Enter guidance text here',
					},
					{
						question: 'Registered address (line 2)',
						input: { type: 'textInput' },
						guidance: 'Enter guidance text here',
						questionId: 'registeredaddressline2',
					},
					{
						questionId: 'city',
						guidance: 'Enter guidance text here',
						input: { type: 'textInput' },
						question: 'City',
					},
					{
						question: 'Postcode',
						input: { type: 'textInput' },
						guidance: 'Enter guidance text here',
						questionId: 'postcode',
					},
					{
						input: { type: 'textInput' },
						question: 'Country',
						questionId: 'country',
						guidance: 'Enter guidance text here',
					},
					{
						questionId: 'pleasedescribethenatureofinterest',
						input: { type: 'textareaInput' },
						question: 'Please describe the nature of interest',
					},
				],
				questionSetHeader: 'Organisation with commercial interest',
			},
			{
				questionSetId: 'funding',
				questions: [
					{
						question: 'Does your project have a funder?',
						input: {
							type: 'radioOptionsInput',
							options: [
								{ text: 'Yes', value: 'false' },
								{ text: 'No', value: 'false' },
							],
						},
						validations: [{ type: 'isLength', params: [1] }],
						questionId: 'doesyourprojecthaveafunder',
					},
				],
				questionSetHeader: 'Funding',
			},
			{
				questionSetHeader: 'Funder details',
				questions: [
					{
						input: { type: 'textInput' },
						question: 'Organisation name',
						questionId: 'organisationname',
						guidance: 'Enter guidance text here',
					},
					{
						questionId: 'registeredaddressline1',
						guidance: 'Enter guidance text here',
						input: { type: 'textInput' },
						question: 'Registered address (line 1)',
					},
					{
						question: 'Registered address (line 2)',
						input: { type: 'textInput' },
						guidance: 'Enter guidance text here',
						questionId: 'registeredaddressline2',
					},
					{
						input: { type: 'textInput' },
						question: 'City',
						questionId: 'city',
						guidance: 'Enter guidance text here',
					},
					{
						question: 'Postcode',
						input: { type: 'textInput' },
						guidance: 'Enter guidance text here',
						questionId: 'postcode',
					},
					{
						guidance: 'Enter guidance text here',
						questionId: 'country',
						question: 'Country',
						input: { type: 'textInput' },
					},
				],
				questionSetId: 'funderdetails',
			},
			{
				questionSetId: 'sponsorship',
				questions: [
					{
						questionId: 'doesyourprojecthaveasponsor',
						validations: [{ params: [1], type: 'isLength' }],
						input: {
							options: [
								{ value: 'false', text: 'Yes' },
								{ value: 'false', text: 'No' },
							],
							type: 'radioOptionsInput',
						},
						question: 'Does your project have a sponsor?',
					},
				],
				questionSetHeader: 'Sponsorship',
			},
			{
				questions: [
					{
						questionId: 'organisationname',
						guidance: 'Enter guidance text here',
						input: { type: 'textInput' },
						question: 'Organisation name',
					},
					{
						questionId: 'registeredaddressline1',
						guidance: 'Enter guidance text here',
						input: { type: 'textInput' },
						question: 'Registered address (line 1)',
					},
					{
						input: { type: 'textInput' },
						question: 'Registered address (line 2)',
						questionId: 'registeredaddressline2',
						guidance: 'Enter guidance text here',
					},
					{
						questionId: 'city',
						guidance: 'Enter guidance text here',
						input: { type: 'textInput' },
						question: 'City',
					},
					{
						questionId: 'postcode',
						guidance: 'Enter guidance text here',
						input: { type: 'textInput' },
						question: 'Postcode',
					},
				],
				questionSetHeader: 'Sponsor details',
				questionSetId: 'sponsordetails',
			},
			{
				questions: [
					{
						question: 'Will the data be stored or processed outside of the UK?',
						input: {
							options: [
								{ text: 'UK', value: 'UK' },
								{ text: 'EU', value: 'EU' },
								{ text: 'Worldwide', value: 'Worldwide' },
							],
							type: 'checkboxOptionsInput',
						},
						guidance: 'Enter guidance text here',
						questionId: 'willthedatabestoredorprocessedoutsideoftheUK',
					},
				],
				questionSetHeader: 'Geographical location',
				questionSetId: 'geographicallocation',
			},
			{
				questions: [
					{
						questionId: 'wherewillthedatabestored',
						guidance: 'Enter guidance text here',
						input: {
							type: 'radioOptionsInput',
							options: [
								{ text: 'Trusted Research Environment', value: 'false' },
								{ value: 'false', text: 'Local storage' },
							],
						},
						question: 'Where will the data be stored?',
					},
				],
				questionSetHeader: 'Storage',
				questionSetId: 'storage',
			},
			{
				questionSetHeader: 'Local storage',
				questions: [
					{
						guidance: 'Enter guidance text here',
						questionId: 'organisationname',
						question: 'Organisation name',
						input: { type: 'textInput' },
					},
					{
						input: {
							options: [
								{ value: 'DPA registration', text: 'DPA registration' },
								{
									text: 'Data Security and Protection Toolkit (DSP Toolkit)',
									value: 'Data Security and Protection Toolkit (DSP Toolkit)',
								},
								{ value: 'ISO 27001', text: 'ISO 27001' },
								{ value: 'SLSP', text: 'SLSP' },
								{
									text: 'Other (please specify)',
									value: 'Other (please specify)',
								},
							],
							type: 'checkboxOptionsInput',
						},
						question: 'What type of security assurance does this organisation have in place?',
						questionId: 'whattypeofsecurityassurancedoesthisorganisationhaveinplace',
						guidance: 'Enter guidance text here',
					},
				],
				questionSetId: 'localstorage',
			},
			{
				questionSetId: 'dPA',
				questions: [
					{
						question: 'DPA Registration code',
						input: { type: 'textInput' },
						guidance: 'Enter guidance text here',
						questionId: 'dPARegistrationcode',
					},
					{
						questionId: 'dPAExpirationdate',
						guidance: 'Enter guidance text here',
						input: { type: 'textInput' },
						question: 'DPA Expiration date',
					},
				],
				questionSetHeader: 'DPA',
			},
			{
				questions: [
					{
						guidance: 'Enter guidance text here',
						questionId: 'organisationcode',
						question: 'Organisation code',
						input: { type: 'textInput' },
					},
					{
						questionId: 'toolkitscore',
						guidance: 'Enter guidance text here',
						input: { type: 'textInput' },
						question: 'Toolkit score',
					},
					{
						questionId: 'versioncompleted',
						guidance: 'Enter guidance text here',
						input: { type: 'textInput' },
						question: 'Version completed',
					},
				],
				questionSetHeader: 'Data Security and Protection Toolkit (DSP Toolkit)',
				questionSetId: 'dataSecurityandProtectionToolkitDSPToolkit',
			},
			{
				questionSetId: 'iSO27001',
				questions: [
					{
						question: 'Please enclose a copy of your certificate',
						input: {
							options: [
								{
									value: 'I have enclosed a copy of my certificate',
									text: 'I have enclosed a copy of my certificate',
								},
							],
							type: 'checkboxOptionsInput',
						},
						guidance: 'Enter guidance text here',
						questionId: 'pleaseencloseacopyofyourcertificate',
					},
				],
				questionSetHeader: 'ISO 27001',
			},
			{
				questions: [
					{
						input: {
							type: 'checkboxOptionsInput',
							options: [
								{
									text: 'I have enclosed a completed system level security policy for ODR review',
									value: 'I have enclosed a completed system level security policy for ODR review',
								},
							],
						},
						question: 'Please enclose a completed system level security policy for ODR review',
						questionId: 'pleaseencloseacompletedsystemlevelsecuritypolicyforODRreview',
						guidance: 'Enter guidance text here',
					},
				],
				questionSetHeader: 'SLSP',
				questionSetId: 'sLSP',
			},
			{
				questions: [
					{
						guidance: 'Enter guidance text here',
						questionId: 'wherewillthedatabeprocessed',
						question: 'Where will the data be processed?',
						input: {
							type: 'checkboxOptionsInput',
							options: [
								{
									text: 'Same environment as storage',
									value: 'Same environment as storage',
								},
								{
									value: 'Partner organisation',
									text: 'Partner organisation',
								},
							],
						},
					},
				],
				questionSetHeader: 'Processing',
				questionSetId: 'processing',
			},
			{
				questions: [
					{
						questionId: 'organisationname',
						guidance: 'Enter guidance text here',
						input: { type: 'textInput' },
						question: 'Organisation name',
					},
					{
						question: 'Registered address (line 1)',
						input: { type: 'textInput' },
						guidance: 'Enter guidance text here',
						questionId: 'registeredaddressline1',
					},
					{
						guidance: 'Enter guidance text here',
						questionId: 'registeredaddressline2',
						question: 'Registered address (line 2)',
						input: { type: 'textInput' },
					},
					{
						questionId: 'city',
						guidance: 'Enter guidance text here',
						input: { type: 'textInput' },
						question: 'City',
					},
					{
						guidance: 'Enter guidance text here',
						questionId: 'postcode',
						question: 'Postcode',
						input: { type: 'textInput' },
					},
				],
				questionSetHeader: 'Partner organisation',
				questionSetId: 'partnerorganisation',
			},
			{
				questionSetHeader: 'Information governance assurance',
				questions: [
					{
						questionId: 'pleaseconfirmtheitemsbelow',
						validations: [{ type: 'isLength', params: [1] }],
						input: {
							type: 'checkboxOptionsInput',
							options: [
								{
									value:
										'I certify that the individual(s) who will process the data is a/are bona fide worker(s) at the applicant’s organisation',
									text:
										'I certify that the individual(s) who will process the data is a/are bona fide worker(s) at the applicant’s organisation',
								},
								{
									text:
										'I certify that the individual(s) (including permanent, temporary and locums) who is/ will process the data has/have been subject to personnel background checks and their employment contracts include compliance with organisational information governance standards.',
									value:
										'I certify that the individual(s) (including permanent, temporary and locums) who is/ will process the data has/have been subject to personnel background checks and their employment contracts include compliance with organisational information governance standards.',
								},
								{
									text:
										'I certify that information governance awareness and mandatory training procedures are in place and the individual(s) who is/ will process the data is/are appropriately trained.',
									value:
										'I certify that information governance awareness and mandatory training procedures are in place and the individual(s) who is/ will process the data is/are appropriately trained.',
								},
								{
									value:
										'I certify that the data can be entrusted to the organisation, in the knowledge that the individual(s) processing the data will conscientiously discharge his/her/their obligations, including with regard to confidentiality of the data.',
									text:
										'I certify that the data can be entrusted to the organisation, in the knowledge that the individual(s) processing the data will conscientiously discharge his/her/their obligations, including with regard to confidentiality of the data.',
								},
							],
						},
						question: 'Please confirm the items below',
					},
				],
				questionSetId: 'informationgovernanceassurance',
			},
			{
				questionSetId: 'datasetsrequested',
				questions: [
					{
						question: 'Please indicate all datasets necessary to conduct the project',
						input: { type: 'textareaInput' },
						questionId: 'pleaseindicatealldatasetsnecessarytoconducttheproject',
					},
					{
						questionId: 'howwillthedatarequestedbeusedinthedeliveryoftheproject',
						question: 'How will the data requested be used in the delivery of the project?',
						input: { type: 'textareaInput' },
					},
					{
						question: 'Please classify the datasets requested',
						input: {
							options: [
								{ value: 'false', text: 'Anonymous' },
								{ text: 'De-identified', value: 'false' },
								{ text: 'Personally identifiable', value: 'false' },
							],
							type: 'radioOptionsInput',
						},
						validations: [{ params: [1], type: 'isLength' }],
						questionId: 'pleaseclassifythedatasetsrequested',
					},
					{
						question: 'Please indicate the data frequency required for the project',
						input: {
							type: 'radioOptionsInput',
							options: [
								{ value: 'false', text: 'One off' },
								{ text: 'Periodic - monthly', value: 'false' },
								{ value: 'false', text: 'Periodic - quarterly' },
								{ value: 'false', text: 'Periodic - annually' },
								{ text: 'Other (please specify)', value: 'false' },
							],
						},
						questionId: 'pleaseindicatethedatafrequencyrequiredfortheproject',
					},
				],
				questionSetHeader: 'Datasets requested',
			},
			{
				questionSetId: 'otherdatasets',
				questionSetHeader: 'Other datasets',
				questions: [
					{
						questionId: 'specifyanydatalinkagesrequirementsincludingdataflowsbetweendatacustodians',
						question: 'Specify any data linkages requirements including data flows between data custodians.',
						input: { type: 'textareaInput' },
					},
					{
						questionId:
							'describeanydatasetsalreadyheldfortheprojectpleaseincludedatasetnameclassificationofthedatathelegalbasisforprocessingandthedatasetperiod',
						input: { type: 'textareaInput' },
						question:
							'Describe any datasets already held for the project (please include dataset name, classification of the data, the legal basis for processing and the dataset period).',
					},
					{
						question: 'Please provide details of any data sharing agreement already in place for this project',
						input: {
							type: 'checkboxOptionsInput',
							options: [
								{
									text: 'I have enclosed a copy of existing sharing agreement documents',
									value: 'I have enclosed a copy of existing sharing agreement documents',
								},
							],
						},
						questionId: 'pleaseprovidedetailsofanydatasharingagreementalreadyinplaceforthisproject',
					},
				],
			},
			{
				questionSetHeader: 'Legal basis',
				questions: [
					{
						guidance:
							'To process personal data, an exemption to the common law duty of confidence must be evidenced. Applicants must indicate the legal gateway under which confidential information (NOT personal data!) will be processed by the applicant directly or data processor(s) acting on the directive of the applicant. Where more than one exemption applies, please provide evidence of each',
						questionId: 'pleaseprovidethelegalbasistoprocessconfidentialinformation',
						question: 'Please provide the legal basis to process confidential information',
						input: {
							options: [
								{ text: 'Direct care', value: 'Direct care' },
								{ value: 'Informed consent', text: 'Informed consent' },
								{
									text: 'Section 251 exemption',
									value: 'Section 251 exemption',
								},
								{
									value: 'Regulation 3 Health Services (Control of Patient Information Regulations 2002)',
									text: 'Regulation 3 Health Services (Control of Patient Information Regulations 2002)',
								},
							],
							type: 'checkboxOptionsInput',
						},
					},
				],
				questionSetId: 'legalbasis',
			},
			{
				questions: [
					{
						questionId: 'pleaseencloseevidenceofcaldicottguardianorotherapprovedsignatoryforprocessingthedataforthepurposesoutlinedabove',
						question:
							'Please enclose evidence of caldicott guardian or other approved signatory for processing the data for the purpose(s) outlined above.',
						input: {
							type: 'checkboxOptionsInput',
							options: [
								{
									value: 'I have enclosed evidence of caldicott guardian or other approved signatory',
									text: 'I have enclosed evidence of caldicott guardian or other approved signatory',
								},
							],
						},
					},
					{
						question: 'Signed letter from guardian',
						input: {
							type: 'checkboxOptionsInput',
							options: [
								{
									value: 'I have enclosed a signed letter from my Caldicott guardian',
									text: 'I have enclosed a signed letter from my Caldicott guardian',
								},
							],
						},
						questionId: 'signedletterfromguardian',
					},
					{
						questionId: 'caldicottguardianname',
						question: 'Caldicott guardian name',
						input: { type: 'textInput' },
					},
				],
				questionSetHeader: 'Direct care',
				questionSetId: 'directcare',
			},
			{
				questionSetHeader: 'Informed consent',
				questions: [
					{
						questionId: 'pleaseencloseacopyofblankconsentformandanyassociatedpatientinformationdocumentswiththisform',
						input: {
							type: 'checkboxOptionsInput',
							options: [
								{
									text:
										'I have enclosed a blank copy of the consent form(s) and all associated patient information materials (letters of invitations, leaflets, questionnaires etc.)',
									value:
										'I have enclosed a blank copy of the consent form(s) and all associated patient information materials (letters of invitations, leaflets, questionnaires etc.)',
								},
							],
						},
						question: 'Please enclose a copy of blank consent form and any associated patient information documents with this form',
					},
				],
				questionSetId: 'informedconsent',
			},
			{
				questionSetHeader: 'Section 251 exemption',
				questions: [
					{
						input: { type: 'textInput' },
						question: 'CAR reference',
						questionId: 'cARreference',
					},
					{
						input: { type: 'textInput' },
						question: 'Date of approval',
						questionId: 'dateofapproval',
					},
					{
						questionId: 'dateofnextrenewal',
						input: { type: 'textInput' },
						question: 'Date of next renewal',
					},
				],
				questionSetId: 'section251exemption',
			},
			{
				questions: [
					{
						input: {
							type: 'checkboxOptionsInput',
							options: [
								{
									value: 'I have enclosed a copy of the S251 approval, approved amendments and any renewal letters',
									text: 'I have enclosed a copy of the S251 approval, approved amendments and any renewal letters',
								},
							],
						},
						question: 'Please enclose a copy of the S251 approval, approved amendments and any renewal letters',
						questionId: 'pleaseencloseacopyoftheS251approvalapprovedamendmentsandanyrenewalletters',
					},
					{
						question:
							'Please enclose all letters documenting that section 251 support has been granted and remains extant, sent to you by data custodian for this project.',
						input: {
							options: [
								{
									value: 'I have enclosed a copy of the S251 approval, approved amendments and any renewal letters from data custodian',
									text: 'I have enclosed a copy of the S251 approval, approved amendments and any renewal letters from data custodian',
								},
							],
							type: 'checkboxOptionsInput',
						},
						questionId:
							'pleaseenclosealllettersdocumentingthatsection251supporthasbeengrantedandremainsextantsenttoyoubydatacustodianforthisproject',
					},
				],
				questionSetHeader: 'Regulation 3 Health Services (Control of Patient Information Regulations 2002)',
				questionSetId: 'regulation3HealthServicesControlofPatientInformationRegulations2002',
			},
			{
				questions: [
					{
						question: 'Has ethics approval been obtained?',
						input: {
							options: [
								{ text: 'Yes', value: 'Yes' },
								{ text: 'No', value: 'No' },
							],
							type: 'checkboxOptionsInput',
						},
						questionId: 'hasethicsapprovalbeenobtained',
					},
					{
						question: 'REC Committee name',
						input: { type: 'textInput' },
						questionId: 'rECCommitteename',
					},
					{
						questionId: 'rECreferencenumber',
						question: 'REC reference number',
						input: { type: 'textInput' },
					},
					{
						questionId: 'othercommittee',
						input: { type: 'textInput' },
						question: 'Other committee',
					},
					{
						questionId: 'pleaseencloseacopyofthefinalRECapprovalletterandlettersdocumentinganyRECapprovedamendments',
						input: {
							options: [
								{
									value: 'I have enclosed a copy of the final REC approval letter and letters documenting any REC-approved amendments',
									text: 'I have enclosed a copy of the final REC approval letter and letters documenting any REC-approved amendments',
								},
							],
							type: 'checkboxOptionsInput',
						},
						question: 'Please enclose a copy of the final REC approval letter and letters documenting any REC-approved amendments',
					},
				],
				questionSetHeader: 'Ethics',
				questionSetId: 'ethics',
			},
			{
				questionSetHeader: 'Publication',
				questions: [
					{
						questionId: 'pleasedescribeanypublicationplansincludingmilestonesforpublication',
						question: 'Please describe any publication plans including milestones for publication',
						input: { type: 'textareaInput' },
					},
					{
						questionId: 'howwillproposalfindingsbepublishedtowhataudienceandinwhatformatPleasegivedetails',
						input: { type: 'textareaInput' },
						question: 'How will proposal findings be published, to what audience and in what format? Please give details.',
					},
					{
						questionId:
							'whatstepswillbetakentoensurethatindividualscannotbeidentifiedPleasedescribewhatdisclosurecontrolpolicywillbeapplied',
						question:
							'What steps will be taken to ensure that individuals cannot be identified? Please describe what disclosure control policy will be applied',
						input: { type: 'textareaInput' },
					},
					{
						questionId: 'willtheoutputsbepublishedinanopenaccessplatform',
						input: { type: 'textareaInput' },
						question: 'Will the outputs be published in an open access platform?',
					},
				],
				questionSetId: 'publication',
			},
			{
				questionSetHeader: 'Data destruction',
				questions: [
					{
						questionId:
							'howlongdoyouintendtoretainidentifiableorpotentiallyidentifiableinformationaftertheconclusionoftheprojectincludingarchivebackupcopies',
						input: { type: 'textareaInput' },
						question:
							'How long do you intend to retain identifiable or potentially identifiable information after the conclusion of the project (including archive/backup copies)?',
					},
					{
						questionId: 'whatmethodofdestructionwillbeusedwhenthisperiodhasexpired',
						input: { type: 'textareaInput' },
						question: 'What method of destruction will be used when this period has expired?',
					},
					{
						input: { type: 'textareaInput' },
						question: 'What evidence will be obtained that destruction has occurred?',
						questionId: 'whatevidencewillbeobtainedthatdestructionhasoccurred',
					},
				],
				questionSetId: 'datadestruction',
			},
			{
				questionSetId: 'addApplicant',
				questions: [
					{
						questionId: 'addFirstName',
						input: {
							type: 'buttonInput',
							action: 'addRepeatableSection',
							panelId: 'applicant',
							text: '+ Add another person to this application',
							class: 'btn btn-primary addButton',
						},
						guidance: 'Some safe project guidance.',
					},
				],
			},
		],
	},
];
