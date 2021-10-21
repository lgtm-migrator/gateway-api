module.exports = {
	'/api/v1/publishers/{publisher}/dataaccessrequests': {
		get: {
			tags: ['Publishers'],
			parameters: [
				{
					in: 'path',
					name: 'publisher',
					required: true,
					description: 'The full name of the Custodian/Publisher, as registered on the Gateway.',
					schema: {
						type: 'string',
						example: 'OTHER > HEALTH DATA RESEARCH UK',
					},
				},
			],
			description: 'Returns a collection of all Data Access Requests that have been submitted to the Custodian team for review.',
			responses: {
				200: {
					description: 'Successful response containing a collection of Data Access Request applications.',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									avgDecisionTime: {
										type: 'string',
										description: 'The average number of days the Custodian has taken to process applications from submission to decision.',
									},
									canViewSubmitted: {
										type: 'boolean',
										description:
											'A flag to indicate if the requesting user has permissions to view submitted applications, which are visible only to managers of the Custodian team.  Using OAuth2.0 client credentials will return this value as true.',
									},
									status: {
										type: 'string',
									},
									data: {
										type: 'array',
										items: {
											type: 'object',
											properties: {
												aboutApplication: {
													description:
														"An object which holds data relating to the 'about application' section of the application form including details of whether the project is an NCS project or not.",
													type: 'object',
													properties: {
														isNationalCoreStudies: {
															type: 'boolean',
															description: 'A flag to indicate if this application is in relation to a National Core Studies Project.',
														},
														nationalCoreStudiesProjectId: {
															type: 'integer',
															description:
																'The unique identifier correlating to a Gateway Project entity indicating that this application is relating to a National Core Studies project.',
														},
														projectName: {
															type: 'string',
															description: 'The project name that has been assigned to the application by the applicant(s).',
														},
													},
												},
												amendmentIterations: {
													type: 'array',
													items: {
														type: 'object',
													},
													description:
														'An array containing an object with details for each iteration the application has passed through.  An iteration is defined as an application which has been returned by the Custodian for correction, corrected by the applicant(s) and resubmitted.  The object contains dates that the application was returned, and resubmitted as well as reference to any questions that were highlighted for amendment.',
												},
												amendmentStatus: {
													type: 'string',
													description:
														'A textual indicator of what state the application is in relating to updates made by the Custodian e.g. if it is awaiting updates from the applicant or if new updates have been submitted by the applicant(s).',
												},
												applicants: {
													type: 'string',
													description: 'Concatenated list of applicants names who are contributing to the application.',
												},
												applicationStatus: {
													type: 'string',
													enum: ['inProgress', 'submitted', 'inReview', 'approved', 'rejected', 'approved with conditions'],
													description: 'The current status of the application.',
												},
												authorIds: {
													type: 'array',
													items: {
														type: 'integer',
														description:
															"An array of values correlating to specific user's via their numeric identifiers.  An author is also known as a contributor to an application and can view, edit or submit.",
													},
												},
												createdAt: {
													type: 'string',
													description: 'The date and time that the application was started.',
												},
												datasetIds: {
													type: 'array',
													items: {
														type: 'string',
													},
													description:
														'An array of values correlating to datasets selected for the application via their identifier, which is unique per version.',
												},
												datasetTitles: {
													type: 'array',
													items: {
														type: 'string',
													},
													description: 'An array of strings correlating to the dataset titles that have been selected for the application.',
												},
												datasets: {
													type: 'array',
													items: {
														type: 'object',
													},
													description:
														'An array containing the full metadata for each of the datasets that have been applied for through this application.',
												},
												dateSubmitted: {
													type: 'string',
													description:
														'The date and time that the application was originally submitted by the applicant(s) to the Custodian for review.',
												},
												files: {
													type: 'array',
													items: {
														type: 'object',
													},
													description:
														'An array containing the links to files that have been uploaded to the application form and are held within the Gateway ecosystem.',
												},
												id: {
													type: 'string',
													description: 'The unique identifier for the application.',
												},
												jsonSchema: {
													type: 'object',
													description:
														'The object containing the json definition that renders the application form using the Winterfell library.  This contains the details of questions, questions sets, question panels, headings and navigation items that appear.',
												},
												questionAnswers: {
													type: 'object',
													description:
														'The object containing the answers provided on the application form.  This consists of a series of key pairs, where the key is the unqiue question Id, and the value the is the answer provided to the question.  In the case of a multi select on the form, the value may be an array.',
												},
												mainApplicant: {
													type: 'object',
													description:
														'An object containing the details of the main applicant of the application as referenced by the userId field.',
												},
												projectId: {
													type: 'string',
													description:
														'The unique identifier for the application converted to a more human friendly format in uppercase and hypenated.',
												},
												projectName: {
													type: 'string',
													description: 'The project name that has been assigned to the application by the applicant(s).',
												},
												publisher: {
													type: 'string',
													description: 'The name of the Custodian that holds the dataset and is processing the application.',
												},
												publisherObj: {
													type: 'object',
													description: 'The object containing details regarding the Custodian/publisher relating to the application.',
												},
												reviewPanels: {
													type: 'array',
													items: {
														type: 'string',
													},
													description:
														"An array containing the sections of the application form that the current user is required to review if they are a reviewer of the current workflow step that the application is in.  E.g. ['Safe People','Safe Data']",
												},
												schemaId: {
													type: 'string',
													description: 'The unique identifier that correlates to the schema from which the application form was generated.',
												},
												updatedAt: {
													type: 'string',
													description: 'The date and time that the application was last updated by any party.',
												},
												userId: {
													type: 'integer',
													description:
														'The unique identifier that correlates to the user account of the main applicant.  This is always the user that started the application.',
												},
												deadlinePassed: {
													type: 'boolean',
													description: 'A flag to indicate if the deadline has passed for the current review phase for this application.',
												},
												decisionApproved: {
													type: 'boolean',
													description:
														'A flag to indicate if the request users decision as a reviewer of the current workflow phase was positive or negative.  i.e. correlating to approval or rejection recommendation.',
												},
												decisionComments: {
													type: 'string',
													description:
														'A supporting note or comment made by the requesting user as context to their decision as a reviewer of the current workflow phase.',
												},
												decisionDate: {
													type: 'string',
													description: 'The date that the requesting user made their decision as a reviewer of the current workflow phase.',
												},
												decisionDuration: {
													type: 'integer',
													description:
														"The number of days from submission until a final decision was made on the application.  i.e. the application status was changed to a final status e.g. 'Approved'.",
												},
												decisionMade: {
													type: 'boolean',
													description:
														'A flag to indicate if the requesting user has made an expected decision as a reviewer of the current workflow phase.',
												},
												decisionStatus: {
													type: 'string',
													description:
														'A message indicating if the requesting user as a reviewer of the application has made a decision or is still required to make a decision for the current work flow.',
												},
												isReviewer: {
													type: 'boolean',
													description:
														'A flag to indicate if the requesting user is a reviewer of the current workflow step for the application.',
												},
												remainingActioners: {
													type: 'array',
													items: {
														type: 'string',
													},
													description:
														'An array containing the names of Custodian team reviewers expected to complete a review for the current workflow phase, or a list of managers if the application is awaiting a final decision.',
												},
												reviewStatus: {
													type: 'string',
													description:
														"A message indicating the current status of the application review in relation to the assigned workflow.  E.g. 'Final decision required' or 'Deadline is today'.  This message changes based on the requesting user's relationship to the application.  E.g. if they are a reviewer or manager.",
												},
												stepName: {
													type: 'string',
													description: 'The name of the current workflow step that the application is in.',
												},
												workflowCompleted: {
													type: 'boolean',
													description: 'A flag to indicate if the assigned workflow for the review process has been completed.',
												},
												workflowName: {
													type: 'string',
													description:
														'The name of the workflow the Custodian team have assigned to the application for the review process.',
												},
											},
										},
									},
								},
							},
							examples: {
								'Single Request Received': {
									value: {
										success: true,
										data: [
											{
												authorIds: [],
												datasetIds: ['d5faf9c6-6c34-46d7-93c4-7706a5436ed9'],
												datasetTitles: [],
												applicationStatus: 'submitted',
												jsonSchema: '{omitted for brevity...}',
												questionAnswers: '{omitted for brevity...}',
												publisher: 'OTHER > HEALTH DATA RESEARCH UK',
												_id: '601853db22dc004f9adfaa24',
												version: 1,
												userId: 7584453789581072,
												schemaId: '5f55e87e780ba204b0a98eb8',
												files: [
													{
														error: '',
														_id: '601aacf8ecdfa66e5cbc2742',
														status: 'UPLOADED',
														description: 'QuestionAnswers',
														fileId: '9e76ee1a676f423b9b5c7aabf59c69db',
														size: 509984,
														name: 'QuestionAnswersFlags.png',
														owner: '5ec7f1b39219d627e5cafae3',
													},
													{
														error: '',
														_id: '601aadbcecdfa6c532bc2743',
														status: 'UPLOADED',
														description: 'Notifications',
														fileId: 'adb1718dcc094b9cb4b0ab347ad2ee94',
														size: 54346,
														name: 'HQIP-Workflow-Assigned-Notification.png',
														owner: '5ec7f1b39219d627e5cafae3',
													},
												],
												amendmentIterations: [],
												createdAt: '2021-02-01T19:17:47.470Z',
												updatedAt: '2021-02-03T16:36:36.720Z',
												__v: 2,
												projectId: '6018-53DB-22DC-004F-9ADF-AA24',
												aboutApplication: {
													selectedDatasets: [
														{
															_id: '5fc31a18d98e4f4cff7e9315',
															datasetId: 'd5faf9c6-6c34-46d7-93c4-7706a5436ed9',
															name: 'HDR UK Papers & Preprints',
															description:
																'Publications that mention HDR-UK (or any variant thereof) in Acknowledgements or Author Affiliations\n\nThis will include:\n- Papers\n- COVID-19 Papers\n- COVID-19 Preprint',
															abstract:
																'Publications that mention HDR-UK (or any variant thereof) in Acknowledgements or Author Affiliations',
															publisher: 'OTHER > HEALTH DATA RESEARCH UK',
															contactPoint: 'hdr.hdr@hdruk.ac.uk',
															publisherObj: {
																dataRequestModalContent: {
																	header: ' ',
																	body: '{omitted for brevity...}',
																	footer: '',
																},
																active: true,
																allowsMessaging: true,
																workflowEnabled: true,
																_id: '5f7b1a2bce9f65e6ed83e7da',
																name: 'OTHER > HEALTH DATA RESEARCH UK',
																imageURL: '',
																team: {
																	active: true,
																	_id: '5f7b1a2bce9f65e6ed83e7da',
																	members: [
																		{
																			roles: ['manager'],
																			memberid: '5f1a98861a821b4a53e44d15',
																		},
																		{
																			roles: ['manager'],
																			memberid: '600bfc99c8bf700f2c7d5c36',
																		},
																	],
																	type: 'publisher',
																	__v: 3,
																	createdAt: '2020-11-30T21:12:40.855Z',
																	updatedAt: '2020-12-02T13:33:45.232Z',
																},
															},
														},
													],
													isNationalCoreStudies: true,
													nationalCoreStudiesProjectId: '4324836585275824',
													projectName: 'Test application title',
													completedDatasetSelection: true,
													completedInviteCollaborators: true,
													completedReadAdvice: true,
													completedCommunicateAdvice: true,
													completedApprovalsAdvice: true,
													completedSubmitAdvice: true,
												},
												dateSubmitted: '2021-02-03T16:37:36.081Z',
												datasets: [
													{
														categories: {
															programmingLanguage: [],
														},
														tags: {
															features: ['Preprints', 'Papers', 'HDR UK'],
															topics: [],
														},
														datasetfields: {
															geographicCoverage: ['https://www.geonames.org/countries/GB/united-kingdom.html'],
															physicalSampleAvailability: ['Not Available'],
															technicaldetails: '{omitted for brevity...}',
															versionLinks: [
																{
																	id: '142b1618-2691-4019-97b4-16b1e27c5f95',
																	linkType: 'Superseded By',
																	domainType: 'CatalogueSemanticLink',
																	source: {
																		id: '9e798632-442a-427b-8d0e-456f754d28dc',
																		domainType: 'DataModel',
																		label: 'HDR UK Papers & Preprints',
																		documentationVersion: '0.0.1',
																	},
																	target: {
																		id: 'd5faf9c6-6c34-46d7-93c4-7706a5436ed9',
																		domainType: 'DataModel',
																		label: 'HDR UK Papers & Preprints',
																		documentationVersion: '1.0.0',
																	},
																},
															],
															phenotypes: [],
															publisher: 'OTHER > HEALTH DATA RESEARCH UK',
															abstract:
																'Publications that mention HDR-UK (or any variant thereof) in Acknowledgements or Author Affiliations',
															releaseDate: '2020-11-27T00:00:00Z',
															accessRequestDuration: 'Other',
															conformsTo: 'OTHER',
															accessRights: 'https://github.com/HDRUK/papers/blob/master/LICENSE',
															jurisdiction: 'GB-ENG',
															datasetStartDate: '2020-03-31',
															datasetEndDate: '2022-04-30',
															statisticalPopulation: '0',
															ageBand: '0-0',
															contactPoint: 'hdr.hdr@hdruk.ac.uk',
															periodicity: 'Daily',
															metadataquality: {
																id: 'd5faf9c6-6c34-46d7-93c4-7706a5436ed9',
																publisher: 'OTHER > HEALTH DATA RESEARCH UK',
																title: 'HDR UK Papers & Preprints',
																completeness_percent: 95.24,
																weighted_completeness_percent: 100,
																error_percent: 11.63,
																weighted_error_percent: 19.05,
																quality_score: 91.81,
																quality_rating: 'Gold',
																weighted_quality_score: 90.47,
																weighted_quality_rating: 'Gold',
															},
															datautility: {
																id: 'd5faf9c6-6c34-46d7-93c4-7706a5436ed9',
																publisher: 'OTHER > HEALTH DATA RESEARCH UK',
																title: 'HDR UK Papers & Preprints',
																metadata_richness: 'Gold',
																availability_of_additional_documentation_and_support: '',
																data_model: '',
																data_dictionary: '',
																provenance: '',
																data_quality_management_process: '',
																dama_quality_dimensions: '',
																pathway_coverage: '',
																length_of_follow_up: '',
																allowable_uses: '',
																research_environment: '',
																time_lag: '',
																timeliness: '',
																linkages: '',
																data_enrichments: '',
															},
															metadataschema: {
																'@context': 'http://schema.org/',
																'@type': 'Dataset',
																identifier: 'd5faf9c6-6c34-46d7-93c4-7706a5436ed9',
																url: 'https://healthdatagateway.org/detail/d5faf9c6-6c34-46d7-93c4-7706a5436ed9',
																name: 'HDR UK Papers & Preprints',
																description:
																	'Publications that mention HDR-UK (or any variant thereof) in Acknowledgements or Author Affiliations\n\nThis will include:\n- Papers\n- COVID-19 Papers\n- COVID-19 Preprint',
																license: 'Open Access',
																keywords: [
																	'Preprints,Papers,HDR UK',
																	'OTHER > HEALTH DATA RESEARCH UK',
																	'NOT APPLICABLE',
																	'GB-ENG',
																	'https://www.geonames.org/countries/GB/united-kingdom.html',
																],
																includedinDataCatalog: [
																	{
																		'@type': 'DataCatalog',
																		name: 'OTHER > HEALTH DATA RESEARCH UK',
																		url: 'hdr.hdr@hdruk.ac.uk',
																	},
																	{
																		'@type': 'DataCatalog',
																		name: 'HDR UK Health Data Gateway',
																		url: 'http://healthdatagateway.org',
																	},
																],
															},
														},
														authors: [],
														showOrganisation: false,
														toolids: [],
														datasetids: [],
														_id: '5fc31a18d98e4f4cff7e9315',
														relatedObjects: [],
														programmingLanguage: [],
														pid: 'b7a62c6d-ed00-4423-ad27-e90b71222d8e',
														datasetVersion: '1.0.0',
														id: 9816147066244124,
														datasetid: 'd5faf9c6-6c34-46d7-93c4-7706a5436ed9',
														type: 'dataset',
														activeflag: 'active',
														name: 'HDR UK Papers & Preprints',
														description:
															'Publications that mention HDR-UK (or any variant thereof) in Acknowledgements or Author Affiliations\n\nThis will include:\n- Papers\n- COVID-19 Papers\n- COVID-19 Preprint',
														license: 'Open Access',
														datasetv2: {
															identifier: '',
															version: '',
															issued: '',
															modified: '',
															revisions: [],
															summary: {
																title: '',
																abstract:
																	'Publications that mention HDR-UK (or any variant thereof) in Acknowledgements or Author Affiliations',
																publisher: {
																	identifier: '',
																	name: 'HEALTH DATA RESEARCH UK',
																	logo: '',
																	description: '',
																	contactPoint: 'hdr.hdr@hdruk.ac.uk',
																	memberOf: 'OTHER',
																	accessRights: [],
																	deliveryLeadTime: '',
																	accessService: '',
																	accessRequestCost: '',
																	dataUseLimitation: [],
																	dataUseRequirements: [],
																},
																contactPoint: 'hdr.hdr@hdruk.ac.uk',
																keywords: ['Preprints', 'Papers', 'HDR UK'],
																alternateIdentifiers: [],
																doiName: 'https://doi.org/10.5281/zenodo.326615',
															},
															documentation: {
																description: '',
																associatedMedia: ['https://github.com/HDRUK/papers'],
																isPartOf: 'NOT APPLICABLE',
															},
															coverage: {
																spatial: 'GB',
																typicalAgeRange: '0-0',
																physicalSampleAvailability: ['NOT AVAILABLE'],
																followup: 'UNKNOWN',
																pathway: 'NOT APPLICABLE',
															},
															provenance: {
																origin: {
																	purpose: 'OTHER',
																	source: 'MACHINE GENERATED',
																	collectionSituation: 'OTHER',
																},
																temporal: {
																	accrualPeriodicity: 'DAILY',
																	distributionReleaseDate: '2020-11-27',
																	startDate: '2020-03-31',
																	endDate: '2022-04-30',
																	timeLag: 'NO TIMELAG',
																},
															},
															accessibility: {
																usage: {
																	dataUseLimitation: 'GENERAL RESEARCH USE',
																	dataUseRequirements: 'RETURN TO DATABASE OR RESOURCE',
																	resourceCreator: 'HDR UK Using Team',
																	investigations: ['https://github.com/HDRUK/papers'],
																	isReferencedBy: ['Not Available'],
																},
																access: {
																	accessRights: ['Open Access'],
																	accessService: 'https://github.com/HDRUK/papers',
																	accessRequestCost: 'Free',
																	deliveryLeadTime: 'OTHER',
																	jurisdiction: 'GB-ENG',
																	dataProcessor: 'HDR UK',
																	dataController: 'HDR UK',
																},
																formatAndStandards: {
																	vocabularyEncodingScheme: 'OTHER',
																	conformsTo: 'OTHER',
																	language: 'en',
																	format: ['csv', 'JSON'],
																},
															},
															enrichmentAndLinkage: {
																qualifiedRelation: ['Not Available'],
																derivation: ['Not Available'],
																tools: ['https://github.com/HDRUK/papers'],
															},
															observations: [],
														},
														createdAt: '2020-11-29T03:48:41.794Z',
														updatedAt: '2021-02-02T10:09:57.030Z',
														__v: 0,
														counter: 20,
													},
												],
												dataset: null,
												mainApplicant: {
													isServiceAccount: false,
													_id: '5ec7f1b39219d627e5cafae3',
													id: 7584453789581072,
													providerId: '112563375053074694443',
													provider: 'google',
													firstname: 'Chris',
													lastname: 'Marks',
													email: 'chris.marks@paconsulting.com',
													role: 'Admin',
													__v: 0,
													redirectURL: '/tool/100000012',
													discourseKey: '2f52ecaa21a0d0223a119da5a09f8f8b09459e7b69ec3f981102d09f66488d99',
													discourseUsername: 'chris.marks',
													updatedAt: '2021-02-01T12:39:56.372Z',
												},
												publisherObj: {
													dataRequestModalContent: {
														header: '',
														body: '',
														footer: '',
													},
													active: true,
													allowsMessaging: true,
													workflowEnabled: true,
													_id: '5f7b1a2bce9f65e6ed83e7da',
													name: 'OTHER > HEALTH DATA RESEARCH UK',
													imageURL: '',
													team: {
														active: true,
														_id: '5f7b1a2bce9f65e6ed83e7da',
														members: [
															{
																roles: ['manager'],
																memberid: '5f1a98861a821b4a53e44d15',
															},
															{
																roles: ['manager'],
																memberid: '600bfc99c8bf700f2c7d5c36',
															},
														],
														type: 'publisher',
														__v: 3,
														createdAt: '2020-11-30T21:12:40.855Z',
														updatedAt: '2020-12-02T13:33:45.232Z',
														users: [
															{
																_id: '5f1a98861a821b4a53e44d15',
																firstname: 'Robin',
																lastname: 'Kavanagh',
															},
															{
																_id: '600bfc99c8bf700f2c7d5c36',
																firstname: 'HDR-UK',
																lastname: 'Service Account',
															},
														],
													},
												},
												id: '601853db22dc004f9adfaa24',
												projectName: 'PA Paper',
												applicants: 'Chris Marks',
												workflowName: '',
												workflowCompleted: false,
												decisionDuration: '',
												decisionMade: false,
												decisionStatus: '',
												decisionComments: '',
												decisionDate: '',
												decisionApproved: false,
												remainingActioners: 'Robin Kavanagh (you), HDR-UK Service Account',
												stepName: '',
												deadlinePassed: '',
												reviewStatus: '',
												isReviewer: false,
												reviewPanels: [],
												amendmentStatus: '',
											},
										],
										avgDecisionTime: 1,
										canViewSubmitted: true,
									},
								},
							},
						},
					},
				},
				401: {
					description: 'Unauthorised attempt to access an application.',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									status: {
										type: 'string',
									},
									message: {
										type: 'string',
									},
								},
							},
							examples: {
								Unauthorised: {
									value: {
										status: 'failure',
										message: 'Unauthorised',
									},
								},
							},
						},
					},
				},
				404: {
					description: 'Failed to find the application requested.',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: {
										type: 'boolean',
									},
								},
							},
							examples: {
								'Not Found': {
									value: {
										success: false,
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
