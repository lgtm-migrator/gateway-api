import emailGenerator from '../utilities/emailGenerator.util';
import { DataRequestModel } from './datarequest.model';
import { Data as ToolModel } from '../tool/data.model';
import { DataRequestSchemaModel } from './datarequest.schemas.model';
import helper from '../utilities/helper.util';
import _ from 'lodash';
import mongoose from 'mongoose';
import { UserModel } from '../user/user.model';
import inputSanitizer from '../utilities/inputSanitizer';
import moment from 'moment';

const bpmController = require('../bpmnworkflow/bpmnworkflow.controller');

const notificationBuilder = require('../utilities/notificationBuilder');
const userTypes = {
	CUSTODIAN: 'custodian',
	APPLICANT: 'applicant',
};

module.exports = {
	//GET api/v1/data-access-request
	getAccessRequestsByUser: async (req, res) => {
		try {
			// 1. Deconstruct the
			let { id: userId } = req.user;
			// 2. Find all data access request applications created with single dataset version
			let singleDatasetApplications = await DataRequestModel.find({
				$and: [
					{
						$or: [
							{ userId: parseInt(userId) },
							{ authorIds: userId },
						],
					},
					{ dataSetId: { $ne: null } },
				],
			}).populate('dataset mainApplicant');
			// 3. Find all data access request applications created with multi dataset version
			let multiDatasetApplications = await DataRequestModel.find({
				$and: [
					{
						$or: [
							{ userId: parseInt(userId) },
							{ authorIds: userId },
						],
					},
					{
						$and: [{ datasetIds: { $ne: [] } }, { datasetIds: { $ne: null } }],
					},
				],
			}).populate('datasets mainApplicant');
			// 4. Return all users applications combined
			const applications = [
				...singleDatasetApplications,
				...multiDatasetApplications,
	  ];
	  
      // 5. Append project name and applicants
      let modifiedApplications = [...applications].map((app) => {
        return module.exports.createApplicationDTO(app.toObject());
	  }).sort((a, b) => b.updatedAt - a.updatedAt);

      let avgDecisionTime = module.exports.calculateAvgDecisionTime(applications);

      // 6. Return payload
			return res.status(200).json({ success: true, data: modifiedApplications, avgDecisionTime });
		} catch(error) {
      console.error(error);
			return res.status(500).json({
				success: false,
				message: 'An error occurred searching for user applications',
			});
		}
	},

	//GET api/v1/data-access-request/:requestId
	getAccessRequestById: async (req, res) => {
		try {
			// 1. Get dataSetId from params
			let {
				params: { requestId },
			} = req;
			// 2. Find the matching record and include attached datasets records with publisher details
			let accessRecord = await DataRequestModel.findOne({
				_id: requestId,
			}).populate({ path: 'mainApplicant', select: 'firstname lastname -id'})
			.populate({
				path: 'datasets dataset authors',
				populate: { path: 'publisher', populate: { path: 'team' } },
			});
			// 3. If no matching application found, return 404
			if (!accessRecord) {
				return res
					.status(404)
					.json({ status: 'error', message: 'Application not found.' });
			}
			// 4. Ensure single datasets are mapped correctly into array
			if (_.isEmpty(accessRecord.datasets)) {
				accessRecord.datasets = [accessRecord.dataset];
			}
			// 5. Check if requesting user is custodian member or applicant/contributor
			let {
				authorised,
				userType,
			} = module.exports.getUserPermissionsForApplication(
				accessRecord,
				req.user.id,
				req.user._id
			);
			let readOnly = true;
			if (!authorised) {
				return res
					.status(401)
					.json({ status: 'failure', message: 'Unauthorised' });
			}
			// 6. Set edit mode for applicants who have not yet submitted
			if (
				userType === userTypes.APPLICANT &&
				accessRecord.applicationStatus === 'inProgress'
			) {
				readOnly = false;
			}
			// 7. Return application form
			return res.status(200).json({
				status: 'success',
				data: {
					...accessRecord.toObject(),
					jsonSchema: JSON.parse(accessRecord.jsonSchema),
					questionAnswers: JSON.parse(accessRecord.questionAnswers),
					aboutApplication: JSON.parse(accessRecord.aboutApplication),
					datasets: accessRecord.datasets,
					readOnly,
					userType,
					projectId: accessRecord.projectId || helper.generateFriendlyId(accessRecord._id)
				},
			});
		} catch (err) {
			console.error(err.message);
			res.status(500).json({ status: 'error', message: err });
		}
	},

	//GET api/v1/data-access-request/dataset/:datasetId
	getAccessRequestByUserAndDataset: async (req, res) => {
		let accessRecord;
		let data = {};
		let dataset;
		try {
			// 1. Get dataSetId from params
			let {
				params: { dataSetId },
			} = req;
			// 2. Get the userId
			let { id: userId, firstname, lastname } = req.user;
			// 3. Find the matching record
			accessRecord = await DataRequestModel.findOne({
				dataSetId,
				userId,
				applicationStatus: 'inProgress',
			}).populate({ path: 'mainApplicant', select: 'firstname lastname -id -_id'})
			// 4. Get dataset
			dataset = await ToolModel.findOne({ datasetid: dataSetId }).populate(
				'publisher'
			);
			// 5. If no record create it and pass back
			if (!accessRecord) {
				if (!dataset) {
					return res
						.status(500)
						.json({ status: 'error', message: 'No dataset available.' });
				}
				let {
					datasetfields: { publisher = '' },
				} = dataset;

				// 1. GET the template from the custodian
				const accessRequestTemplate = await DataRequestSchemaModel.findOne({
					$or: [{ dataSetId }, { publisher }, { dataSetId: 'default' }],
					status: 'active',
				}).sort({ createdAt: -1 });

				if (!accessRequestTemplate) {
					return res.status(400).json({
						status: 'error',
						message: 'No Data Access request schema.',
					});
				}
				// 2. Build up the accessModel for the user
				let { jsonSchema, version } = accessRequestTemplate;

				// 3. create new DataRequestModel
				let record = new DataRequestModel({
					version,
					userId,
					dataSetId,
					jsonSchema,
					publisher,
					questionAnswers: '{}',
					aboutApplication: '{}',
					applicationStatus: 'inProgress',
				});
				// 4. save record
				const newApplication = await record.save();
				newApplication.projectId = helper.generateFriendlyId(
					newApplication._id
				);
				await newApplication.save();

				// 5. return record
				data = { ...newApplication._doc, mainApplicant: { firstname, lastname } };
			} else {
				data = { ...accessRecord.toObject() };
			}

			return res.status(200).json({
				status: 'success',
				data: {
					...data,
					jsonSchema: JSON.parse(data.jsonSchema),
					questionAnswers: JSON.parse(data.questionAnswers),
					aboutApplication: JSON.parse(data.aboutApplication),
					dataset,
					projectId: data.projectId || helper.generateFriendlyId(data._id),
					userType: 'applicant'
				},
			});
		} catch (err) {
			console.log(err.message);
			res.status(500).json({ status: 'error', message: err });
		}
	},

	//GET api/v1/data-access-request/datasets/:datasetIds
	getAccessRequestByUserAndMultipleDatasets: async (req, res) => {
		let accessRecord;
		let data = {};
		let datasets = [];
		try {
			// 1. Get datasetIds from params
			let {
				params: { datasetIds },
			} = req;
			let arrDatasetIds = datasetIds.split(',');
			// 2. Get the userId
			let { id: userId, firstname, lastname } = req.user;
			// 3. Find the matching record
			accessRecord = await DataRequestModel.findOne({
				datasetIds: { $all: arrDatasetIds },
				userId,
				applicationStatus: 'inProgress',
			}).populate({ path: 'mainApplicant', select: 'firstname lastname -id -_id'}).sort({ createdAt: 1 });
			// 4. Get datasets
			datasets = await ToolModel.find({
				datasetid: { $in: arrDatasetIds },
			}).populate('publisher');
			// 5. If no record create it and pass back
			if (!accessRecord) {
				if (_.isEmpty(datasets)) {
					return res
						.status(500)
						.json({ status: 'error', message: 'No datasets available.' });
				}
				let {
					datasetfields: { publisher = '' },
				} = datasets[0];

				// 1. GET the template from the custodian or take the default (Cannot have dataset specific question sets for multiple datasets)
				const accessRequestTemplate = await DataRequestSchemaModel.findOne({
					$or: [{ publisher }, { dataSetId: 'default' }],
					status: 'active',
				}).sort({ createdAt: -1 });
				// 2. Ensure a question set was found
				if (!accessRequestTemplate) {
					return res.status(400).json({
						status: 'error',
						message: 'No Data Access request schema.',
					});
				}
				// 3. Build up the accessModel for the user
				let { jsonSchema, version } = accessRequestTemplate;
				// 4. Create new DataRequestModel
				let record = new DataRequestModel({
					version,
					userId,
					datasetIds: arrDatasetIds,
					jsonSchema,
					publisher,
					questionAnswers: '{}',
					aboutApplication: '{}',
					applicationStatus: 'inProgress',
				});
				// 4. save record
				const newApplication = await record.save();
				newApplication.projectId = helper.generateFriendlyId(
					newApplication._id
				);
				await newApplication.save();
				// 5. return record
				data = { ...newApplication._doc, mainApplicant: { firstname, lastname } };
			} else {
				data = { ...accessRecord.toObject() };
			}

			return res.status(200).json({
				status: 'success',
				data: {
					...data,
					jsonSchema: JSON.parse(data.jsonSchema),
					questionAnswers: JSON.parse(data.questionAnswers),
					aboutApplication: JSON.parse(data.aboutApplication),
					datasets,
					projectId: data.projectId || helper.generateFriendlyId(data._id),
					userType: 'applicant'
				},
			});
		} catch (err) {
			console.log(err.message);
			res.status(500).json({ status: 'error', message: err });
		}
	},

	//PATCH api/v1/data-access-request/:id
	updateAccessRequestDataElement: async (req, res) => {
		try {
			// 1. Id is the _id object in mongoo.db not the generated id or dataset Id
			const {
				params: { id },
			} = req;
			// 2. Destructure body and update only specific fields by building a segregated non-user specified update object
			let updateObj;
			let { aboutApplication, questionAnswers } = req.body;
			if (aboutApplication) {
				let parsedObj = JSON.parse(aboutApplication);
				let updatedDatasetIds = parsedObj.selectedDatasets.map(
					(dataset) => dataset.datasetId
				);
				updateObj = { aboutApplication, datasetIds: updatedDatasetIds };
			}
			if (questionAnswers) {
				updateObj = { ...updateObj, questionAnswers };
			}
			// 3. Find data request by _id and update via body
			let accessRequestRecord = await DataRequestModel.findByIdAndUpdate(
				id,
				updateObj,
				{ new: true }
			);
			// 4. Check access record
			if (!accessRequestRecord) {
				return res
					.status(400)
					.json({ status: 'error', message: 'Data Access Request not found.' });
			}
			// 5. Return new data object
			return res.status(200).json({
				status: 'success',
				data: {
					...accessRequestRecord._doc,
					questionAnswers: JSON.parse(accessRequestRecord.questionAnswers),
				},
			});
		} catch (err) {
			console.log(err.message);
			res.status(500).json({ status: 'error', message: err });
		}
	},

	//PUT api/v1/data-access-request/:id
	updateAccessRequestById: async (req, res) => {
		try {
			// 1. Id is the _id object in MongoDb not the generated id or dataset Id
			const {
				params: { id },
			} = req;
			// 2. Get the userId
			let { _id, id: userId } = req.user;
			let applicationStatus = '', applicationStatusDesc = '';

			// 3. Find the relevant data request application
			let accessRecord = await DataRequestModel.findOne({ _id: id }).populate({
				path: 'datasets dataset mainApplicant authors',
				populate: {
					path: 'publisher additionalInfo',
					populate: {
						path: 'team',
						populate: {
							path: 'users',
							populate: {
								path: 'additionalInfo',
							},
						},
					},
				},
			});
			if (!accessRecord) {
				return res
					.status(404)
					.json({ status: 'error', message: 'Application not found.' });
			}
			// 4. Ensure single datasets are mapped correctly into array (backward compatibility for single dataset applications)
			if (_.isEmpty(accessRecord.datasets)) {
				accessRecord.datasets = [accessRecord.dataset];
			}

			// 5. Check if the user is permitted to perform update to application
			let isDirty = false, statusChange = false, contributorChange = false;
			let {
				authorised,
				userType,
			} = module.exports.getUserPermissionsForApplication(accessRecord, userId, _id);

			if (!authorised) {
				return res.status(401).json({
					status: 'error',
					message: 'Unauthorised to perform this update.',
				});
			}

			let { authorIds: currentAuthors } = accessRecord;
			let newAuthors = [];

			// 6. Extract new application status and desc to save updates
			// If custodian, allow updated to application status and description
			if (userType === userTypes.CUSTODIAN) {
				({ applicationStatus, applicationStatusDesc } = req.body);
				const finalStatuses = [
					'submitted',
					'approved',
					'rejected',
					'approved with conditions',
					'withdrawn',
				];
				if (
					applicationStatus &&
					applicationStatus !== accessRecord.applicationStatus
				) {
					accessRecord.applicationStatus = applicationStatus;

					if (finalStatuses.includes(applicationStatus)) {
						accessRecord.dateFinalStatus = new Date()
					}
					isDirty = true;
					statusChange = true;
				}
				if (
					applicationStatusDesc &&
					applicationStatusDesc !== accessRecord.applicationStatusDesc
				) {
					accessRecord.applicationStatusDesc = inputSanitizer.removeNonBreakingSpaces(applicationStatusDesc);
					isDirty = true;
				}
				// If applicant, allow update to contributors/authors
			} else if (userType === userTypes.APPLICANT) {
				// Extract new contributor/author IDs
				if (req.body.authorIds) {
					({ authorIds:newAuthors } = req.body);

					// Perform comparison between new and existing authors to determine if an update is required
					if (newAuthors && !helper.arraysEqual(newAuthors, currentAuthors)) {
						accessRecord.authorIds = newAuthors;
						isDirty = true;
						contributorChange = true;
					}
				}
			}

			// 7. If a change has been made, notify custodian and main applicant
			if (isDirty) {
				await accessRecord.save(async (err) => {
					if(err) {
						console.error(err);
						res.status(500).json({ status: 'error', message: err });
					} else {
						// If save has succeeded - send notifications
						// Send notifications to added/removed contributors
						if(contributorChange) {
							await module.exports.createNotifications(
								'ContributorChange',
								{ newAuthors, currentAuthors },
								accessRecord,
								req.user
							);
						}
						// Send notifications to custodian team, main applicant and contributors regarding status change
						if(statusChange) {
							await module.exports.createNotifications(
								'StatusChange',
								{ applicationStatus, applicationStatusDesc },
								accessRecord,
								req.user
							);
						}
						// Update workflow process if publisher requires it
						if (accessRecord.datasets[0].publisher.workflowEnabled) {
							// Call Camunda controller to get current workflow process for application
							let response = await bpmController.getProcess(id);
							let { data = {} } = response;
							if(!_.isEmpty(data)) {
								let [obj] = data;
								let { id:taskId } = obj;

								// Call Camunda to update workflow process for application
								let { name: publisher } = accessRecord.datasets[0].publisher;
								let bmpContext = { taskId, dateSubmitted: new Date(), applicationStatus, publisher, actioner: _id, archived: false };
								await bpmController.postUpdateProcess(bmpContext);
							}
						}
					}
				});
			}

			// 8. Return application
			return res.status(200).json({
				status: 'success',
				data: accessRecord._doc,
			});
		} catch (err) {
			console.error(err.message);
			res.status(500).json({
				status: 'error',
				message: 'An error occurred updating the application status',
			});
		}
	},

	//POST api/v1/data-access-request/:id
	submitAccessRequestById: async (req, res) => {
		try {
			// 1. id is the _id object in mongoo.db not the generated id or dataset Id
			let {
				params: { id },
			} = req;
			// 2. Find the relevant data request application
			let accessRecord = await DataRequestModel.findOne({ _id: id }).populate({
				path: 'datasets dataset mainApplicant authors',
				populate: {
					path: 'publisher additionalInfo',
					populate: {
						path: 'team',
						populate: {
							path: 'users',
							populate: {
								path: 'additionalInfo',
							},
						},
					},
				},
			});
			if (!accessRecord) {
				return res
					.status(404)
					.json({ status: 'error', message: 'Application not found.' });
			}
			// 3. Ensure single datasets are mapped correctly into array (backward compatibility for single dataset applications)
			if (_.isEmpty(accessRecord.datasets)) {
				accessRecord.datasets = [accessRecord.dataset];
			}

			// 4. Update application to submitted status
			accessRecord.applicationStatus = 'submitted';
			// Check if workflow/5 Safes based application, set final status date if status will never change again
			if (!accessRecord.datasets[0].publisher.workflowEnabled) {
				accessRecord.dateFinalStatus = new Date();
			}
			let dateSubmitted = new Date();
			accessRecord.dateSubmitted = dateSubmitted;
			await accessRecord.save(async(err) => {
				if(err) {
					console.error(err);
					res.status(500).json({ status: 'error', message: err });
				} else {
					// If save has succeeded - send notifications
					// Send notifications and emails to custodian team and main applicant
					await module.exports.createNotifications('Submitted', {}, accessRecord, req.user);
					// Start workflow process if publisher requires it
					if (accessRecord.datasets[0].publisher.workflowEnabled) {
						// Call Camunda controller to start workflow for submitted application
						let { name: publisher } = accessRecord.datasets[0].publisher;
						let { _id: userId } = req.user;
						let bmpContext = { dateSubmitted, applicationStatus: 'submitted', publisher, businessKey:id, actioner: userId };
						bpmController.postCreateProcess(bmpContext);
					}
				}
			});
			// 6. Return aplication and successful response
			return res
				.status(200)
				.json({ status: 'success', data: accessRecord._doc });
		} catch (err) {
			console.log(err.message);
			res.status(500).json({ status: 'error', message: err });
		}
	},

	createNotifications: async (type, context, accessRecord, user) => {
		// Default from mail address
		const hdrukEmail = `enquiry@healthdatagateway.org`;
		// Project details from about application if 5 Safes
		let aboutApplication = JSON.parse(accessRecord.aboutApplication);
		let { projectName } = aboutApplication;
		let { projectId, _id } = accessRecord;
		if(_.isEmpty(projectId)) {
			projectId = _id;
		} 
		// Publisher details from single dataset
		let {
			datasetfields: { contactPoint, publisher },
		} = accessRecord.datasets[0];
		let datasetTitles = accessRecord.datasets
			.map((dataset) => dataset.name)
			.join(', ');
		// Main applicant (user obj)
		let {
			firstname: appFirstName,
			lastname: appLastName,
			email: appEmail,
		} = accessRecord.mainApplicant;
		// Requesting user
		let { firstname, lastname } = user;
		// Instantiate default params
		let custodianUsers = [],
			emailRecipients = [],
			options = {},
			html = '',
			authors = [];

		// Get applicants from 5 Safes form, using main applicant as fall back for single dataset applications
		let answers = JSON.parse(accessRecord.questionAnswers);
		let applicants = module.exports.extractApplicantNames(answers).join(', ');
		// Fall back for single applicant on short application form
		if (_.isEmpty(applicants)) {
			applicants = `${appFirstName} ${appLastName}`;
		}
		// Get authors/contributors (user obj)
		if (!_.isEmpty(accessRecord.authors)) {
			authors = accessRecord.authors.map((author) => {
				let { firstname, lastname, email, id } = author;
				return { firstname, lastname, email, id };
			});
		}

		switch (type) {
			// DAR application status has been updated
			case 'StatusChange':
				// 1. Create notifications
				// Custodian team notifications
				if (
					_.has(accessRecord.datasets[0].toObject(), 'publisher.team.users')
				) {
					// Retrieve all custodian user Ids to generate notifications
					custodianUsers = [...accessRecord.datasets[0].publisher.team.users];
					let custodianUserIds = custodianUsers.map((user) => user.id);
					await notificationBuilder.triggerNotificationMessage(
						custodianUserIds,
						`${appFirstName} ${appLastName}'s Data Access Request for ${datasetTitles} was ${context.applicationStatus} by ${firstname} ${lastname}`,
						'data access request',
						accessRecord._id
					);
				}
				// Create applicant notification
				await notificationBuilder.triggerNotificationMessage(
					[accessRecord.userId],
					`Your Data Access Request for ${datasetTitles} was ${context.applicationStatus} by ${publisher}`,
					'data access request',
					accessRecord._id
				);

				// Create authors notification
				if (!_.isEmpty(authors)) {
					await notificationBuilder.triggerNotificationMessage(
						[authors.map((author) => author.id)],
						`A Data Access Request you are contributing to for ${datasetTitles} was ${context.applicationStatus} by ${publisher}`,
						'data access request',
						accessRecord._id
					);
				}

				// 2. Send emails to relevant users
				// Aggregate objects for custodian and applicant
				emailRecipients = [
					accessRecord.mainApplicant,
					...custodianUsers,
					...accessRecord.authors,
				].filter(function (user) {
					let {
						additionalInfo: { emailNotifications },
					} = user;
					return emailNotifications === true;
				});
				let { dateSubmitted } = accessRecord;
				if (!dateSubmitted) ({ updatedAt: dateSubmitted } = accessRecord);
				// Create object to pass through email data
				options = {
					id: accessRecord._id,
					applicationStatus: context.applicationStatus,
					applicationStatusDesc: context.applicationStatusDesc,
					publisher,
					projectId,
					projectName,
					datasetTitles,
					dateSubmitted,
					applicants,
				};
				// Create email body content
				html = emailGenerator.generateDARStatusChangedEmail(options);
				// Send email
				await emailGenerator.sendEmail(
					emailRecipients,
					hdrukEmail,
					`Data Access Request for ${datasetTitles} was ${context.applicationStatus} by ${publisher}`,
					html,
					true
				);
				break;
			case 'Submitted':
				// 1. Prepare data for notifications
				const emailRecipientTypes = ['applicant', 'dataCustodian'];
				// Destructure the application
				let { jsonSchema } = accessRecord;
				// Parse the schema
				let { pages, questionPanels, questionSets: questions } = JSON.parse(
					jsonSchema
				);

				// 2. Create notifications
				// Custodian notification
				if (
					_.has(accessRecord.datasets[0].toObject(), 'publisher.team.users')
				) {
					// Retrieve all custodian user Ids to generate notifications
					custodianUsers = [...accessRecord.datasets[0].publisher.team.users];
					let custodianUserIds = custodianUsers.map((user) => user.id);
					await notificationBuilder.triggerNotificationMessage(
						custodianUserIds,
						`A Data Access Request has been submitted to ${publisher} for ${datasetTitles} by ${appFirstName} ${appLastName}`,
						'data access request',
						accessRecord._id
					);
				}
				// Applicant notification
				await notificationBuilder.triggerNotificationMessage(
					[accessRecord.userId],
					`Your Data Access Request for ${datasetTitles} was successfully submitted to ${publisher}`,
					'data access request',
					accessRecord._id
				);
				// Contributors/authors notification
				if (!_.isEmpty(authors)) {
					await notificationBuilder.triggerNotificationMessage(
						accessRecord.authors.map((author) => author.id),
						`A Data Access Request you are contributing to for ${datasetTitles} was successfully submitted to ${publisher} by ${firstname} ${lastname}`,
						'data access request',
						accessRecord._id
					);
				}
				// 3. Send emails to custodian and applicant
				// Create object to pass to email generator
				options = {
					userType: '',
					userEmail: appEmail,
					custodianEmail: contactPoint,
					publisher,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
				};
				// Iterate through the recipient types
				for (let emailRecipientType of emailRecipientTypes) {
					// Send emails to custodian team members who have opted in to email notifications
					if (emailRecipientType === 'dataCustodian') {
						emailRecipients = [...custodianUsers].filter(function (user) {
							let {
								additionalInfo: { emailNotifications },
							} = user;
							return emailNotifications === true;
						});
					} else {
						// Send email to main applicant and contributors if they have opted in to email notifications
						emailRecipients = [
							accessRecord.mainApplicant,
							...accessRecord.authors,
						].filter(function (user) {
							let {
								additionalInfo: { emailNotifications },
							} = user;
							return emailNotifications === true;
						});
					}
					// Establish email context object
					options = { ...options, userType: emailRecipientType };
					// Build email template
					html = await emailGenerator.generateEmail(
						questions,
						pages,
						questionPanels,
						answers,
						options
					);
					// Send email
					if (!_.isEmpty(emailRecipients)) {
						await emailGenerator.sendEmail(
							emailRecipients,
							hdrukEmail,
							`Data Access Request has been submitted to ${publisher} for ${datasetTitles}`,
							html,
							true
						);
					}
				}
				break;
			case 'ContributorChange':
				// 1. Deconstruct authors array from context to compare with existing Mongo authors
				const { newAuthors, currentAuthors } = context;
				// 2. Determine authors who have been removed
				let addedAuthors = [...newAuthors]
					.filter((author) => !currentAuthors.includes(author));
				// 3. Determine authors who have been added
				let removedAuthors = [...currentAuthors]
					.filter((author) => !newAuthors.includes(author));
				// 4. Create emails and notifications for added/removed contributors
				// Set required data for email generation
				options = {
					id: accessRecord._id,
					projectName,
					projectId,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
					actioner: `${firstname} ${lastname}`,
					applicants,
				};
				// Notifications for added contributors
				if (!_.isEmpty(addedAuthors)) {
					options.change = 'added';
					html = await emailGenerator.generateContributorEmail(options);
					// Find related user objects and filter out users who have not opted in to email communications
					let addedUsers = await UserModel.find({
						id: { $in: addedAuthors },
					}).populate('additionalInfo');
					emailRecipients = addedUsers.filter(function (user) {
						let {
							additionalInfo: { emailNotifications },
						} = user;
						return emailNotifications === true;
					});

					await notificationBuilder.triggerNotificationMessage(
						addedUsers.map((user) => user.id),
						`You have been added as a contributor for a Data Access Request to ${publisher} by ${firstname} ${lastname}`,
						'data access request',
						accessRecord._id
					);
					await emailGenerator.sendEmail(
						emailRecipients,
						hdrukEmail,
						`You have been added as a contributor for a Data Access Request to ${publisher} by ${firstname} ${lastname}`,
						html,
						true
					);
				}
				// Notifications for removed contributors
				if (!_.isEmpty(removedAuthors)) {
					options.change = 'removed';
					html = await emailGenerator.generateContributorEmail(options);
					// Find related user objects and filter out users who have not opted in to email communications
					let removedUsers = await UserModel.find({
						id: { $in: removedAuthors },
					}).populate('additionalInfo');
					emailRecipients = removedUsers.filter(function (user) {
						let {
							additionalInfo: { emailNotifications },
						} = user;
						return emailNotifications === true;
					});

					await notificationBuilder.triggerNotificationMessage(
						removedUsers.map((user) => user.id),
						`You have been removed as a contributor from a Data Access Request to ${publisher} by ${firstname} ${lastname}`,
						'data access request unlinked',
						accessRecord._id
					);
					await emailGenerator.sendEmail(
						emailRecipients,
						hdrukEmail,
						`You have been removed as a contributor from a Data Access Request to ${publisher} by ${firstname} ${lastname}`,
						html,
						true
					);
				}
				break;
		}
	},

	getUserPermissionsForApplication: (application, userId, _id) => {
		try {
			let authorised = false,
				userType = '',
				members = [];
			// Return default unauthorised with no user type if incorrect params passed
			if (!application || !userId || !_id) {
				return { authorised, userType };
			}
			// Check if the user is a custodian team member and assign permissions if so
			if (_.has(application.datasets[0].toObject(), 'publisher.team.members')) {
				({ members } = application.datasets[0].publisher.team.toObject());
				if (
					members.some((el) => el.memberid.toString() === _id.toString())
				) {
					userType = userTypes.CUSTODIAN;
					authorised = true;
				}
			}
			// If user is not authenticated as a custodian, check if they are an author or the main applicant
			if (_.isEmpty(userType)) {
				if (application.authorIds.includes(userId) || application.userId === userId) {
					userType = userTypes.APPLICANT;
					authorised = true;
				}
			}
			return { authorised, userType };
		} catch (error) {
			console.error(error);
			return { authorised: false, userType: '' };
		}
	},

	extractApplicantNames: (questionAnswers) => {
		let fullnames = [], autoCompleteLookups = {"fullname": ['email']};
		// spread questionAnswers to new var
		let qa = { ...questionAnswers };
		// get object keys of questionAnswers
		let keys = Object.keys(qa);
		// loop questionAnswer keys
		for (const key of keys) {
			// get value of key
			let value = qa[key];
			// split the key up for unique purposes
			let [qId] = key.split('_');
			// check if key in lookup
			let lookup = autoCompleteLookups[`${qId}`];
			// if key exists and it has an object do relevant data setting
			if (typeof lookup !== 'undefined' && typeof value === 'object') {
				switch (qId) {
					case 'fullname':
						fullnames.push(value.name);
						break;
				}
			}
		}
		return fullnames;
  },
  
  createApplicationDTO: (app) => {
      let projectName = '';
      let applicants = '';

      // Ensure backward compatibility with old single dataset DARs
      if(_.isEmpty(app.datasets) || _.isUndefined(app.datasets)) {
        app.datasets = [app.dataset];
        app.datasetIds = [app.datasetid];
      }
      let { datasetfields : { publisher }, name} = app.datasets[0];
      let { aboutApplication, questionAnswers } = app;

      if (aboutApplication) {
        let aboutObj = JSON.parse(aboutApplication);
        ({ projectName } = aboutObj);
      }
      if(_.isEmpty(projectName)) {
        projectName = `${publisher} - ${name}`
      }
      if (questionAnswers) {
        let questionAnswersObj = JSON.parse(questionAnswers);
        applicants = module.exports.extractApplicantNames(questionAnswersObj).join(', ');
      }
      if(_.isEmpty(applicants)) {
        let { firstname, lastname } = app.mainApplicant;
        applicants = `${firstname} ${lastname}`;
	  }
      return { ...app, projectName, applicants, publisher }
  },

  calculateAvgDecisionTime: (applications) => {
    // Extract dateSubmitted dateFinalStatus
    let decidedApplications = applications.filter((app) => {
      let { dateSubmitted = '', dateFinalStatus = '' } = app;
      return (!_.isEmpty(dateSubmitted.toString()) && !_.isEmpty(dateFinalStatus.toString()));
    });
	// Find difference between dates in milliseconds
	if(!_.isEmpty(decidedApplications)) {
		let totalDecisionTime = decidedApplications.reduce((count, current) => {
		let { dateSubmitted, dateFinalStatus } = current;
		let start = moment(dateSubmitted);
		let end = moment(dateFinalStatus);
		let diff = end.diff(start, 'seconds');
		count += diff;
		return count;
		}, 0);
		// Divide by number of items
		if(totalDecisionTime > 0) 
				return parseInt(totalDecisionTime/decidedApplications.length/86400);
	}	
    return 0;
  }
};
