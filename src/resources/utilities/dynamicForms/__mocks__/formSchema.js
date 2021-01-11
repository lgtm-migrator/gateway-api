module.exports = [
	{
		pages: [
			{
				active: true,
				description:
					'Who is going to be accessing the data?\\n\\nSafe People should have the right motivations for accessing research data and understand the legal and ethical considerations when using data that may be sensitive or confidential. Safe People should also have sufficient skills, knowledge and experience to work with the data effectively.  Researchers may need to undergo specific training or accreditation before accessing certain data or research environments and demonstrate that they are part of a bona fide research organisation.\\n\\nThe purpose of this section is to ensure that:\\n- details of people who will be accessing the data and the people who are responsible for completing the application are identified\\n- any individual or organisation that intends to access  the data requested is identified\\n- all identified individuals have the necessary accreditation and/or expertise to work with the data effectively.',
				pageId: 'safepeople',
				title: 'Safe people',
			},
			{
				pageId: 'safeproject',
				title: 'Safe project',
				active: false,
				description:
					'What is the purpose of accessing the data?\\n\\nSafe projects are those that have a valid research purpose with a defined public benefit. \\nFor access to data to be granted the researchers need to demonstrate that their proposal is an appropriate and ethical use of the data, and that it is intended to deliver clear public benefits.  The purpose of this section is to ensure that:\\n- the project rationale is explained in lay terms\\n- the research purpose has a defined public benefit. This can be new knowledge, new treatments, improved pathways of care, new techniques of training staff. \\n- how the data requested will be used to achieve the project objectives is articulated.',
			},
			{
				description:
					'Safe data ensure that researchers have a clear legal basis for accessing the data and do not inadvertently learn something about the data subjects during the course of their analysis, minimising the risks of re-identification.\\nThe minimisation of this risk could be achieved by removing direct identifiers, aggregating values, banding variables, or other statistical techniques that may make re-identification more difficult. Sensitive or confidential data could not be considered to be completely safe because of the residual risk to a data subject’s confidentiality.  Hence other limitations on access will need to be applied.\\n\\nThe purpose of this section is to ensure that: \\n- there is a clear legal basis for accessing the requested data\\n- the data requested is proportionate to the requirement of the project \\n- all data requested is necessary in order to achieve the public benefit declared \\n- data subjects cannot be identified by your team by cross-referencing data sets from anywhere else.',
				active: false,
				title: 'Safe data',
				pageId: 'safedata',
			},
			{
				active: false,
				description:
					'Safe settings are analytics environments where researchers can access and analyse the requested datasets in a safe and ethical way. Safe settings encompass the physical environment and procedural arrangements such as the supervision and auditing regimes. For safe settings, the likelihood of both deliberate and accidental disclosure needs to be explicitly considered.\\n\\nThe purpose of this section is to ensure that:\\n\\n- researchers access requested data in a secure and controlled setting such as a Trusted Research Environment (TRE) that limits the unauthorised use of the data\\n- practical controls and appropriate restrictions are in place if researchers access data though non-TRE environment. There may be requirements that data is held on restricted access servers, encrypted and only decrypted at the point of use.',
				pageId: 'safesettings',
				title: 'Safe settings',
			},
			{
				active: false,
				description:
					'Safe outputs ensure that all research outputs cannot be used to identity data subjects. They typically include ‘descriptive statistics’ that have been sufficiently aggregated such that identification is near enough impossible, and modelled outputs which are inherently non-confidential.\\nThe purpose of this section is to ensure that:\\n\\n- controls are in place to minimise risks associated with planned outputs and publications \\n\\n- the researchers aim to openly publish their results to enable use, scrutiny and further research.',
				pageId: 'safeoutputs',
				title: 'Safe outputs',
			},
		],
		formPanels: [
			{
				pageId: 'safepeople',
				index: 1,
				panelId: 'applicant',
			},
			{
				pageId: 'safepeople',
				panelId: 'safepeople-otherindividuals',
				index: 2,
			},
			{
				panelId: 'safeproject-aboutthisapplication',
				index: 3,
				pageId: 'safeproject',
			},
			{
				panelId: 'safeproject-projectdetails',
				index: 4,
				pageId: 'safeproject',
			},
			{
				panelId: 'safeproject-funderinformation',
				index: 5,
				pageId: 'safeproject',
			},
			{
				index: 6,
				panelId: 'safeproject-sponsorinformation',
				pageId: 'safeproject',
			},
			{
				pageId: 'safeproject',
				index: 7,
				panelId: 'safeproject-declarationofinterest',
			},
			{
				panelId: 'safeproject-intellectualproperty',
				index: 8,
				pageId: 'safeproject',
			},
			{
				panelId: 'safedata-datafields',
				index: 9,
				pageId: 'safedata',
			},
			{
				pageId: 'safedata',
				panelId: 'safedata-otherdatasetsintentiontolinkdata',
				index: 10,
			},
			{
				pageId: 'safedata',
				panelId: 'safedata-lawfulbasis',
				index: 11,
			},
			{
				panelId: 'safedata-confidentialityavenue',
				index: 12,
				pageId: 'safedata',
			},
			{
				panelId: 'safedata-ethicsapproval',
				index: 13,
				pageId: 'safedata',
			},
			{
				pageId: 'safesettings',
				index: 14,
				panelId: 'safesettings-storageandprocessing',
			},
			{
				index: 15,
				panelId: 'safesettings-dataflow',
				pageId: 'safesettings',
			},
			{
				pageId: 'safeoutputs',
				index: 16,
				panelId: 'safeoutputs-outputsdisseminationplans',
			},
			{
				pageId: 'safeoutputs',
				index: 17,
				panelId: 'safeoutputs-retention',
			},
		],
		questionPanels: [
			{
				pageId: 'safepeople',
				panelHeader:
					"Please list the individuals who will have access to the data requested, or are responsible for helping complete this application form. \\n\\nThis section should include key contact details for the person who is leading the project; key contact details for the person(s) who (are) leading the project from other organisations. Only one contact from each organisation is needed. \\n\\nThe 'Primary applicant' is the person filling out the application form and principal contact for the application. This is usually the person with operational responsibility for the proposal. Each application must have details for at least one person.\\n\\nPlease use the file upload function if you're not able to add all individuals via the form.",
				navHeader: 'Applicant',
				questionSets: [
					{
						questionSetId: 'applicant',
						index: 1,
					},
				],
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				panelId: 'applicant',
			},
			{
				panelHeader:
					"Please list the individuals who will have access to the data requested, or are responsible for helping complete this application form. \\n\\nThis section should include key contact details for the person who is leading the project; key contact details for the person(s) who (are) leading the project from other organisations. Only one contact from each organisation is needed. \\n\\nThe 'Primary applicant' is the person filling out the application form and principal contact for the application. This is usually the person with operational responsibility for the proposal. Each application must have details for at least one person.\\n\\nPlease use the file upload function if you're not able to add all individuals via the form.",
				pageId: 'safepeople',
				navHeader: 'Other individuals',
				questionSets: [
					{
						index: 1,
						questionSetId: 'safepeople-otherindividuals',
					},
					{
						index: 100,
						questionSetId: 'add-safepeople-otherindividuals',
					},
				],
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				panelId: 'safepeople-otherindividuals',
			},
			{
				navHeader: 'About this application',
				pageId: 'safeproject',
				panelHeader: '',
				panelId: 'safeproject-aboutthisapplication',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				questionSets: [
					{
						questionSetId: 'safeproject-aboutthisapplication',
						index: 1,
					},
				],
			},
			{
				questionSets: [
					{
						index: 1,
						questionSetId: 'safeproject-projectdetails',
					},
				],
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				panelId: 'safeproject-projectdetails',
				panelHeader: '',
				pageId: 'safeproject',
				navHeader: 'Project details',
			},
			{
				pageId: 'safeproject',
				panelHeader:
					"A funder is the organisation or body providing the financial resource to make the project possible, and may be different to the organisation detailed in the Safe people section. Please provide details of the main funder organisations supporting this project.\\n\\nPlease use the file upload function if you're not able to add all funders via the form.",
				navHeader: 'Funder information',
				questionSets: [
					{
						index: 1,
						questionSetId: 'safeproject-funderinformation',
					},
				],
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				panelId: 'safeproject-funderinformation',
			},
			{
				panelHeader:
					"The sponsor is usually, but does not have to be, the main funder of the research. The sponsor takes primary responsibility for ensuring that the design of the project meets appropriate standards and that arrangements are in place to ensure appropriate conduct and reporting. \\n\\nPlease use the file upload function if you're not able to add all sponsors via the form.",
				pageId: 'safeproject',
				navHeader: 'Sponsor information',
				panelId: 'safeproject-sponsorinformation',
				questionSets: [
					{
						index: 1,
						questionSetId: 'safeproject-sponsorinformation',
					},
				],
				questionPanelHeaderText: 'TODO: We need a description for this panel',
			},
			{
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				questionSets: [
					{
						index: 1,
						questionSetId: 'safeproject-declarationofinterest',
					},
				],
				panelId: 'safeproject-declarationofinterest',
				navHeader: 'Declaration of interest',
				pageId: 'safeproject',
				panelHeader:
					'All interests that might unduly influence an individual’s judgement and objectivity in the use of the data being requested are of relevance, particularly if it involves payment or financial inducement. \\r\\n\\nThese might include any involvement of commercial organisations at arm’s-length to the project, or likely impact on commercial organisations, individually or collectively, that might result from the outcomes or methodology of the project.\\n\\nAll individuals named in this application who have an interest this application must declare their interest. ',
			},
			{
				navHeader: 'Intellectual property',
				pageId: 'safeproject',
				panelHeader:
					'All interests that might unduly influence an individual’s judgement and objectivity in the use of the data being requested are of relevance, particularly if it involves payment or financial inducement. \\r\\n\\nThese might include any involvement of commercial organisations at arm’s-length to the project, or likely impact on commercial organisations, individually or collectively, that might result from the outcomes or methodology of the project.\\n\\nAll individuals named in this application who have an interest this application must declare their interest. ',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				questionSets: [
					{
						index: 1,
						questionSetId: 'safeproject-intellectualproperty',
					},
				],
				panelId: 'safeproject-intellectualproperty',
			},
			{
				navHeader: 'Data fields',
				pageId: 'safedata',
				panelHeader:
					'These are the Information assets which your proposal seeks to access and use.\\n\\nYou should consider this definition to be wide in scope and include any source of information which you propose to access and use. The data may be highly structured or less structured in nature, already existing or to be newly collected or gathered. \\n\\nExamples may include national datasets, local data sets, national or local extracts from systems, national or local registries or networks, patient records, or new information to be gathered from patients, families or other cohorts. \\n\\nNew data” should only include data that is being specifically gathered for the first time for the purposes of this proposal. i.e. data already held in case notes and transferred to a form is not “new” data, but a survey filled out by clinicians in order to gather information not recorded anywhere else is “new”.\\n\\n',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				questionSets: [
					{
						questionSetId: 'safedata-datafields',
						index: 1,
					},
				],
				panelId: 'safedata-datafields',
			},
			{
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				questionSets: [
					{
						questionSetId: 'safedata-otherdatasetsintentiontolinkdata',
						index: 1,
					},
				],
				panelId: 'safedata-otherdatasetsintentiontolinkdata',
				navHeader: 'Other datasets - Intention to link data',
				pageId: 'safedata',
				panelHeader:
					'This section should include information on the planned use of datasets not already included in this application. The following information is required:\\n\\nA descriptive name so that it is clear what the dataset is. \\n\\nSufficient information to explain the content of the dataset.  \\n\\nWhether the proposal requires linkage of data, the use of matched controls, or the extraction of anonymised data.\\n\\nPlease indicate which organisation or body is undertaking these processes and which variables from the data sources requested will be used to achieve the proposed linkage. This should cover every dataset and variable you will require. ',
			},
			{
				navHeader: 'Lawful basis',
				pageId: 'safedata',
				panelHeader:
					'General Data Protection Regulation (GDPR) applies to ‘controllers’ and ‘processors’. \\n\\nA controller determines the purposes and means of processing personal data.\\n\\nA processor is responsible for processing personal data on behalf of a controller.\\n \\nGDPR applies to processing carried out by organisations operating within the EU. It also applies to organisations outside the EU that offer goods or services to individuals in the EU.\\nGDPR does not apply to certain activities including processing covered by the Law Enforcement Directive, processing for national security purposes and processing carried out by individuals purely for personal/household activities. \\n \\nGDPR only applies to information which relates to an identifiable living individual. Information relating to a deceased person does not constitute personal data and therefore is not subject to the GDPR.',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				questionSets: [
					{
						questionSetId: 'safedata-lawfulbasis',
						index: 1,
					},
				],
				panelId: 'safedata-lawfulbasis',
			},
			{
				questionSets: [
					{
						questionSetId: 'safedata-confidentialityavenue',
						index: 1,
					},
				],
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				panelId: 'safedata-confidentialityavenue',
				pageId: 'safedata',
				panelHeader:
					'If confidential information is being disclosed , the organisations holding this data (both the organisation disclosing the information and the recipient organisation) must also have a lawful basis to hold and use this information, and if applicable, have a condition to hold and use special categories of confidential information, and be fair and transparent about how they hold and use this data. \\n\\nIn England and Wales, if you are using section 251 of the NHS Act 2006 (s251) as a legal basis for identifiable data, you will need to ensure that you have the latest approval letter and application. \\n\\nFor Scotland this application will be reviewed by the Public Benefit and Privacy Panel.\\n\\nIn Northern Ireland it will be considered by the Privacy Advisory Committee. If you are using patient consent as the legal basis, you will need to provide all relevant consent forms and information leaflets. ',
				navHeader: 'Confidentiality avenue',
			},
			{
				navHeader: 'Ethics approval',
				pageId: 'safedata',
				panelHeader:
					'This section details the research and ethics approval which you have obtained or sought for your project, or otherwise provides evidence as to why such approval is not necessary. \\nWhere such approval is not in place, it is important that you demonstrate why this is the case and provide assurances if approval is pending.  If you need advice on whether ethics approval is necessary, you should approach your local ethics services in the first instance. Information about UK research ethics committees and ethical opinions can be found on the Health Research Authority (HRA) website.\\n',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				questionSets: [
					{
						questionSetId: 'safedata-ethicsapproval',
						index: 1,
					},
				],
				panelId: 'safedata-ethicsapproval',
			},
			{
				questionSets: [
					{
						index: 1,
						questionSetId: 'safesettings-storageandprocessing',
					},
				],
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				panelId: 'safesettings-storageandprocessing',
				pageId: 'safesettings',
				panelHeader:
					"This section details in what way the proposal aims to store and use data, and controls in place to minimise risks associated with this storage and use. If you have indicated that your proposal seeks to store and use data exclusively through a recognised trusted research environment, then you do not need to complete this section.\\n \\nIn relation to personal data, means any operation or set of operations which is performed on personal data or on sets of personal data (whether or not by automated means, such as collection, recording, organisation, structuring, storage, alteration, retrieval, consultation, use, disclosure, dissemination, restriction, erasure or destruction).\\n \\nAll Locations where processing will be undertaken, for the avoidance of doubt storage is considered processing. For each separate organisation processing data which is not fully anonymous a separate partner organisation form must also be completed.\\n \\n Processing, in relation to information or data means obtaining, recording or holding the information or data or carrying out any operation or set of operations on the information or data, including—\\n a) organisation, adaptation or alteration of the information or data,\\n b) retrieval, consultation or use of the information or data,\\n c) disclosure of the information or data by transmission,\\n dissemination or otherwise making available, or\\n d) alignment, combination, blocking, erasure or destruction of the information or data.\\n\\nPlease use the file upload function if you're not able to add all organisations via the form.",
				navHeader: 'Storage and processing',
			},
			{
				questionSets: [
					{
						index: 1,
						questionSetId: 'safesettings-dataflow',
					},
				],
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				panelId: 'safesettings-dataflow',
				pageId: 'safesettings',
				panelHeader: '',
				navHeader: 'Dataflow',
			},
			{
				panelId: 'safeoutputs-outputsdisseminationplans',
				questionSets: [
					{
						index: 1,
						questionSetId: 'safeoutputs-outputsdisseminationplans',
					},
				],
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				pageId: 'safeoutputs',
				panelHeader:
					'Please include any plans for dissemination and publication of the data and results arising from your proposal. Please also specify any controls in place to minimise risks associated with publication. Dissemination can take place in a variety of ways and through many mechanisms, including through electronic media, print media or word of mouth.',
				navHeader: 'Outputs dissemination plans',
			},
			{
				panelId: 'safeoutputs-retention',
				questionPanelHeaderText: 'TODO: We need a description for this panel',
				questionSets: [
					{
						index: 1,
						questionSetId: 'safeoutputs-retention',
					},
				],
				navHeader: 'Retention',
				pageId: 'safeoutputs',
				panelHeader:
					'This section details how the project will treat data being processed after it has been used for the purpose of the proposal outlined, including governance in place to determine how long it will be retained, and controls to manage its subsequent disposal if required. Please reference any relevant policies and procedures which are in place to govern retention and disposal of data as outlined in the proposal.',
			},
		],
		questionSets: [
			{
				questions: [
					{
						guidance: 'Please insert your full name.',
						questionId: 'fullname-a218cf35b0847b14d5f6d565b01e2f8c',
						question: 'Full name',
						validations: [
							{
								message: 'Please enter a value',
								type: 'isLength',
								params: [1],
							},
						],
						input: {
							required: true,
							type: 'textInput',
						},
					},
					{
						guidance: 'Job Title is the name of the position the applicant holds within their organisation.',
						input: {
							required: true,
							type: 'textInput',
						},
						validations: [
							{
								message: 'Please enter a value',
								type: 'isLength',
								params: [1],
							},
						],
						question: 'Job title',
						questionId: 'jobtitle-6ddd85c18e8da4ac08f376073932128f',
					},
					{
						guidance: 'Please include a contact telephone number that the applicant can be contacted on.',
						questionId: 'telephone-7b9d3b160c86a77c842503904ffdf7e6',
						input: {
							type: 'textInput',
						},
						question: 'Telephone',
					},
					{
						questionId: 'orcid-7c5167922d97afe681f4b7c388b0a70a',
						input: {
							type: 'textInput',
						},
						question: 'ORCID',
						guidance:
							'ORCID provides a persistent digital identifier (an ORCID iD) that you own and control, and that distinguishes you from every other researcher. You can create an ORCID profile at  https://orcid.org/. If you have an ORCID iD please include it here. ',
					},
					{
						validations: [
							{
								params: [1],
								type: 'isLength',
								message: 'Please enter a value',
							},
							{
								type: 'isEmail',
							},
						],
						question: 'Email',
						input: {
							required: true,
							type: 'textInput',
						},
						questionId: 'email-7d977b9e170e992b5cb48d407304406d',
						guidance: 'Please include an email address that the applicant can receive communications through.',
					},
					{
						guidance: 'Please confirm whether the applicant will be accessing the data that is being requested.',
						question: 'Will you access the data requested?',
						input: {
							label: 'Will you access the data requested?',
							type: 'radioOptionsInput',
							options: [
								{
									text: 'Yes',
									value: 'yes',
								},
								{
									value: 'no',
									text: 'No',
								},
							],
						},
						questionId: 'willyouaccessthedatarequested-765aee4e52394857f7cb902bddeafe04',
					},
					{
						input: {
							type: 'radioOptionsInput',
							options: [
								{
									text: 'Yes',
									value: 'yes',
									conditionalQuestions: [
										{
											questionId: 'ifyespleaseprovideyouraccreditedresearchernumber-7a87ef841f884a7aad6f48252f9fc670',
											input: {
												type: 'textareaInput',
											},
											question: 'If yes, please provide your accredited researcher number.',
										},
									],
								},
								{
									conditionalQuestions: [
										{
											input: {
												type: 'textareaInput',
											},
											question: 'Please specify if you are planning to become an accredited researcher.',
											questionId: 'pleasespecifyifyouareplanningtobecomeanaccreditedresearcher-d93e3edff26a69fb961a28032719960c',
										},
									],
									text: 'No',
									value: 'no',
								},
							],
							label: 'Are you an accredited researcher under the Digital Economy Act 2017?',
						},
						question: 'Are you an accredited researcher under the Digital Economy Act 2017?',
						questionId: 'areyouanaccreditedresearcherunderthedigitaleconomyact2017-16c0422c22522e7e83dd0143242cbdda',
						guidance:
							'Depending on the type of data you are requesting, you might be required to become an accredited researcher. Most access to data in the Secure Research Service (SRS) will be by researchers accredited under the Digital Economy Act 2017 (DEA). \\n\\nThe UK Statistics Authority has published further information on the criteria to be met in a Research Code of Practice and Accreditation criteria. Researchers can apply for accreditation through the Research Accreditation Service (RAS).\\n\\nFull accredited researcher status is valid for five years. Provisional accredited researcher status is valid for one year.\\n\\nMore information here: https://www.gov.uk/government/publications/digital-economy-act-2017-part-5-codes-of-practice/research-code-of-practice-and-accreditation-criteria#section-b-accreditation-of-researchers-and-peer-reviewers',
					},
					{
						questionId:
							'haveyouundertakenprofessionaltrainingoreducationonthetopicofinformationgovernance-0ffaac7080cdb73e7a6c2fcdd979697d',
						question: 'Have you undertaken professional training or education on the topic of Information Governance?',
						input: {
							options: [
								{
									value: 'yes',
									text: 'Yes',
									conditionalQuestions: [
										{
											input: {
												type: 'textareaInput',
											},
											question: 'Please provide full details regarding the most recent training',
											questionId: 'pleaseprovidefulldetailsregardingthemostrecenttraining-437c573445144812c0268b624d94dd61',
											guidance:
												'Evidence of Information Governance training is an important aspect of most applications, giving assurance that individuals are aware of the privacy, confidentiality, data protection and Caldicott implications of working with personal data. \\n\\nPlease ensure you have checked with the data custodian if training is required for your application.',
										},
									],
								},
								{
									conditionalQuestions: [
										{
											guidance:
												'Evidence of Information Governance training is an important aspect of most applications, giving assurance that individuals are aware of the privacy, confidentiality, data protection and Caldicott implications of working with personal data. \\n\\nPlease ensure you have checked with the data custodian if training is required for your application.',
											input: {
												type: 'textareaInput',
											},
											question: 'Please provide any details of plans to attend training, if applicable',
											questionId: 'pleaseprovideanydetailsofplanstoattendtrainingifapplicable-8fc8a15b9aa5f6220e2904910a8827f2',
										},
									],
									text: 'No',
									value: 'no',
								},
							],
							type: 'radioOptionsInput',
							label: 'Have you undertaken professional training or education on the topic of Information Governance?',
						},
						guidance:
							'Evidence of Information Governance training is an important aspect of most applications, giving assurance that individuals are aware of the privacy, confidentiality, data protection and Caldicott implications of working with personal data. \\n\\nPlease ensure you have checked with the data custodian if training is required for your application.',
					},
					{
						guidance:
							'Please give the full name of the organisation on whose behalf you are making the application or within which you work in your professional capacity as an applicant. This should include a parent organisation, and sub-division or department if appropriate (for example University of Edinburgh, Department of Informatics).',
						questionId: 'yourorganisationname-e4afdb97925cc69c23c576fce197ef55',
						question: 'Your organisation name',
						validations: [
							{
								message: 'Please enter a value',
								type: 'isLength',
								params: [1],
							},
						],
						input: {
							required: true,
							type: 'textInput',
						},
					},
					{
						questionId:
							'doesyourorganisationhaveacurrentdatasecurityandprotectiontoolkitdsptpublishedassessment-0b6c42f4c32b2f347c1f6f20329ad486',
						question: 'Does your organisation have a current Data Security and Protection Toolkit (DSPT) published assessment?',
						validations: [
							{
								message: 'Please select an option',
								type: 'isLength',
								params: [1],
							},
							{
								type: 'isLength',
								params: [1],
								message: 'Please enter a value',
							},
						],
						input: {
							label: 'Does your organisation have a current Data Security and Protection Toolkit (DSPT) published assessment?',
							required: true,
							options: [
								{
									value: 'yes',
									text: 'Yes',
									conditionalQuestions: [
										{
											input: {
												type: 'textInput',
											},
											question: 'If yes, please provide the current status',
											questionId: 'ifyespleaseprovidethecurrentstatus-fa877511570f68283d658d9458f36867',
										},
										{
											validations: [
												{
													type: 'isCustomDate',
													format: 'dd/MM/yyyy',
												},
											],
											question: 'If yes, please provide the date published',
											input: {
												type: 'datePickerCustom',
											},
											questionId: 'ifyespleaseprovidethedatepublished',
										},
									],
								},
								{
									text: 'No',
									value: 'no',
								},
							],
							type: 'radioOptionsInput',
						},
						guidance:
							'The Data Security and Protection Toolkit (DSPT) is an online self-assessment tool that allows organisations to measure their performance against the National Data Guardian’s 10 data security standards.\\n\\nAll organisations that have access to NHS patient data and systems must use the DSPT to provide assurance that they are practising good data security and that personal information is handled correctly.\\n\\nThe DSPT is an annual assessment.\\n\\nYou can find out the status of your organisation here https://www.dsptoolkit.nhs.uk/OrganisationSearch',
					},
					{
						questionId: 'willyourorganisationactasdatacontroller-1caf3bd728742c4b7ff66633ab23b0d6',
						input: {
							label: 'Will your organisation act as data controller?',
							type: 'radioOptionsInput',
							options: [
								{
									conditionalQuestions: [
										{
											questionId: 'icoregisterednumber-6f3e1d2b5b613a9fb0a4823754a921b3',
											question: 'ICO registered number',
											input: {
												type: 'textInput',
											},
										},
										{
											guidance: "Please include the organisation's business address.",
											questionId: 'registeredaddressline1-cabcaab378687adbcc1b7042e8f4db9c',
											input: {
												type: 'textInput',
											},
											question: 'Registered address (line 1)',
										},
										{
											guidance: "Please include the organisation's business address.",
											question: 'Registered address (line 2)',
											input: {
												type: 'textInput',
											},
											questionId: 'registeredaddressline2-6d779c3a667c3f026c668bf01c857fbe',
										},
										{
											questionId: 'city-8b14019051e5eb5b527d50705fe83299',
											input: {
												type: 'textInput',
											},
											question: 'City',
											guidance: 'Please specify the city where the organisation is located',
										},
										{
											guidance: "Please include the organisation's business address postcode",
											question: 'Postcode',
											input: {
												type: 'textInput',
											},
											questionId: 'postcode-65a92b863281a9ef883108ad6a2d96c6',
										},
										{
											input: {
												type: 'textInput',
											},
											question: 'Country',
											questionId: 'country-f424a05d6890c1bfdb770e0c840359f7',
											guidance: 'Please specify the country where the organisation is located.',
										},
										{
											question: 'Organisation type',
											input: {
												options: [
													{
														text: 'Academic institution',
														value: 'academicinstitution',
													},
													{
														text: 'National body',
														value: 'nationalbody',
													},
													{
														text: 'Healthcare provider',
														value: 'healthcareprovider',
													},
													{
														value: 'healthcarecomissioner',
														text: 'Healthcare comissioner',
													},
													{
														value: 'commercialbody',
														text: 'Commercial body',
													},
													{
														value: 'localauthority',
														text: 'Local Authority',
													},
													{
														value: 'other',
														text: 'Other',
													},
												],
												type: 'checkboxOptionsInput',
											},
											questionId: 'organisationtype-c34f26803e2083c3108c4b6bb967bab4',
											guidance: 'Please select type of organisation, unique purpose or role of the organisation.',
											label: 'Organisation type',
										},
										{
											guidance:
												'If your organisation is a data controller please details whether it is the sole data controller or joint data controller with other organisations.',
											questionId: 'pleaseprovidedetails-bd518a29d7e4cdae3e11f40e109a93f1',
											input: {
												type: 'textareaInput',
											},
											question: 'Please provide details',
										},
									],
									value: 'yes',
									text: 'Yes',
								},
								{
									text: 'No',
									value: 'no',
								},
								{
									text: 'Unsure',
									value: 'unsure',
								},
							],
						},
						question: 'Will your organisation act as data controller?',
						guidance:
							'Please specify if your organisation will act as a data controller. If your organisation is not the sole data controller, please provide details of other data controllers. ',
					},
				],
				questionSetHeader: 'Applicant',
				questionSetId: 'applicant',
			},
			{
				questionSetId: 'safepeople-otherindividuals',
				questions: [
					{
						guidance: "Full name is the individual's first and last name",
						question: 'Full name',
						input: {
							type: 'textInput',
						},
						questionId: 'fullname-892140ec730145dc5a28b8fe139c2876',
					},
					{
						guidance: 'Job Title is the name of the position the individual holds within their organisation.',
						questionId: 'jobtitle-ff1d692a04b4bb9a2babe9093339136f',
						input: {
							type: 'textInput',
						},
						question: 'Job title',
					},
					{
						input: {
							type: 'textInput',
						},
						question: 'Organisation',
						questionId: 'organisation-65c06905b8319ffa29919732a197d581',
						guidance: "Please include the individual's organisation.",
					},
					{
						question: 'Role',
						input: {
							label: 'Role',
							type: 'checkboxOptionsInput',
							options: [
								{
									value: 'principalinvestigator',
									text: 'Principal investigator',
								},
								{
									text: 'Collaborator',
									value: 'collaborator',
								},
								{
									value: 'teammember',
									text: 'Team member',
								},
								{
									value: 'other',
									text: 'Other',
									conditionalQuestions: [
										{
											questionId: 'ifotherpleasespecify-fa9e063fd5f253ae6dc76080db560bcc',
											question: 'If other, please specify',
											input: {
												type: 'textareaInput',
											},
										},
									],
								},
							],
						},
						questionId: 'role-22ddd99eee5c9dbc3175df5e0369082b',
						guidance:
							'A role is a function that the applicant plays. It might include role types and accreditation for those that are accessing the secure data and those that are not but would see cleared outputs from the project. \\r\\n (i.e. project lead, deputy lead, accrediter, researcher, peer reviewer)',
					},
					{
						guidance: 'Please confirm whether this person will be accessing the data that is being requested.',
						input: {
							options: [
								{
									value: 'yes',
									text: 'Yes',
								},
								{
									value: 'no',
									text: 'No',
								},
							],
							type: 'radioOptionsInput',
							label: 'Will this person access the data requested?',
						},
						question: 'Will this person access the data requested?',
						questionId: 'willthispersonaccessthedatarequested-20cba67ec4242f64c6f1f975af332b48',
					},
					{
						questionId: 'isthispersonanaccreditedresearcherunderthedigitaleconomyact2017-fab5a4a0cafd2f8889a40b942d7fc6c0',
						question: 'Is this person an accredited researcher under the Digital Economy Act 2017?',
						input: {
							label: 'Is this person an accredited researcher under the Digital Economy Act 2017?',
							options: [
								{
									value: 'yes',
									text: 'Yes',
									conditionalQuestions: [
										{
											input: {
												type: 'textareaInput',
											},
											question: 'If yes, please provide details',
											questionId: 'ifyespleaseprovidedetails-8e5c491c36c07ba9a5a1a15569ba9127',
										},
									],
								},
								{
									text: 'No',
									value: 'no',
								},
							],
							type: 'radioOptionsInput',
						},
						guidance: 'Please confirm whether this person is an accredited researcher under the Digital Economy Act 2017.',
					},
					{
						input: {
							label: 'Has this person undertaken professional training or education on the topic of Information Governance?',
							type: 'radioOptionsInput',
							options: [
								{
									conditionalQuestions: [
										{
											questionId: 'pleaseprovidefulldetailsregardingthemostrecenttraining-0389fbcb937c035b4b99939e6057f6b1',
											question: 'Please provide full details regarding the most recent training',
											input: {
												type: 'textareaInput',
											},
										},
									],
									text: 'Yes',
									value: 'yes',
								},
								{
									conditionalQuestions: [
										{
											question: 'Please provide any details of plans to attend training, if applicable',
											input: {
												type: 'textareaInput',
											},
											questionId: 'pleaseprovideanydetailsofplanstoattendtrainingifapplicable-d7904ad9d3975890f74466dfd9e03249',
										},
									],
									value: 'no',
									text: 'No',
								},
							],
						},
						question: 'Has this person undertaken professional training or education on the topic of Information Governance?',
						questionId:
							'hasthispersonundertakenprofessionaltrainingoreducationonthetopicofinformationgovernance-eb6cc4e210247305a5f8d49a7f9725dd',
						guidance:
							'Please confirm whether this person has undertaken professional training or education on the topic of Information Governance.',
					},
				],
				questionSetHeader: 'Other individuals',
			},
			{
				questionSetId: 'safeproject-aboutthisapplication',
				questionSetHeader: 'About this application',
				questions: [
					{
						questionId: 'thisapplicationis-41ad7589e5f28c20d0714799174cfb54',
						question: 'This application is...',
						input: {
							options: [
								{
									value: 'anewapplication',
									text: 'A new application',
								},
								{
									text: 'An amendment to an existing application',
									value: 'anamendmenttoanexistingapplication',
									conditionalQuestions: [
										{
											input: {
												type: 'textareaInput',
											},
											question: 'Reference or details of previous application',
											questionId: 'referenceordetailsofpreviousapplication-9566d8b4523d9357623c0dc13750dca4',
										},
									],
								},
								{
									conditionalQuestions: [
										{
											question: 'Reference or details of previous application',
											input: {
												type: 'textareaInput',
											},
											questionId: 'referenceordetailsofpreviousapplication-68ecab62047e082c600be559026b765d',
										},
									],
									value: 'anextensionofanexistingapproval',
									text: 'An extension of an existing approval',
								},
								{
									conditionalQuestions: [
										{
											question: 'Reference or details of previous application',
											input: {
												type: 'textareaInput',
											},
											questionId: 'referenceordetailsofpreviousapplication-fc163f4f2ca56168ad26b467969ef3ab',
										},
									],
									value: 'arenewalofanexistingapproval',
									text: 'A renewal of an existing approval',
								},
								{
									conditionalQuestions: [
										{
											questionId: 'referenceordetailsofpreviousapplication-d027df857d58f165a9be86c20ab2a6b4',
											question: 'Reference or details of previous application',
											input: {
												type: 'textareaInput',
											},
										},
									],
									text: 'Related to a previous application (approved or not)',
									value: 'relatedtoapreviousapplicationapprovedornot',
								},
							],
							type: 'radioOptionsInput',
							label: 'This application is...',
						},
						guidance:
							'The application could be a new application, an extension, a renewal or amendment. For extensions or amendments, you must highlight the specific information within this form that has been updated, provide an original application number and approval date, any subsequent amendment approval dates and a summary of changes and rationale for the change to your original application and and updated approvals signatures in order for the request to be processed..',
					},
				],
			},
			{
				questionSetId: 'safeproject-projectdetails',
				questions: [
					{
						guidance:
							'The title should identify the main area of your research so that another researcher could understand if it might be relevant to their area of study. \\n \\nThe titles of all Accredited Research projects are published on the UK Statistics Authority website as part of the public record of DEA Accredited Researchers.',
						questionId: 'titleofproject-d1871bb2722198a540054857521fdc0b',
						question: 'Title of project',
						validations: [
							{
								type: 'isLength',
								params: [3, 300],
							},
						],
						input: {
							required: true,
							type: 'textInput',
						},
					},
					{
						questionId: 'whatisthetypeofproject-f177460d399000fa2f5cca4540bd4754',
						input: {
							options: [
								{
									value: 'research',
									text: 'Research',
								},
								{
									value: 'clinicaudit',
									text: 'Clinic audit',
								},
								{
									text: 'Service evaluation',
									value: 'serviceevaluation',
								},
								{
									conditionalQuestions: [
										{
											questionId: 'ifotherpleasespecify-453820818cc5378e47db48b940dd206a',
											input: {
												type: 'textInput',
											},
											question: 'If other, please specify',
										},
									],
									text: 'Other',
									value: 'other',
								},
							],
							type: 'radioOptionsInput',
							required: true,
							label: 'What is the type of project?',
						},
						question: 'What is the type of project?',
						validations: [
							{
								message: 'Please select an option',
								params: [1],
								type: 'isLength',
							},
						],
						guidance:
							'A research project is a discrete scientific endeavor to answer a research question or a set of research questions. \\n\\nA clinic audit project is designed and conducted to produce information to inform delivery of best care. It aims to find out if healthcare is being provided in line with standards to inform care providers and patients about where a service is doing well, and where there could be improvements.\\n\\nA service evaluation project is designed and conducted solely to define or judge current care. It seeks to assess current service to assess how well a service is achieving its intended aims.',
					},
					{
						questionId: 'isthisanewstudyorsupportinganexistingstudy-fd29fdb85107f798615a6a7d94a63212',
						input: {
							label: 'Is this a new study or supporting an existing study?',
							type: 'radioOptionsInput',
							options: [
								{
									text: 'New study',
									value: 'newstudy',
								},
								{
									value: 'existingstudy',
									text: 'Existing study',
									conditionalQuestions: [
										{
											question: 'Evidence of existing outputs',
											input: {
												options: [
													{
														text: 'I have enclosed evidence of existing outputs',
														value: 'ihaveenclosedevidenceofexistingoutputs',
													},
												],
												type: 'checkboxOptionsInput',
											},
											questionId: 'evidenceofexistingoutputs-cb279f6601396c68f41f98d81948fd69',
											label: 'Evidence of existing outputs',
										},
									],
								},
							],
						},
						question: 'Is this a new study or supporting an existing study?',
					},
					{
						question: 'Please provide a lay summary of the project (300 words)',
						validations: [
							{
								type: 'isLength',
								params: [10, 2000],
							},
						],
						input: {
							required: true,
							type: 'textareaInput',
						},
						questionId: 'pleaseprovidealaysummaryoftheproject300words-18d6084cf053be12331aa7c4463012e8',
						guidance:
							'Please provide a summary of the study in language suitable for non-experts in the field and ensure that all abbreviations in technical terminology are explained.\\n  \\nThe summary must make clear what the specific purpose is, who will be using the data (organisations rather than individual names), what will happen to the data, whether the expected outputs are in record level form, what is known to date about your chosen project including any preliminary/related analysis and background literature reviews. Please include any potential disclosure risks and how these will be addressed.',
					},
					{
						guidance:
							'This is required to allow us to know when and for how long the data will be required. If the project has already begun but this data is only required for a future element use the date from when it will be required here.',
						questionId: 'What is the anticipated start date of the project?',
						question: 'What is the anticipated start date of the project?',
						validations: [
							{
								format: 'dd/MM/yyyy',
								type: 'isCustomDate',
							},
						],
						input: {
							type: 'datePickerCustom',
						},
					},
					{
						questionId: 'Please provide anticipated end date of the project?',
						input: {
							type: 'datePickerCustom',
						},
						question: 'Please provide anticipated end date of the project?',
						validations: [
							{
								type: 'isCustomDate',
								format: 'dd/MM/yyyy',
							},
						],
					},
					{
						questionId: 'whataretheprojectaimsobjectivesandrationale-215c3780393fadf7584659eab0e834fc',
						input: {
							required: true,
							type: 'textareaInput',
						},
						question: 'What are the project aims, objectives and rationale?',
						validations: [
							{
								params: [1],
								type: 'isLength',
								message: 'Please enter a value',
							},
						],
						guidance:
							'Please Include the background to the project by describing why you are conducting the study, the specific aims and the hypotheses that you hope to test. Summarise how the data requested are required to help address these aims. Please include whether the project has used peer review and if applicable the nature of that review.  ',
					},
					{
						guidance:
							'Provide full details of your research methodology. This must include justification of sample size, analyses proposed, statistical methods, additional data sources such as linked data and any plans for collaborative work. \\n\\nThis information will be key to assessing whether your proposal will be feasible, deliver clear public good and be an appropriate use of data. \\n\\nEnsure you: \\n\\nSpecify the method(s) of analysis you plan to use (such as regression);\\n\\nAs far as possible, try to articulate the outcome or dependent variable(s). \\n\\nIndicate the starting point for the modelling process - acknowledging that the model may evolve.\\n\\nExplain (where relevant) how any potential selection/causal bias will be addressed (e.g. by including a control group with information on how this control group will be created); \\n\\nProvide methodology references, if a non-standard methodology is proposed;\\n\\nInclude information about any contribution to the field of research methodology that you believe may result from your research;\\n\\nInclude an explanation of how your methodological approach will answer the research question(s) set out in the project when employing methods not covered by any of the above (e.g. correlation or basic descriptive analysis will only be used, noting that such analysis might be more applicable for exploratory research).',
						questionId: 'howwillthedatarequestedbeusedtoachievetheprojectobjectives-66b542d3041790be46cbd0093a1c0157',
						validations: [
							{
								params: [1],
								type: 'isLength',
								message: 'Please enter a value',
							},
						],
						question: 'How will the data requested be used to achieve the project objectives?',
						input: {
							type: 'textareaInput',
							required: true,
						},
					},
					{
						guidance:
							'Use these section to give the background and justification of your proposal, to demonstrate how your project will benefit the public, as well as show your understanding of the Information Governance issues specific and inherent to your project. Please make it clear how the data requested will contribute. \\n\\nPlease also show that you have considered how to balance the privacy risks and public benefits when designing the study.  The requirement for the datasets requested should be fully justified in the light of the aims and objectives of the proposal.',
						input: {
							required: true,
							type: 'textareaInput',
						},
						validations: [
							{
								params: [1],
								type: 'isLength',
								message: 'Please enter a value',
							},
						],
						question: 'How will your project benefit the public and what is the anticipated impact?',
						questionId: 'howwillyourprojectbenefitthepublicandwhatistheanticipatedimpact-cbde5d9d5237f8309c3238af111a1f9e',
					},
					{
						guidance:
							'Provide full details of proposed public engagement plans for patient and/or user group involvement. If you have no plans, please elaborate why there will not be public engagement.',
						questionId:
							'canyouprovideanoutlineofthepublicandpatientinvolvementandengagementppiestrategiesofthestudyorabriefexplanationofwhytheyarenotplanned-31372d627ddf8fc499dbc3b833a79abf',
						question:
							'Can you provide an outline of the public and patient involvement and engagement (PPIE*) strategies of the study or a brief explanation of why they are not planned?',
						input: {
							type: 'textareaInput',
						},
					},
				],
				questionSetHeader: 'Project details',
			},
			{
				questionSetId: 'safeproject-funderinformation',
				questions: [
					{
						guidance: 'Please confirm if your project has a funder.',
						questionId: 'doesyourprojecthaveafunder-5f2de3ab7973f34fc94979b3604f9835',
						input: {
							required: true,
							label: 'Does your project have a funder?',
							options: [
								{
									value: 'yes',
									text: 'Yes',
									conditionalQuestions: [
										{
											questionId: 'ifyespleaseprovidetheorganisationname-6b6d945420c4064bfcc00100f1f964ce',
											question: 'If yes, please provide the organisation name',
											input: {
												type: 'textInput',
											},
											guidance: 'Please confirm funder organisation name.',
										},
										{
											questionId: 'addFunderDetails',
											input: {
												type: 'buttonInput',
												action: 'addRepeatableQuestions',
												questionIds: ['ifyespleaseprovidetheorganisationname-6b6d945420c4064bfcc00100f1f964ce'],
												text: '+ Add another organisation',
												class: 'btn btn-primary addButton',
												separatorText: 'Additional organisation details',
											},
											guidance:
												"If there are other orgnisations to be specified as part of this application, click 'Add another organisation' as required.",
										},
									],
								},
								{
									conditionalQuestions: [
										{
											question: 'If no, please provide details of how you intend to fund the study',
											input: {
												type: 'textareaInput',
											},
											questionId: 'ifnopleaseprovidedetailsofhowyouintendtofundthestudy-69b1e8d4a8eabfd64ec006d711377095',
										},
										{
											questionId: 'pleaseprovideevidenceofindependentpeerreview-7285fe5f3380956072993c4d44fa99a9',
											input: {
												options: [
													{
														text: 'I confirm I have provided evidence of independent peer review.',
														value: 'iconfirmihaveprovidedevidenceofindependentpeerreview',
													},
												],
												type: 'checkboxOptionsInput',
											},
											question: 'Please provide evidence of independent peer review',
											label: 'Please provide evidence of independent peer review',
										},
									],
									text: 'No',
									value: 'no',
								},
							],
							type: 'radioOptionsInput',
						},
						question: 'Does your project have a funder?',
						validations: [
							{
								params: [1],
								type: 'isLength',
								message: 'Please select an option',
							},
						],
					},
				],
				questionSetHeader: 'Funder information',
			},
			{
				questionSetHeader: 'Sponsor information',
				questions: [
					{
						questionId: 'doesyourprojecthaveasponsor-6222cfdc0db4de7b26ed18cb8ff2de1f',
						input: {
							required: true,
							label: 'Does your project have a sponsor?',
							options: [
								{
									value: 'yes',
									text: 'Yes',
									conditionalQuestions: [
										{
											guidance: 'Please provide legal name; to appear on legal documents.',
											input: {
												type: 'textInput',
											},
											question: 'Organisation name',
											questionId: 'organisationname-e798ec22cc019a90c667d0879434d746',
										},
										{
											questionId: 'registeredaddressline1-768e71b8a621031ff767738336404c75',
											input: {
												type: 'textInput',
											},
											question: 'Registered address (line 1)',
											guidance: 'Please confirm sponsor organisation address.',
										},
										{
											guidance: 'Please confirm sponsor organisation address.',
											input: {
												type: 'textInput',
											},
											question: 'Registered address (line 2)',
											questionId: 'registeredaddressline2-ad9cde7d35d303607780655af5d6fe1d',
										},
										{
											guidance: 'Please confirm sponsor organisation city.',
											question: 'City',
											input: {
												type: 'textInput',
											},
											questionId: 'city-d1d39f3ce1e8680603b6bd46bbbd2fa5',
										},
										{
											question: 'Postcode',
											input: {
												type: 'textInput',
											},
											questionId: 'postcode-9fff28c663f524a18fc57d07d49142b6',
											guidance: 'Please confirm sponsor organisation postcode.',
										},
										{
											guidance: "Please confirm sponsor organisation's country.",
											questionId: 'country-7da3f75bb002e9f444282fe6eba9bfa2',
											question: 'Country',
											input: {
												type: 'textInput',
											},
										},
										{
											questionId: 'sector-1e0611964625066c52da1ff3dfb5c5e9',
											question: 'Sector',
											input: {
												type: 'textInput',
											},
											guidance: "Please provide details of the sponsor's sector e.g. NHS, Academia, Charity, Industry.",
										},
										{
											guidance: 'Please specify the size of the organisation (small, medium, large).',
											questionId: 'size-fb6e4688e5e99e365c5299baff249239',
											input: {
												type: 'textInput',
											},
											question: 'Size',
										},
										{
											guidance: 'Please provide additional details, if applicable.',
											input: {
												type: 'textInput',
											},
											question: 'Additional details',
											questionId: 'additionaldetails-0c91e78a36ebf985fc0be9a420e58d14',
										},
										{
											questionId: 'contactemailaddress-9dffde669046f6c2225eda75786ce5ca',
											input: {
												type: 'textInput',
											},
											question: 'Contact email address',
											guidance: 'Please provide a contact email address for the sponsor organisation',
										},
										{
											questionId: 'addSponsorDetails',
											input: {
												type: 'buttonInput',
												action: 'addRepeatableQuestions',
												questionIds: [
													'organisationname-e798ec22cc019a90c667d0879434d746',
													'registeredaddressline1-768e71b8a621031ff767738336404c75',
													'registeredaddressline2-ad9cde7d35d303607780655af5d6fe1d',
													'city-d1d39f3ce1e8680603b6bd46bbbd2fa5',
													'postcode-9fff28c663f524a18fc57d07d49142b6',
													'country-7da3f75bb002e9f444282fe6eba9bfa2',
													'sector-1e0611964625066c52da1ff3dfb5c5e9',
													'size-fb6e4688e5e99e365c5299baff249239',
													'additionaldetails-0c91e78a36ebf985fc0be9a420e58d14',
													'contactemailaddress-9dffde669046f6c2225eda75786ce5ca',
												],
												text: '+ Add another sponsor',
												class: 'btn btn-primary addButton',
												separatorText: 'Additional sponsor details',
											},
											guidance:
												"If there are other sponsors to be specified as part of this application, click 'Add another sponsor' as required.",
										},
									],
								},
								{
									value: 'no',
									text: 'No',
								},
							],
							type: 'radioOptionsInput',
						},
						question: 'Does your project have a sponsor?',
						validations: [
							{
								params: [1],
								type: 'isLength',
								message: 'Please select an option',
							},
						],
						guidance: 'Please confirm if your project has a sponsor.',
					},
				],
				questionSetId: 'safeproject-sponsorinformation',
			},
			{
				questionSetHeader: 'Declaration of interest',
				questions: [
					{
						guidance: 'Please indicate if there is any commercial aspect or dimension to the project or its outcomes.',
						questionId: 'isthereacommercialinterestinthisproject-aeca9152dcaa8f68b5dd1d81456093bf',
						validations: [
							{
								message: 'Please select an option',
								type: 'isLength',
								params: [1],
							},
						],
						question: 'Is there a commercial interest in this project?',
						input: {
							type: 'radioOptionsInput',
							options: [
								{
									text: 'Yes',
									value: 'yes',
									conditionalQuestions: [
										{
											input: {
												type: 'textInput',
											},
											question: 'Organisation name',
											questionId: 'organisationname-580cfbc664ccadc36159bb1c9f6c52ca',
											guidance: 'Please confirm organisation name.',
										},
										{
											guidance: 'Please confirm organisation address.',
											questionId: 'registeredaddressline1-30c1a89c33f1dd35421730c16b6a4a47',
											input: {
												type: 'textInput',
											},
											question: 'Registered address (line 1)',
										},
										{
											questionId: 'registeredaddressline2-7fc23fb3bb766f3ca9cb007ab0a1571e',
											input: {
												type: 'textInput',
											},
											question: 'Registered address (line 2)',
										},
										{
											questionId: 'postcode-e5c2e97319d3412ec904227dabf06605',
											input: {
												type: 'textInput',
											},
											question: 'Postcode',
											guidance: 'Please confirm organisation postcode.',
										},
										{
											question: 'City',
											input: {
												type: 'textInput',
											},
											questionId: 'city-47356a357f172612cffdd4082dc6f705',
											guidance: 'Please confirm organisation city.',
										},
										{
											guidance: 'Please confirm organisation country.',
											question: 'Country',
											input: {
												type: 'textInput',
											},
											questionId: 'country-42d004957eba55e8f5e3c1408c5874e6',
										},
										{
											input: {
												type: 'textareaInput',
											},
											question: 'Describe the nature of interest',
											questionId: 'describethenatureofinterest-006fb10a759eb7caaba1d8c6f1797478',
										},
										{
											questionId: 'publicinterest-b7bebe7b9ed48dd6aee5e13c1dfa0220',
											input: {
												options: [
													{
														value: 'iconfirmthatanycommercialinterestispublicinterestrelated',
														text: 'I confirm that any commercial interest is public interest related.',
													},
												],
												type: 'checkboxOptionsInput',
											},
											question: 'Public interest',
											label: 'Public interest',
										},
										{
											questionId: 'addDeclarationOfInterestDetails',
											input: {
												type: 'buttonInput',
												action: 'addRepeatableQuestions',
												questionIds: [
													'organisationname-580cfbc664ccadc36159bb1c9f6c52ca',
													'registeredaddressline1-30c1a89c33f1dd35421730c16b6a4a47',
													'registeredaddressline2-7fc23fb3bb766f3ca9cb007ab0a1571e',
													'postcode-e5c2e97319d3412ec904227dabf06605',
													'city-47356a357f172612cffdd4082dc6f705',
													'country-42d004957eba55e8f5e3c1408c5874e6',
													'describethenatureofinterest-006fb10a759eb7caaba1d8c6f1797478',
													'publicinterest-b7bebe7b9ed48dd6aee5e13c1dfa0220',
												],
												text: '+ Add another organisation',
												class: 'btn btn-primary addButton',
												separatorText: 'Additional organisation details',
											},
											guidance:
												"If there are other orgnisations to be specified as part of this application, click 'Add another organisation' as required.",
										},
									],
								},
								{
									text: 'No',
									value: 'no',
								},
							],
							label: 'Is there a commercial interest in this project?',
							required: true,
						},
					},
				],
				questionSetId: 'safeproject-declarationofinterest',
			},
			{
				questionSetId: 'safeproject-intellectualproperty',
				questions: [
					{
						guidance:
							'Intellectual Property is the tangible output of any intellectual activity that is new or previously undescribed. It has an owner; it can be bought, sold or licensed and must be adequately protected.  It can include inventions, industrial processes, software, data, written work, designs and images. \\nAny research which could potentially lead to intellectual property rights for you or your employer should be discussed with your employer and your R&D office as early as possible in the planning of the research.\\n',
						questionId:
							'pleaseindicateiftheresearchcouldleadtothedevelopmentofanewproductprocessorthegenerationofintellectualproperty-4bd0161d3097f24464f6a4cf8b8a0b0e',
						question:
							'Please indicate if the research could lead to the development of a new product/process or the generation of intellectual property.',
						input: {
							type: 'textareaInput',
						},
					},
				],
				questionSetHeader: 'Intellectual property',
			},
			{
				questionSetId: 'safedata-datafields',
				questions: [
					{
						input: {
							type: 'textareaInput',
						},
						question:
							'Please indicate the data necessary to conduct the study, the data fields required and the justifications for each field.',
						questionId:
							'pleaseindicatethedatanecessarytoconductthestudythedatafieldsrequiredandthejustificationsforeachfield-b3e68aa6ffddc36c1919be39b09049ef',
						guidance:
							'NHS Digital will require information about each dataset that you would like to have access to including and field names and justifications for each field.\\n\\nPlease contact NHS Digital to find out which data items are available within your selected datasets.\\n\\nYou can submit your application initially without the data items listed and NHS Digital will contact you to discuss the specific data items you require as part of the continued application process.',
					},
					{
						question: 'Data fields indicated via file upload',
						input: {
							options: [
								{
									value: 'iconfirmthatihaveenclosedalistofdatasetsfieldsandvariablesrequiredforthestudyaswellasjustificationforeachfield',
									text:
										'I confirm that I have enclosed a list of datasets, fields and variables required for the study as well as justification for each field.',
								},
							],
							type: 'checkboxOptionsInput',
							label: 'Data fields indicated via file upload',
						},
						questionId: 'datafieldsindicatedviafileupload-0b02aa93afe7ba3a34d4fcffea9106fd',
						guidance:
							'A description of precisely the criteria which define the patients to be included and to be excluded from the data extract you are requesting should be provided. \\n\\nThis should include precise date parameters for the start and end of the range requested (dd/mm/yy) and explain which dated project field will be used to define the requested cohort (e.g. date of admission or date of operation).',
					},
					{
						questionId: 'inclusionandexclusioncriteriaincludingdateparameters-481e42b8bdf56c82c14f3cb38d3facb4',
						validations: [
							{
								type: 'isLength',
								params: [1],
								message: 'Please enter a value',
							},
						],
						question: 'Inclusion and exclusion criteria (including date parameters)',
						input: {
							type: 'textareaInput',
							required: true,
						},
						guidance:
							'A description of precisely the criteria which define the patients to be included and to be excluded from the data extract you are requesting should be provided. \\n\\nThis should include precise date parameters for the start and end of the range requested (dd/mm/yy) and explain which dated project field will be used to define the requested cohort (e.g. date of admission or date of operation).',
					},
					{
						questionId: 'willyourequireperiodicrefreshesofthedata-66b38ed7294bb5e1fb54e269987a6ee4',
						question: 'Will you require periodic refreshes of the data?',
						validations: [
							{
								message: 'Please select an option',
								params: [1],
								type: 'isLength',
							},
						],
						input: {
							label: 'Will you require periodic refreshes of the data?',
							required: true,
							options: [
								{
									conditionalQuestions: [
										{
											questionId: 'howoftenwillthedatarefreshesbeneeded-4c7982108251204fcf91838c189a8dd6',
											question: 'How often will the data refreshes be needed?',
											input: {
												label: 'How often will the data refreshes be needed?',
												options: [
													{
														text: 'Every month',
														value: 'everymonth',
													},
													{
														text: 'Every 3 months',
														value: 'every3months',
													},
													{
														text: 'Every 6 months',
														value: 'every6months',
													},
													{
														text: 'Every 12 months',
														value: 'every12months',
													},
													{
														value: 'other',
														text: 'Other',
														conditionalQuestions: [
															{
																input: {
																	type: 'textInput',
																},
																question: 'If other, please specify',
																questionId: 'ifotherpleasespecify-faac222bc9033318dceb5ba458b1ab5e',
															},
														],
													},
												],
												type: 'radioOptionsInput',
											},
											guidance: 'Please indicate how often data refreshes will be needed. ',
										},
									],
									text: 'Yes',
									value: 'yes',
								},
								{
									value: 'no',
									text: 'No',
								},
							],
							type: 'radioOptionsInput',
						},
						guidance: 'Please indicate if data refreshers will be required.',
					},
					{
						question: 'Do you require aggregated or record level data?',
						input: {
							type: 'textareaInput',
						},
						questionId: 'doyourequireaggregatedorrecordleveldata-2d17aa88363da07c028b8bae68f04e9e',
						guidance:
							"Record level data typically relates to a single individual. There may be one or many records per individual. Such data would usually carry a risk of re-identification, and use of such data would be subject to strict controls.\\n\\nAggregate data would typically be 'counts' of an event - for example how many people had a particular operation over a specific time period. Aggregate data is not always anonymous data, and therefore may also be subject to specific controls.\\n\\n\\n\\n",
					},
				],
				questionSetHeader: 'Data fields',
			},
			{
				questionSetId: 'safedata-otherdatasetsintentiontolinkdata',
				questionSetHeader: 'Other datasets - Intention to link data',
				questions: [
					{
						guidance:
							'Please specify if you intend for the datasets to be linked with any additional datasets. Please also provide relevant information on the organisations undertaking linkages and provide a data flow diagram where applicable.',
						questionId:
							'doyouintendforthedatasetsrequestedtobelinkedwithanyadditionaldatasetsotherthanthedatasetslistedinthisapplication-9015996e05b57f8588ffdb9306cd6140',
						input: {
							required: true,
							label:
								'Do you intend for the datasets requested to be linked with any additional datasets, other than the datasets listed in this application?',
							type: 'radioOptionsInput',
							options: [
								{
									conditionalQuestions: [
										{
											questionId:
												'specifyalldatasetsorganisationswhichwillperformthelinkageandhowthelinkagewilltakeplace-ca84d4e177000cbf6269ba17e816061a',
											question: 'Specify all datasets, organisations which will perform the linkage and how the linkage will take place.',
											input: {
												type: 'textareaInput',
											},
											guidance: 'Please include details of the organisations undertaking the process of linkage.',
										},
									],
									value: 'yes',
									text: 'Yes',
								},
								{
									text: 'No',
									value: 'no',
								},
							],
						},
						question:
							'Do you intend for the datasets requested to be linked with any additional datasets, other than the datasets listed in this application?',
						validations: [
							{
								type: 'isLength',
								params: [1],
								message: 'Please select an option',
							},
						],
					},
				],
			},
			{
				questionSetId: 'safedata-lawfulbasis',
				questionSetHeader: 'Lawful basis',
				questions: [
					{
						guidance:
							'The lawful bases for processing are set out in Article 6 of the GDPR. At least one of legal basis must apply whenever you process personal data. Please select appropriate Article 6 lawful basis. Processing shall be lawful only if and to the extent that at least one of the following applies.',
						questionId: 'article6lawfulbasis-7d69315e9144498ac04a342d15b86102',
						input: {
							required: true,
							label: 'Article 6 lawful basis',
							type: 'radioOptionsInput',
							options: [
								{
									text: 'Not applicable',
									value: 'notapplicable',
								},
								{
									text:
										'(a) the data subject has given consent to the processing of his or her personal data for one or more specific purposes;',
									value: 'athedatasubjecthasgivenconsenttotheprocessingofhisorherpersonaldataforoneormorespecificpurposes',
								},
								{
									value:
										'bprocessingisnecessaryfortheperformanceofacontracttowhichthedatasubjectispartyorinordertotakestepsattherequestofthedatasubjectpriortoenteringintoacontract',
									text:
										'(b) processing is necessary for the performance of a contract to which the data subject is party or in order to take steps at the request of the data subject prior to entering into a contract;',
								},
								{
									text: '(c) processing is necessary for compliance with a legal obligation to which the controller is subject;',
									value: 'cprocessingisnecessaryforcompliancewithalegalobligationtowhichthecontrollerissubject',
								},
								{
									value: 'dprocessingisnecessaryinordertoprotectthevitalinterestsofthedatasubjectorofanothernaturalperson',
									text:
										'(d) processing is necessary in order to protect the vital interests of the data subject or of another natural person;',
								},
								{
									value:
										'eprocessingisnecessaryfortheperformanceofataskcarriedoutinthepublicinterestorintheexerciseofofficialauthorityvestedinthecontroller',
									text:
										'(e) processing is necessary for the performance of a task carried out in the public interest or in the exercise of official authority vested in the controller;',
								},
								{
									value:
										'fprocessingisnecessaryforthepurposesofthelegitimateinterestspursuedbythecontrollerorbyathirdpartyexceptwheresuchinterestsareoverriddenbytheinterestsorfundamentalrightsandfreedomsofthedatasubjectwhichrequireprotectionofpersonaldatainparticularwherethedatasubjectisachild',
									text:
										'(f) processing is necessary for the purposes of the legitimate interests pursued by the controller or by a third party, except where such interests are overridden by the interests or fundamental rights and freedoms of the data subject which require protection of personal data, in particular where the data subject is a child.',
								},
							],
						},
						validations: [
							{
								message: 'Please select an option',
								type: 'isLength',
								params: [1],
							},
						],
						question: 'Article 6 lawful basis',
					},
					{
						guidance: 'Please provide justification for selected Article 6 lawful basis.',
						questionId: 'article6legalbasisjustification-4a99eddf3110298ab536b1f13429b8b6',
						validations: [
							{
								type: 'isLength',
								params: [1],
								message: 'Please enter a value',
							},
						],
						question: 'Article 6 legal basis justification',
						input: {
							type: 'textareaInput',
							required: true,
						},
					},
					{
						guidance:
							"Please select appropriate Article 9 conditions. \\n \\nProcessing of personal data revealing racial or ethnic origin, political opinions, religious or philosophical beliefs, or trade union membership, and the processing of genetic data, biometric data for the purpose of uniquely identifying a natural person, data concerning health or data concerning a natural person's sex life or sexual orientation shall be prohibited. This does shall not apply if one of the following applies.",
						question: 'Article 9 conditions',
						validations: [
							{
								params: [1],
								type: 'isLength',
								message: 'Please select an option',
							},
						],
						input: {
							type: 'radioOptionsInput',
							options: [
								{
									value: 'notapplicable',
									text: 'Not applicable',
								},
								{
									text:
										'(a) the data subject has given explicit consent to the processing of those personal data for one or more specified purposes, except where Union or Member State law provide that the prohibition referred to in paragraph 1 may not be lifted by the data subject;',
									value:
										'athedatasubjecthasgivenexplicitconsenttotheprocessingofthosepersonaldataforoneormorespecifiedpurposesexceptwhereunionormemberstatelawprovidethattheprohibitionreferredtoinparagraph1maynotbeliftedbythedatasubject',
								},
								{
									value:
										'bprocessingisnecessaryforthepurposesofcarryingouttheobligationsandexercisingspecificrightsofthecontrollerorofthedatasubjectinthefieldofemploymentandsocialsecurityandsocialprotectionlawinsofarasitisauthorisedbyunionormemberstatelaworacollectiveagreementpursuanttomemberstatelawprovidingforappropriatesafeguardsforthefundamentalrightsandtheinterestsofthedatasubject',
									text:
										'(b) processing is necessary for the purposes of carrying out the obligations and exercising specific rights of the controller or of the data subject in the field of employment and social security and social protection law in so far as it is authorised by Union or Member State law or a collective agreement pursuant to Member State law providing for appropriate safeguards for the fundamental rights and the interests of the data subject;',
								},
								{
									value:
										'cprocessingisnecessarytoprotectthevitalinterestsofthedatasubjectorofanothernaturalpersonwherethedatasubjectisphysicallyorlegallyincapableofgivingconsent',
									text:
										'(c) processing is necessary to protect the vital interests of the data subject or of another natural person where the data subject is physically or legally incapable of giving consent;',
								},
								{
									value:
										'dprocessingiscarriedoutinthecourseofitslegitimateactivitieswithappropriatesafeguardsbyafoundationassociationoranyothernotforprofitbodywithapoliticalphilosophicalreligiousortradeunionaimandonconditionthattheprocessingrelatessolelytothemembersortoformermembersofthebodyortopersonswhohaveregularcontactwithitinconnectionwithitspurposesandthatthepersonaldataarenotdisclosedoutsidethatbodywithouttheconsentofthedatasubjects',
									text:
										'(d) processing is carried out in the course of its legitimate activities with appropriate safeguards by a foundation, association or any other not-for-profit body with a political, philosophical, religious or trade union aim and on condition that the processing relates solely to the members or to former members of the body or to persons who have regular contact with it in connection with its purposes and that the personal data are not disclosed outside that body without the consent of the data subjects;',
								},
								{
									value: 'eprocessingrelatestopersonaldatawhicharemanifestlymadepublicbythedatasubject',
									text: '(e) processing relates to personal data which are manifestly made public by the data subject;',
								},
								{
									value:
										'fprocessingisnecessaryfortheestablishmentexerciseordefenceoflegalclaimsorwhenevercourtsareactingintheirjudicialcapacity',
									text:
										'(f) processing is necessary for the establishment, exercise or defence of legal claims or whenever courts are acting in their judicial capacity;',
								},
								{
									value:
										'gprocessingisnecessaryforreasonsofsubstantialpublicinterestonthebasisofunionormemberstatelawwhichshallbeproportionatetotheaimpursuedrespecttheessenceoftherighttodataprotectionandprovideforsuitableandspecificmeasurestosafeguardthefundamentalrightsandtheinterestsofthedatasubject',
									text:
										'(g) processing is necessary for reasons of substantial public interest, on the basis of Union or Member State law which shall be proportionate to the aim pursued, respect the essence of the right to data protection and provide for suitable and specific measures to safeguard the fundamental rights and the interests of the data subject;',
								},
								{
									value:
										'hprocessingisnecessaryforthepurposesofpreventiveoroccupationalmedicinefortheassessmentoftheworkingcapacityoftheemployeemedicaldiagnosistheprovisionofhealthorsocialcareortreatmentorthemanagementofhealthorsocialcaresystemsandservicesonthebasisofunionormemberstatelaworpursuanttocontractwithahealthprofessionalandsubjecttotheconditionsandsafeguardsreferredtoinparagraph3',
									text:
										'(h) processing is necessary for the purposes of preventive or occupational medicine, for the assessment of the working capacity of the employee, medical diagnosis, the provision of health or social care or treatment or the management of health or social care systems and services on the basis of Union or Member State law or pursuant to contract with a health professional and subject to the conditions and safeguards referred to in paragraph 3;',
								},
								{
									value:
										'iprocessingisnecessaryforreasonsofpublicinterestintheareaofpublichealthsuchasprotectingagainstseriouscrossborderthreatstohealthorensuringhighstandardsofqualityandsafetyofhealthcareandofmedicinalproductsormedicaldevicesonthebasisofunionormemberstatelawwhichprovidesforsuitableandspecificmeasurestosafeguardtherightsandfreedomsofthedatasubjectinparticularprofessionalsecrecy',
									text:
										'(i) processing is necessary for reasons of public interest in the area of public health, such as protecting against serious cross-border threats to health or ensuring high standards of quality and safety of health care and of medicinal products or medical devices, on the basis of Union or Member State law which provides for suitable and specific measures to safeguard the rights and freedoms of the data subject, in particular professional secrecy;',
								},
								{
									value:
										'jprocessingisnecessaryforarchivingpurposesinthepublicinterestscientificorhistoricalresearchpurposesorstatisticalpurposesinaccordancewitharticle891basedonunionormemberstatelawwhichshallbeproportionatetotheaimpursuedrespecttheessenceoftherighttodataprotectionandprovideforsuitableandspecificmeasurestosafeguardthefundamentalrightsandtheinterestsofthedatasubject',
									text:
										'(j) processing is necessary for archiving purposes in the public interest, scientific or historical research purposes or statistical purposes in accordance with Article 89(1) based on Union or Member State law which shall be proportionate to the aim pursued, respect the essence of the right to data protection and provide for suitable and specific measures to safeguard the fundamental rights and the interests of the data subject.',
								},
							],
							label: 'Article 9 conditions',
							required: true,
						},
						questionId: 'article9conditions-92f54ef199bb231b800dff4df8f8c87f',
					},
					{
						question: 'Article 9 legal basis justification',
						validations: [
							{
								params: [1],
								type: 'isLength',
								message: 'Please enter a value',
							},
						],
						input: {
							required: true,
							type: 'textareaInput',
						},
						questionId: 'article9legalbasisjustification-2f94a840058a4b37483daa89e92bbb19',
					},
				],
			},
			{
				questionSetId: 'safedata-confidentialityavenue',
				questions: [
					{
						guidance:
							'Please confirm if consent is in place for all disclosures of confidential information, if you have Section 251 exemption, or any other legal basis that you require for the project.\\n\\nFor England and Wales, please specify if Section 251 exemption is currently being sought and if so, please provide a Confidentiality Advisory group reference code.\\n\\nIn Scotland applications are required for the consented and unconsented use of data.',
						input: {
							type: 'radioOptionsInput',
							options: [
								{
									text: 'Not applicable',
									value: 'notapplicable',
								},
								{
									text: 'Informed consent',
									value: 'informedconsent',
									conditionalQuestions: [
										{
											questionId: 'informedconsentevidence-8c66fdb84ae00669e7e4b3131035f17c',
											input: {
												type: 'checkboxOptionsInput',
												options: [
													{
														value:
															'ihaveenclosedablankcopyofthepatientconsentformsandallrelatedinformationsheetsrelevanttothetimeperiodinthedatarequested',
														text:
															'I have enclosed a blank copy of the patient consent form(s) and all related information sheets relevant to the time period in the data requested',
													},
												],
											},
											question: 'Informed consent evidence',
											label: 'Informed consent evidence',
											guidance: 'Please ensure a copy of the consent form(s) and patient information sheet have been provided.',
										},
									],
								},
								{
									value: 'section251support',
									text: 'Section 251 support',
									conditionalQuestions: [
										{
											question: 'Section 251 exemption evidence',
											input: {
												type: 'checkboxOptionsInput',
												options: [
													{
														value: 'ihaveenclosedacopyofthes251approvedamendmentsandanyrenewalletters',
														text: 'I have enclosed a copy of the S251 approved amendments and any renewal letters',
													},
												],
											},
											questionId: 'section251exemptionevidence-2ca3ab72621e1d05d2a27aa541669955',
											label: 'Section 251 exemption evidence',
											guidance: 'Please ensure a copy of the Section 251 exemption has been provided.',
										},
										{
											question: 'CAG reference',
											input: {
												type: 'textInput',
											},
											questionId: 'cagreference-1d557ba11b79eef6790edda8cfa084ab',
										},
										{
											input: {
												options: [
													{
														text: 'Hold/receive personal data',
														value: 'holdreceivepersonaldata',
													},
													{
														value: 'transferaccesspersonaldata',
														text: 'Transfer/access personal data',
													},
													{
														value: 'operateonandlinkpersonaldata',
														text: 'Operate on and link personal data',
													},
													{
														conditionalQuestions: [
															{
																questionId: 'ifotherpleasespecify-dde51ff375a7e792fe6109dbbd71897e',
																question: 'If other, please specify',
																input: {
																	type: 'textInput',
																},
															},
														],
														text: 'Other',
														value: 'other',
													},
												],
												type: 'checkboxOptionsInput',
											},
											question: 'The section 251 approval enables the applicant to',
											questionId: 'thesection251approvalenablestheapplicantto-15c79dfc700083e333915ad4b9d91038',
											label: 'The section 251 approval enables the applicant to',
											guidance: 'Please indicate what the Section 251 exemption permits you to do as part of your project.',
										},
									],
								},
								{
									conditionalQuestions: [
										{
											question: 'If other, please specify',
											input: {
												type: 'textInput',
											},
											questionId: 'ifotherpleasespecify-d556c56c393b1a086c94b6ce8a8b412c',
										},
									],
									text: 'Other',
									value: 'other',
								},
							],
							required: true,
							label: 'Please provide the legal basis to process confidential information',
						},
						question: 'Please provide the legal basis to process confidential information',
						validations: [
							{
								message: 'Please select an option',
								params: [1],
								type: 'isLength',
							},
						],
						questionId: 'pleaseprovidethelegalbasistoprocessconfidentialinformation-31315424250097e6266f1ebd6ddc619a',
					},
				],
				questionSetHeader: 'Confidentiality avenue',
			},
			{
				questionSetHeader: 'Ethics approval',
				questions: [
					{
						questionId: 'hasethicsapprovalbeenobtained-700c42da3de684b16420d1556d6ca86b',
						input: {
							label: 'Has ethics approval been obtained?',
							required: true,
							options: [
								{
									value: 'yes',
									text: 'Yes',
									conditionalQuestions: [
										{
											input: {
												type: 'textInput',
											},
											question: 'Approval  - REC committee name',
											questionId: 'approvalreccommitteename-1d5c260746636251354fd8c81288f8ce',
											guidance: 'Please provide REC or other committee details.',
										},
										{
											question: 'Approval  - REC reference number',
											input: {
												type: 'textInput',
											},
											questionId: 'approvalrecreferencenumber-3ebc7100dd0ecd3bdf24003e1157dbf4',
										},
										{
											question: 'Approval  - Other committee',
											input: {
												type: 'textInput',
											},
											questionId: 'approvalothercommittee-7eddf6d37ff8154c372f51634e0c05c6',
										},
										{
											guidance: 'Please confirm a copy of the REC referenced above has been enclosed.',
											label: 'Evidence of REC approval',
											questionId: 'evidenceofrecapproval-de13946031ff7802a6aeb563174185df',
											question: 'Evidence of REC approval',
											input: {
												options: [
													{
														value: 'ihaveenclosedacopyofthefinalrecapprovalletterandlettersdocumentinganyrecapprovedamendments',
														text:
															'I have enclosed a copy of the final REC approval letter and letters documenting any REC approved amendments',
													},
												],
												type: 'checkboxOptionsInput',
											},
										},
									],
								},
								{
									text: 'No',
									value: 'no',
									conditionalQuestions: [
										{
											question: 'If not, please provide more details',
											input: {
												type: 'textInput',
											},
											questionId: 'ifnotpleaseprovidemoredetails-6703121361cf22ec74a3246bbca827ca',
										},
									],
								},
								{
									text: 'Approval pending',
									value: 'approvalpending',
									conditionalQuestions: [
										{
											guidance: 'If approval is pending, please provide details.',
											input: {
												type: 'textInput',
											},
											question: 'If approval is pending, please provide more details',
											questionId: 'ifapprovalispendingpleaseprovidemoredetails-368bfcd052089018e98adc36d5e31b21',
										},
									],
								},
								{
									conditionalQuestions: [
										{
											guidance: 'If ethics approval is not required, please explain why this is the case.',
											questionId: 'ifnotrequiredpleaseprovidedetails-1e70f424ee6e2584b00b4115a4c32437',
											question: 'If not required, please provide details',
											input: {
												type: 'textInput',
											},
										},
									],
									value: 'notrequired',
									text: 'Not required',
								},
							],
							type: 'radioOptionsInput',
						},
						question: 'Has ethics approval been obtained?',
						validations: [
							{
								message: 'Please select an option',
								type: 'isLength',
								params: [1],
							},
						],
						guidance:
							'Please confirm if ethics approval has been obtained. Request for research purposes must include enclose evidence of ethics approval or evidence that this is not required.',
					},
				],
				questionSetId: 'safedata-ethicsapproval',
			},
			{
				questionSetId: 'safesettings-storageandprocessing',
				questions: [
					{
						guidance: 'Please specify if the data will be accessed within a Trusted Research Environment. ',
						questionId: 'willthedatabeaccessedwithinatrustedresearchenvironment-dd7ac65a76e29f3df9d741a04176df38',
						question: 'Will the data be accessed within a trusted research environment?',
						input: {
							label: 'Will the data be accessed within a trusted research environment?',
							type: 'radioOptionsInput',
							options: [
								{
									value: 'yes',
									text: 'Yes',
									conditionalQuestions: [
										{
											input: {
												type: 'radioOptionsInput',
												options: [
													{
														text: 'Secure e-Research Platform (SeRP)',
														value: 'secureeresearchplatformserp',
													},
													{
														value: 'nihonestbrokerservicenihbs',
														text: 'NI Honest Broker Service (NI HBS)',
													},
													{
														value: 'scottishnationalsafehavensnsh',
														text: 'Scottish National Safe Haven (SNSH)',
													},
													{
														text: 'NHS Digital',
														value: 'nhsdigital',
														conditionalQuestions: [
															{
																questionId:
																	'doestheapplicantorganisationhaveadsptoolkitifsopleaseprovidedetailsincludingcodescoreandversioncompleted-f45752ad4e835f9f1e222349b8e3ebca',
																input: {
																	type: 'textInput',
																},
																question:
																	'Does the applicant organisation have a DSP Toolkit? If so, please provide details including code, score and version completed.',
															},
														],
													},
													{
														text: 'SAIL Databank',
														value: 'saildatabank',
													},
													{
														value: 'onssecureresearchservicesrs',
														text: 'ONS Secure Research Service (SRS)',
													},
													{
														conditionalQuestions: [
															{
																guidance: "If you have selected 'Other', please specify the Trusted Research Environment.",
																question: 'If other, please specify',
																input: {
																	type: 'textInput',
																},
																questionId: 'ifotherpleasespecify-59df0d64b73cc54a6a59749c24394302',
															},
														],
														text: 'Other',
														value: 'other',
													},
												],
												label: 'In which Trusted Research Environment will the data be accessed?',
											},
											question: 'In which Trusted Research Environment will the data be accessed?',
											questionId: 'inwhichtrustedresearchenvironmentwillthedatabeaccessed-8f40c649e9dfc6d286b85b0eb041aa7d',
											guidance: 'Please indicate the Trusted Research Environment where the data will be accessed.',
										},
									],
								},
								{
									conditionalQuestions: [
										{
											input: {
												type: 'textInput',
											},
											question: 'Registered name of organisation',
											questionId: 'registerednameoforganisation-7529d2095115a155f4cbb1ca0a140ba0',
										},
										{
											guidance: 'Please provide ICO registration details.',
											input: {
												type: 'textInput',
											},
											question: 'Registered number',
											questionId: 'registerednumber-684ff1488ac289ab88dbef33ec45f806',
										},
										{
											label: 'Will this organisation be storing or processing the data?',
											input: {
												options: [
													{
														text: 'Storage',
														value: 'storage',
													},
													{
														text: 'Processing',
														value: 'processing',
													},
												],
												type: 'checkboxOptionsInput',
											},
											question: 'Will this organisation be storing or processing the data?',
											questionId: 'willthisorganisationbestoringorprocessingthedata-0b0117822908ebcf01930d05a2015cf9',
										},
										{
											questionId: 'whattypeofsecurityassurancedoesthisorganisationhaveinplace-e1e2552299764eaa1c27809efb8abc6c',
											input: {
												options: [
													{
														guidance:
															'Adequate security assurance must be provided for all processing locations. Each organisation processing data that is not fully anonymous as part of this project must demonstrate that they have appropriate security arrangements are in place. Please confirm whether the applicant organisation has a compliant Data Security and Protection Toolkit.',
														value: 'datasecurityandprotectiontoolkitdsptoolkit',
														text: 'Data security and Protection Toolkit (DSP Toolkit)',
														conditionalQuestions: [
															{
																guidance:
																	"If you have selected 'Other', please specify the type of security assurance the organisation has put in place.",
																questionId: 'dsptoolkitorganisationcode-c521d50968cda9e7fba09e9eb4611379',
																input: {
																	type: 'textInput',
																},
																question: 'DSP Toolkit organisation code',
															},
															{
																questionId: 'dsptoolkitscore-1785f9ff139c7a563da26fd4a85b6cdc',
																question: 'DSP Toolkit score',
																input: {
																	type: 'textInput',
																},
																guidance:
																	"As a data controller, the applicant's organisation should be registered with the Information Commissioner's Office (ICO). Please provide Security and Protection Toolkit (DSP Toolkit) details.",
															},
															{
																questionId: 'dsptoolkitversioncompleted-e8c56687e00c8ed3d4c64b06ee5fd1e4',
																question: 'DSP Toolkit  version completed',
																input: {
																	type: 'textInput',
																},
															},
														],
													},
													{
														conditionalQuestions: [
															{
																question: 'Evidence of ISO 27001',
																input: {
																	options: [
																		{
																			guidance: 'Please confirm that you have enclosed a copy of your ISO 27001 certificate.',
																			value: 'ihaveenclosedacopyofmycertificate',
																			text: 'I have enclosed a copy of my certificate',
																		},
																	],
																	type: 'checkboxOptionsInput',
																},
																questionId: 'evidenceofiso27001-44e1246414a73510f3083c988c43e0de',
																label: 'Evidence of ISO 27001',
															},
														],
														value: 'iso27001',
														text: 'ISO 27001',
													},
													{
														value: 'slsp',
														text: 'SLSP',
														conditionalQuestions: [
															{
																label: 'Evidence of SLSP',
																questionId: 'evidenceofslsp-8a275e840a90dafa50b2f0399069da64',
																input: {
																	type: 'checkboxOptionsInput',
																	options: [
																		{
																			text: 'I have enclosed a completed system level security policy for ODR review',
																			value: 'ihaveenclosedacompletedsystemlevelsecuritypolicyforodrreview',
																		},
																	],
																},
																question: 'Evidence of SLSP',
															},
														],
													},
													{
														conditionalQuestions: [
															{
																questionId: 'ifotherpleasespecify-c0aa313639a78028e2079d8857527cff',
																input: {
																	type: 'textInput',
																},
																question: 'If other, please specify',
															},
														],
														text: 'Other',
														value: 'other',
													},
												],
												type: 'checkboxOptionsInput',
											},
											question: 'What type of security assurance does this organisation have in place?',
											label: 'What type of security assurance does this organisation have in place?',
										},
										{
											questionId: 'addStorageAndProcessingDetails',
											input: {
												type: 'buttonInput',
												action: 'addRepeatableQuestions',
												questionIds: [
													'registerednameoforganisation-7529d2095115a155f4cbb1ca0a140ba0',
													'registerednumber-684ff1488ac289ab88dbef33ec45f806',
													'willthisorganisationbestoringorprocessingthedata-0b0117822908ebcf01930d05a2015cf9',
													'whattypeofsecurityassurancedoesthisorganisationhaveinplace-e1e2552299764eaa1c27809efb8abc6c',
												],
												text: '+ Add another organisation',
												class: 'btn btn-primary addButton',
												separatorText: 'Additional organisation details',
											},
											guidance:
												"If there are other orgnisations to be specified as part of this application, click 'Add another organisation' as required.",
										},
									],
									text: 'No (Please provide details of the processing/storage organisations below)',
									value: 'nopleaseprovidedetailsoftheprocessingstorageorganisationsbelow',
								},
							],
						},
					},
				],
				questionSetHeader: 'Storage and processing',
			},
			{
				questionSetId: 'safesettings-dataflow',
				questions: [
					{
						guidance:
							'Jurisdiction (coverage) is defined as the location of the healthcare services who originated / initially provided the extract of data you are requesting. \\n A description of the following must be provided:\\n - All locations where data is processed\\n - All transfers that take place between locations and organisations\\n - Data linkages to other data sets.',
						questionId: 'willthedatabetransferredoutsideoftheunitedkingdom-7a69ac1db4747aac21f40d1440372ee8',
						question: 'Will the data be transferred outside of the United Kingdom?',
						validations: [
							{
								params: [1],
								type: 'isLength',
								message: 'Please select an option',
							},
						],
						input: {
							label: 'Will the data be transferred outside of the United Kingdom?',
							required: true,
							options: [
								{
									text: 'Yes',
									value: 'yes',
									conditionalQuestions: [
										{
											input: {
												type: 'textareaInput',
											},
											question: 'If yes, please provide more details',
											questionId: 'ifyespleaseprovidemoredetails-e13d902d5669329df88e6bace3c58398',
										},
									],
								},
								{
									text: 'No',
									value: 'no',
								},
							],
							type: 'radioOptionsInput',
						},
					},
					{
						questionId: 'pleasespecifytheregionswheredatawillbeprocessed-9e52bf589375cddbce25a7d51ae2e67d',
						question: 'Please specify the regions where data will be processed.',
						input: {
							label: 'Please specify the regions where data will be processed.',
							type: 'checkboxOptionsInput',
							options: [
								{
									value: 'englandwales',
									text: 'England/Wales',
								},
								{
									value: 'unitedkingdom',
									text: 'United Kingdom',
								},
								{
									value: 'europeaneconomicarea',
									text: 'European Economic Area',
								},
								{
									text: 'Other',
									value: 'other',
								},
							],
						},
						guidance:
							'Please indicate if data will be transferred outside of the European Economic Area, it must be stated where to and details given of how that will be in compliance with the Data Protection Act 2018.\\n\\n If data are to be stored or processed outside of England/Wales, it may be that you will need to provide further assurance to support your application',
					},
					{
						question: 'Please provide detailed information on data flows',
						input: {
							type: 'textareaInput',
						},
						questionId: 'pleaseprovidedetailedinformationondataflows-f3334c7e743fad5b3d148bea4bf2f0f2',
						guidance:
							'In this section you should confirm that you have enclosed a data flow diagram in your application. Please send us flow diagram via email. A data flow diagram is helpful in showing planned data flows of how data will move through the project, whether the data are identifiable or pseudonymised, who has access to, who is responsible for the data at any point, the permissions/consent in place and how it will be kept secure at every stage.\\n \\n The data flow should describe which organisation (if more than one) will be receiving the data and in what form (anonymised/limited access de-identified/personal). Your data flow should include:\\n \\n - All locations where the data will be housed/stored\\n \\n - All transfers of data that will take place between organisations (and premises if an organisation has more than one remises where the data will be housed/stored)\\n \\n - The format of the data as part of each transfer (anonymised/limited access de-identified/personal)\\n \\n - If applicable, where the data will undergo any linkages to other data sets\\n \\n Please display only the data requested and any linked datasets, and not the entire project data flow.',
					},
					{
						questionId:
							'pleaseincludeadataflowdiagramfortherequesteddataandanyadditionaldatasetsintendedtobelinked-406fb1e63a0c77760222bd32cdf055e5',
						input: {
							label: 'Please include a data flow diagram for the requested data and any additional datasets intended to be linked.',
							type: 'checkboxOptionsInput',
							options: [
								{
									value: 'ihaveenclosedacopyofthedataflow',
									text: 'I have enclosed a copy of the dataflow',
								},
							],
						},
						question: 'Please include a data flow diagram for the requested data and any additional datasets intended to be linked.',
					},
				],
				questionSetHeader: 'Dataflow',
			},
			{
				questionSetId: 'safeoutputs-outputsdisseminationplans',
				questions: [
					{
						guidance:
							'Please describe how you plan to disseminate the results from your proposal. \\n\\nAs the public might not read scientific literature or attend conferences, please consider how the results or findings will be disseminated to the wider public and how this fits with the public benefit of the proposal. \\n\\nPlease indicate if you plan to publish your findings in an open access journal. Reference should also be made to policy documents, service frameworks or strategies that are relevant.',
						question: 'How will proposal findings be disseminated, to what audience and in what format?',
						validations: [
							{
								message: 'Please enter a value',
								type: 'isLength',
								params: [1],
							},
						],
						input: {
							required: true,
							type: 'textareaInput',
						},
						questionId: 'howwillproposalfindingsbedisseminatedtowhataudienceandinwhatformat-cb1bb8cc88200378b5711fc3e4504e4c',
					},
					{
						guidance:
							'Provide an outline of your plan, on what data, and how this will be done, with the anticipated outcomes and outputs and whether the outputs are in record level form.',
						input: {
							type: 'textareaInput',
							required: true,
						},
						validations: [
							{
								params: [1],
								type: 'isLength',
								message: 'Please enter a value',
							},
						],
						question: 'Please include any milestones for outputs dissemination.',
						questionId: 'pleaseincludeanymilestonesforoutputsdissemination-fb1d923bcad197405b8c98256588f1cd',
					},
					{
						input: {
							type: 'textareaInput',
							required: true,
						},
						validations: [
							{
								message: 'Please enter a value',
								params: [1],
								type: 'isLength',
							},
						],
						question:
							'What steps will be taken to ensure that individuals cannot be identified? Please describe what disclosure control policy will be applied.',
						questionId:
							'whatstepswillbetakentoensurethatindividualscannotbeidentifiedpleasedescribewhatdisclosurecontrolpolicywillbeapplied-9268ebc3ed695f413cf4f09af52e2c95',
						guidance:
							'Please describe the steps you will take to ensure the confidentiality of the data when disseminating or publishing your findings. This may include the application of disclosure control procedures, aggregation of data or other approaches.',
					},
				],
				questionSetHeader: 'Outputs dissemination plans',
			},
			{
				questionSetId: 'safeoutputs-retention',
				questionSetHeader: 'Retention',
				questions: [
					{
						validations: [
							{
								message: 'Please enter a value',
								type: 'isLength',
								format: 'dd/MM/yyyy',
								params: [1],
							},
						],
						question: 'Please state the date until which you will retain the data',
						input: {
							type: 'datePickerCustom',
							required: true,
						},
						questionId: 'Please state the date until which you will retain the data',
						guidance: 'Please confirm how long you intend to retain the data relating to your proposal.',
					},
					{
						question: 'Please indicate the reason for this date',
						input: {
							type: 'textareaInput',
						},
						questionId: 'pleaseindicatethereasonforthisdate-f95628ddfa8a84e9d078fd81daeb7df9',
					},
					{
						question:
							'Please provide details of any permissions that will need to apply for an extension to during this period in order to retain a legal basis to hold the data (e.g. section 251)',
						input: {
							type: 'textareaInput',
						},
						questionId:
							'pleaseprovidedetailsofanypermissionsthatwillneedtoapplyforanextensiontoduringthisperiodinordertoretainalegalbasistoholdthedataegsection251-aef776a8ab341880e6413bd0125c476f',
					},
				],
			},
			{
				questionSetId: 'add-safepeople-otherindividuals',
				questions: [
					{
						questionId: 'add-safepeople-otherindividual',
						input: {
							type: 'buttonInput',
							action: 'addRepeatableSection',
							panelId: 'safepeople-otherindividuals',
							text: '+ Add another individual',
							class: 'btn btn-primary addButton',
						},
						guidance:
							"If there are other individuals to be specified as part of this application, click 'Add another individual' as required.",
					},
				],
			},
		],
	},
];
