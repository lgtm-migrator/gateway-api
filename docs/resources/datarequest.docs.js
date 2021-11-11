module.exports = {
	'/api/v1/data-access-request/{id}': {
		get: {
			tags: ['Data Access Request'],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The unique identifier for a single data access request application.',
					schema: {
						type: 'string',
						example: '5ee249426136805fbf094eef',
					},
				},
			],
			description: 'Retrieve a single Data Access Request application using a supplied identifer',
			responses: {
				200: {
					description: 'Successful response containing a full data access request application.',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									status: {
										type: 'string',
									},
									data: {
										type: 'object',
										properties: {
											id: {
												type: 'string',
												description: 'The unique identifier for the application.',
											},
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
											authorIds: {
												type: 'array',
												items: {
													type: 'integer',
												},
												description:
													"An array of values correlating to specific user's via their numeric identifiers.  An author is also known as a contributor to an application and can view, edit or submit.",
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
											applicationStatus: {
												type: 'string',
												enum: ['inProgress', 'submitted', 'inReview', 'approved', 'rejected', 'approved with conditions'],
												description: 'The current status of the application.',
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
											publisher: {
												type: 'string',
												description: 'The name of the Custodian that holds the dataset and is processing the application.',
											},
											publisherObj: {
												type: 'object',
												description: 'The object containing details regarding the Custodian/publisher relating to the application.',
											},
											userId: {
												type: 'integer',
												description:
													'The unique identifier that correlates to the user account of the main applicant.  This is always the user that started the application.',
											},
											schemaId: {
												type: 'string',
												description: 'The unique identifier that correlates to the schema from which the application form was generated.',
											},
											files: {
												type: 'array',
												items: {
													type: 'object',
												},
												description:
													'An array containing the links to files that have been uploaded to the application form and are held within the Gateway ecosystem.',
											},
											amendmentIterations: {
												type: 'array',
												items: {
													type: 'object',
												},
												description:
													'An array containing an object with details for each iteration the application has passed through.  An iteration is defined as an application which has been returned by the Custodian for correction, corrected by the applicant(s) and resubmitted.  The object contains dates that the application was returned, and resubmitted as well as reference to any questions that were highlighted for amendment.',
											},
											createdAt: {
												type: 'string',
												description: 'The date and time that the application was started.',
											},
											updatedAt: {
												type: 'string',
												description: 'The date and time that the application was last updated by any party.',
											},
											projectId: {
												type: 'string',
												description:
													'The unique identifier for the application converted to a more human friendly format in uppercase and hypenated.',
											},
											dateSubmitted: {
												type: 'string',
												description:
													'The date and time that the application was originally submitted by the applicant(s) to the Custodian for review.',
											},
											dateReviewStart: {
												type: 'string',
												description:
													'The date and time that the review process was commenced by a Custodian manager.  The review starts from the moment the manager opens the application to triage it.',
											},
											dateFinalStatus: {
												type: 'string',
												description:
													'The date and time that the Custodian triggered a status change to the application once a final decision was made.  E.g. when application was approved.  This date can be used in conjunction with the dateReviewStart date to calculate the length of time the Custodian took to make a decision through their review process.',
											},
											datasets: {
												type: 'array',
												items: {
													type: 'object',
												},
												description:
													'An array containing the full metadata for each of the datasets that have been applied for through this application.',
											},
											mainApplicant: {
												type: 'object',
												description:
													'An object containing the details of the main applicant of the application as referenced by the userId field.',
											},
											authors: {
												type: 'array',
												items: {
													type: 'object',
												},
												description:
													'An array containing the details of the contributors of the application as referenced by the authorIds field.',
											},
											readOnly: {
												type: 'boolean',
												description:
													'A value to indicate if the requesting party is able to modify the application in its present state.  For example, this will be false for a Custodian, but true for applicants if the applicant(s) are working on resubmitting the application following a request for amendments.',
											},
											unansweredAmendments: {
												type: 'integer',
												description:
													'The number of amendments that have been requested by the Custodian in the current amendment iteration.',
											},
											answeredAmendments: {
												type: 'integer',
												description:
													'The number of requested amendments that the applicant(s) have fixed in the current amendment iteration.',
											},
											userType: {
												type: 'string',
												enum: ['custodian', 'applicant'],
												description:
													'The type of user that has requested the Data Access Request application based on their permissions.  It is either an applicant or a Custodian user.',
											},
											activeParty: {
												type: 'string',
												enum: ['custodian', 'applicant'],
												description:
													'The party that is currently handling the application.  This is the applicant during presubmission, then the Custodian following submission.  The active party then fluctuates between parties during amendment iterations.',
											},
											inReviewMode: {
												type: 'boolean',
												description:
													'A flag to indicate if the current user is a reviewer of the application.  This value will be false unless the requesting user is an assigned reviewer to a currently active workflow step.  When this value is true, the requesting user is able to recommend approval or rejection of the application.',
											},
											reviewSections: {
												type: 'array',
												items: {
													type: 'string',
												},
												description:
													"An array containing the sections of the application form that the current user is required to review if they are a reviewer of the current workflow step that the application is in.  E.g. ['Safe People','Safe Data']",
											},
											hasRecommended: {
												type: 'boolean',
												description:
													'A flag to indicate if the current user as a reviewer of the current workflow phase has submitted their recommendation for approval or rejection based on their review of the review sections assigned to them.',
											},
											workflow: {
												type: 'object',
												description:
													'The full details of the workflow that has been assigned to the Data Access Request application.  This includes information such as the review phases that the application will pass through and associated metadata.',
											},
										},
									},
								},
							},
							examples: {
								'Approved Application': {
									value: {
										status: 'success',
										data: {
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
											authorIds: [],
											datasetIds: ['d5faf9c6-6c34-46d7-93c4-7706a5436ed9'],
											datasetTitles: [],
											applicationStatus: 'approved',
											jsonSchema: '{omitted for brevity...}',
											questionAnswers: {
												'fullname-892140ec730145dc5a28b8fe139c2876': 'James Smith',
												'jobtitle-ff1d692a04b4bb9a2babe9093339136f': 'Consultant',
												'organisation-65c06905b8319ffa29919732a197d581': 'Consulting Inc.',
											},
											publisher: 'OTHER > HEALTH DATA RESEARCH UK',
											_id: '60142c5b4316a0e0fcd47c56',
											version: 1,
											userId: 9190228196797084,
											schemaId: '5f55e87e780ba204b0a98eb8',
											files: [],
											amendmentIterations: [],
											createdAt: '2021-01-29T15:40:11.943Z',
											updatedAt: '2021-02-03T14:38:22.688Z',
											__v: 0,
											projectId: '6014-2C5B-4316-A0E0-FCD4-7C56',
											dateSubmitted: '2021-01-29T16:30:27.351Z',
											dateReviewStart: '2021-02-03T14:36:22.341Z',
											dateFinalStatus: '2021-02-03T14:38:22.680Z',
											datasets: ['{omitted for brevity...}'],
											dataset: null,
											mainApplicant: {
												_id: '5f1a98861a821b4a53e44d15',
												firstname: 'James',
												lastname: 'Smith',
											},
											authors: [],
											id: '60142c5b4316a0e0fcd47c56',
											readOnly: true,
											unansweredAmendments: 0,
											answeredAmendments: 0,
											userType: 'custodian',
											activeParty: 'custodian',
											inReviewMode: false,
											reviewSections: [],
											hasRecommended: false,
											workflow: {},
										},
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
									status: {
										type: 'string',
									},
									message: {
										type: 'string',
									},
								},
							},
							examples: {
								'Not Found': {
									value: {
										status: 'error',
										message: 'Application not found.',
									},
								},
							},
						},
					},
				},
			},
		},
		put: {
			tags: ['Data Access Request'],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The unique identifier for a single Data Access Request application.',
					schema: {
						type: 'string',
						example: '5ee249426136805fbf094eef',
					},
				},
			],
			description: 'Update a single Data Access Request application.',
			requestBody: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								applicationStatus: {
									type: 'string',
								},
								applicationStatusDesc: {
									type: 'string',
								},
							},
						},
						examples: {
							'Update Application Status': {
								value: {
									applicationStatus: 'approved',
									applicationStatusDesc: 'This application meets all the requirements.',
								},
							},
						},
					},
				},
			},
			responses: {
				200: {
					description: 'Successful response containing the full, updated data access request application.',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									status: {
										type: 'string',
									},
									data: {
										type: 'object',
										properties: {
											id: {
												type: 'string',
												description: 'The unique identifier for the application.',
											},
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
											authorIds: {
												type: 'array',
												items: {
													type: 'integer',
												},
												description:
													"An array of values correlating to specific user's via their numeric identifiers.  An author is also known as a contributor to an application and can view, edit or submit.",
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
											applicationStatus: {
												type: 'string',
												enum: ['inProgress', 'submitted', 'inReview', 'approved', 'rejected', 'approved with conditions'],
												description: 'The current status of the application.',
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
											publisher: {
												type: 'string',
												description: 'The name of the Custodian that holds the dataset and is processing the application.',
											},
											publisherObj: {
												type: 'object',
												description: 'The object containing details regarding the Custodian/publisher relating to the application.',
											},
											userId: {
												type: 'integer',
												description:
													'The unique identifier that correlates to the user account of the main applicant.  This is always the user that started the application.',
											},
											schemaId: {
												type: 'string',
												description: 'The unique identifier that correlates to the schema from which the application form was generated.',
											},
											files: {
												type: 'array',
												items: {
													type: 'object',
												},
												description:
													'An array containing the links to files that have been uploaded to the application form and are held within the Gateway ecosystem.',
											},
											amendmentIterations: {
												type: 'array',
												items: {
													type: 'object',
												},
												description:
													'An array containing an object with details for each iteration the application has passed through.  An iteration is defined as an application which has been returned by the Custodian for correction, corrected by the applicant(s) and resubmitted.  The object contains dates that the application was returned, and resubmitted as well as reference to any questions that were highlighted for amendment.',
											},
											createdAt: {
												type: 'string',
												description: 'The date and time that the application was started.',
											},
											updatedAt: {
												type: 'string',
												description: 'The date and time that the application was last updated by any party.',
											},
											projectId: {
												type: 'string',
												description:
													'The unique identifier for the application converted to a more human friendly format in uppercase and hypenated.',
											},
											dateSubmitted: {
												type: 'string',
												description:
													'The date and time that the application was originally submitted by the applicant(s) to the Custodian for review.',
											},
											dateReviewStart: {
												type: 'string',
												description:
													'The date and time that the review process was commenced by a Custodian manager.  The review starts from the moment the manager opens the application to triage it.',
											},
											dateFinalStatus: {
												type: 'string',
												description:
													'The date and time that the Custodian triggered a status change to the application once a final decision was made.  E.g. when application was approved.  This date can be used in conjunction with the dateReviewStart date to calculate the length of time the Custodian took to make a decision through their review process.',
											},
											datasets: {
												type: 'array',
												items: {
													type: 'object',
												},
												description:
													'An array containing the full metadata for each of the datasets that have been applied for through this application.',
											},
											mainApplicant: {
												type: 'object',
												description:
													'An object containing the details of the main applicant of the application as referenced by the userId field.',
											},
											authors: {
												type: 'array',
												items: {
													type: 'object',
												},
												description:
													'An array containing the details of the contributors of the application as referenced by the authorIds field.',
											},
											readOnly: {
												type: 'boolean',
												description:
													'A value to indicate if the requesting party is able to modify the application in its present state.  For example, this will be false for a Custodian, but true for applicants if the applicant(s) are working on resubmitting the application following a request for amendments.',
											},
											unansweredAmendments: {
												type: 'integer',
												description:
													'The number of amendments that have been requested by the Custodian in the current amendment iteration.',
											},
											answeredAmendments: {
												type: 'integer',
												description:
													'The number of requested amendments that the applicant(s) have fixed in the current amendment iteration.',
											},
											userType: {
												type: 'string',
												enum: ['custodian', 'applicant'],
												description:
													'The type of user that has requested the Data Access Request application based on their permissions.  It is either an applicant or a Custodian user.',
											},
											activeParty: {
												type: 'string',
												enum: ['custodian', 'applicant'],
												description:
													'The party that is currently handling the application.  This is the applicant during presubmission, then the Custodian following submission.  The active party then fluctuates between parties during amendment iterations.',
											},
											inReviewMode: {
												type: 'boolean',
												description:
													'A flag to indicate if the current user is a reviewer of the application.  This value will be false unless the requesting user is an assigned reviewer to a currently active workflow step.  When this value is true, the requesting user is able to recommend approval or rejection of the application.',
											},
											reviewSections: {
												type: 'array',
												items: {
													type: 'string',
												},
												description:
													"An array containing the sections of the application form that the current user is required to review if they are a reviewer of the current workflow step that the application is in.  E.g. ['Safe People','Safe Data']",
											},
											hasRecommended: {
												type: 'boolean',
												description:
													'A flag to indicate if the current user as a reviewer of the current workflow phase has submitted their recommendation for approval or rejection based on their review of the review sections assigned to them.',
											},
											workflow: {
												type: 'object',
												description:
													'The full details of the workflow that has been assigned to the Data Access Request application.  This includes information such as the review phases that the application will pass through and associated metadata.',
											},
										},
									},
								},
							},
							examples: {
								'Approved Application': {
									value: {
										status: 'success',
										data: {
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
											authorIds: [],
											datasetIds: ['d5faf9c6-6c34-46d7-93c4-7706a5436ed9'],
											datasetTitles: [],
											applicationStatus: 'approved',
											jsonSchema: '{omitted for brevity...}',
											questionAnswers: {
												'fullname-892140ec730145dc5a28b8fe139c2876': 'James Smith',
												'jobtitle-ff1d692a04b4bb9a2babe9093339136f': 'Consultant',
												'organisation-65c06905b8319ffa29919732a197d581': 'Consulting Inc.',
											},
											publisher: 'OTHER > HEALTH DATA RESEARCH UK',
											_id: '60142c5b4316a0e0fcd47c56',
											version: 1,
											userId: 9190228196797084,
											schemaId: '5f55e87e780ba204b0a98eb8',
											files: [],
											amendmentIterations: [],
											createdAt: '2021-01-29T15:40:11.943Z',
											updatedAt: '2021-02-03T14:38:22.688Z',
											__v: 0,
											projectId: '6014-2C5B-4316-A0E0-FCD4-7C56',
											dateSubmitted: '2021-01-29T16:30:27.351Z',
											dateReviewStart: '2021-02-03T14:36:22.341Z',
											dateFinalStatus: '2021-02-03T14:38:22.680Z',
											datasets: ['{omitted for brevity...}'],
											dataset: null,
											mainApplicant: {
												_id: '5f1a98861a821b4a53e44d15',
												firstname: 'James',
												lastname: 'Smith',
											},
											authors: [],
											id: '60142c5b4316a0e0fcd47c56',
											readOnly: true,
											unansweredAmendments: 0,
											answeredAmendments: 0,
											userType: 'custodian',
											activeParty: 'custodian',
											inReviewMode: false,
											reviewSections: [],
											hasRecommended: false,
											workflow: {},
										},
									},
								},
							},
						},
					},
				},
				401: {
					description: 'Unauthorised attempt to update an application.',
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
										status: 'error',
										message: 'Unauthorised to perform this update.',
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
									status: {
										type: 'string',
									},
									message: {
										type: 'string',
									},
								},
							},
							examples: {
								'Not Found': {
									value: {
										status: 'error',
										message: 'Application not found.',
									},
								},
							},
						},
					},
				},
			},
		},
		patch: {
			summary: 'Update a users question answers for access request.',
			security: [
				{
					cookieAuth: [],
				},
			],
			tags: ['Data Access Request'],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					description: 'The ID of the datset',
					schema: {
						type: 'string',
						example: '5ee249426136805fbf094eef',
					},
				},
			],
			requestBody: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								questionAnswers: {
									type: 'object',
								},
							},
						},
						examples: {
							0: {
								value: '{\n    "firstName": "Roger"\n}',
							},
						},
					},
				},
			},
			responses: {
				200: {
					description: 'OK',
				},
			},
		},
	},
	'/api/v1/data-access-request/{datasetID}': {
		get: {
			summary: 'Returns access request template.',
			security: [
				{
					cookieAuth: [],
				},
			],
			tags: ['Data Access Request'],
			parameters: [
				{
					in: 'path',
					name: 'datasetID',
					required: true,
					description: 'The ID of the datset',
					schema: {
						type: 'string',
						example: '6efbc62f-6ebb-4f18-959b-1ec6fd0cc6fb',
					},
				},
			],
			responses: {
				200: {
					description: 'OK',
				},
			},
		},
	},
};
