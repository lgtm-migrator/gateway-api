import emailGenerator from '../utilities/emailGenerator.util';
import { DataRequestModel } from './datarequest.model';
import { WorkflowModel } from '../workflow/workflow.model';
import { Data as ToolModel } from '../tool/data.model';
import { DataRequestSchemaModel } from './datarequest.schemas.model';
import workflowController from '../workflow/workflow.controller';
import helper from '../utilities/helper.util';
import _ from 'lodash';
import { UserModel } from '../user/user.model';
import inputSanitizer from '../utilities/inputSanitizer';
import moment from 'moment';
import mongoose from 'mongoose';

const bpmController = require('../bpmnworkflow/bpmnworkflow.controller');
const teamController = require('../team/team.controller');
const notificationBuilder = require('../utilities/notificationBuilder');
const hdrukEmail = `enquiry@healthdatagateway.org`;
const userTypes = {
	CUSTODIAN: 'custodian',
	APPLICANT: 'applicant',
};
const notificationTypes = {
	STATUSCHANGE: 'StatusChange',
	SUBMITTED: 'Submitted',
	CONTRIBUTORCHANGE: 'ContributorChange',
	STEPOVERRIDE: 'StepOverride',
	REVIEWSTEPSTART: 'ReviewStepStart',
	FINALDECISIONREQUIRED: 'FinalDecisionRequired',
	DEADLINEWARNING: 'DeadlineWarning',
	DEADLINEPASSED: 'DeadlinePassed',
};
const applicationStatuses = {
	SUBMITTED: 'submitted',
	INPROGRESS: 'inProgress',
	INREVIEW: 'inReview',
	APPROVED: 'approved',
	REJECTED: 'rejected',
	APPROVEDWITHCONDITIONS: 'approved with conditions',
	WITHDRAWN: 'withdrawn',
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
						$or: [{ userId: parseInt(userId) }, { authorIds: userId }],
					},
					{ dataSetId: { $ne: null } },
				],
			}).populate('dataset mainApplicant');
			// 3. Find all data access request applications created with multi dataset version
			let multiDatasetApplications = await DataRequestModel.find({
				$and: [
					{
						$or: [{ userId: parseInt(userId) }, { authorIds: userId }],
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
			let modifiedApplications = [...applications]
				.map((app) => {
					return module.exports.createApplicationDTO(app.toObject());
				})
				.sort((a, b) => b.updatedAt - a.updatedAt);

			let avgDecisionTime = module.exports.calculateAvgDecisionTime(
				applications
			);

			// 6. Return payload
			return res
				.status(200)
				.json({ success: true, data: modifiedApplications, avgDecisionTime });
		} catch (error) {
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
			}).populate([
				{ path: 'mainApplicant', select: 'firstname lastname -id' },
				{
					path: 'datasets dataset authors',
					populate: { path: 'publisher', populate: { path: 'team' } },
				},
				{ path: 'workflow.steps.reviewers', select: 'firstname lastname' },
			]);
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
				accessRecord.applicationStatus === applicationStatuses.INPROGRESS
			) {
				readOnly = false;
			}
			// 7. Set the review mode if user is a custodian reviewing the current step
			let {
				inReviewMode,
				reviewSections,
				hasRecommended,
			} = workflowController.getReviewStatus(accessRecord, req.user._id);
			// 8. Get the workflow/voting status
			let workflow = workflowController.getWorkflowStatus(
				accessRecord.toObject()
			);
			// 9. Check if the current user can override the current step
			if (_.has(accessRecord.datasets[0].toObject(), 'publisher.team')) {
				let isManager = teamController.checkTeamPermissions(
					teamController.roleTypes.MANAGER,
					accessRecord.datasets[0].publisher.team.toObject(),
					req.user._id
				);
				// Set the workflow override capability if there is an active step and user is a manager
				if (!_.isEmpty(workflow)) {
					workflow.canOverrideStep = !workflow.isCompleted && isManager;
				}
			}
			// 10. Return application form
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
					projectId:
						accessRecord.projectId ||
						helper.generateFriendlyId(accessRecord._id),
					inReviewMode,
					reviewSections,
					hasRecommended,
					workflow,
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
				applicationStatus: applicationStatuses.INPROGRESS,
			}).populate({
				path: 'mainApplicant',
				select: 'firstname lastname -id -_id',
			});
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
					applicationStatus: applicationStatuses.INPROGRESS,
				});
				// 4. save record
				const newApplication = await record.save();
				newApplication.projectId = helper.generateFriendlyId(
					newApplication._id
				);
				await newApplication.save();

				// 5. return record
				data = {
					...newApplication._doc,
					mainApplicant: { firstname, lastname },
				};
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
					userType: userTypes.APPLICANT,
					inReviewMode: false,
					reviewSections: [],
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
				applicationStatus: applicationStatuses.INPROGRESS,
			})
				.populate({
					path: 'mainApplicant',
					select: 'firstname lastname -id -_id',
				})
				.sort({ createdAt: 1 });
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
					applicationStatus: applicationStatuses.INPROGRESS,
				});
				// 4. save record
				const newApplication = await record.save();
				newApplication.projectId = helper.generateFriendlyId(
					newApplication._id
				);
				await newApplication.save();
				// 5. return record
				data = {
					...newApplication._doc,
					mainApplicant: { firstname, lastname },
				};
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
					userType: userTypes.APPLICANT,
					inReviewMode: false,
					reviewSections: [],
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
			let { aboutApplication, questionAnswers, jsonSchema = '' } = req.body;
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

			if (!_.isEmpty(jsonSchema)) {
				updateObj = { ...updateObj, jsonSchema };
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
			let applicationStatus = '',
				applicationStatusDesc = '';

			// 3. Find the relevant data request application
			let accessRecord = await DataRequestModel.findOne({ _id: id }).populate([
				{
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
				},
				{
					path: 'publisherObj',
					populate: {
						path: 'team',
					},
				},
				{
					path: 'workflow.steps.reviewers',
					select: 'id email',
				},
			]);
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
			let isDirty = false,
				statusChange = false,
				contributorChange = false;
			let {
				authorised,
				userType,
			} = module.exports.getUserPermissionsForApplication(
				accessRecord,
				userId,
				_id
			);

			if (!authorised) {
				return res.status(401).json({
					status: 'error',
					message: 'Unauthorised to perform this update.',
				});
			}

			let { authorIds: currentAuthors } = accessRecord;
			let newAuthors = [];

			// 6. Extract new application status and desc to save updates
			if (userType === userTypes.CUSTODIAN) {
				// Only a custodian manager can set the final status of an application
				authorised = false;
				let team = {};
				if (_.isNull(accessRecord.publisherObj)) {
					({ team = {} } = accessRecord.datasets[0].publisher.toObject());
				} else {
					({ team = {} } = accessRecord.publisherObj.toObject());
				}

				if (!_.isEmpty(team)) {
					authorised = teamController.checkTeamPermissions(
						teamController.roleTypes.MANAGER,
						team,
						_id
					);
				}

				if (!authorised) {
					return res
						.status(401)
						.json({ status: 'failure', message: 'Unauthorised' });
				}
				// Extract params from body
				({ applicationStatus, applicationStatusDesc } = req.body);
				const finalStatuses = [
					applicationStatuses.SUBMITTED,
					applicationStatuses.APPROVED,
					applicationStatuses.REJECTED,
					applicationStatuses.APPROVEDWITHCONDITIONS,
					applicationStatuses.WITHDRAWN,
				];
				if (applicationStatus) {
					accessRecord.applicationStatus = applicationStatus;

					if (finalStatuses.includes(applicationStatus)) {
						accessRecord.dateFinalStatus = new Date();
					}
					isDirty = true;
					statusChange = true;

					// Update any attached workflow in Mongo to show workflow is finished
					let { workflow = {} } = accessRecord;
					if (!_.isEmpty(workflow)) {
						accessRecord.workflow.steps = accessRecord.workflow.steps.map(
							(step) => {
								let updatedStep = {
									...step.toObject(),
									active: false,
								};
								if (step.active) {
									updatedStep = {
										...updatedStep,
										endDateTime: new Date(),
										completed: true,
									};
								}
								return updatedStep;
							}
						);
					}
				}
				if (applicationStatusDesc) {
					accessRecord.applicationStatusDesc = inputSanitizer.removeNonBreakingSpaces(
						applicationStatusDesc
					);
					isDirty = true;
				}
				// If applicant, allow update to contributors/authors
			} else if (userType === userTypes.APPLICANT) {
				// Extract new contributor/author IDs
				if (req.body.authorIds) {
					({ authorIds: newAuthors } = req.body);

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
					if (err) {
						console.error(err);
						res.status(500).json({ status: 'error', message: err });
					} else {
						// If save has succeeded - send notifications
						// Send notifications to added/removed contributors
						if (contributorChange) {
							await module.exports.createNotifications(
								notificationTypes.CONTRIBUTORCHANGE,
								{ newAuthors, currentAuthors },
								accessRecord,
								req.user
							);
						}
						if (statusChange) {
							// Send notifications to custodian team, main applicant and contributors regarding status change
							await module.exports.createNotifications(
								notificationTypes.STATUSCHANGE,
								{ applicationStatus, applicationStatusDesc },
								accessRecord,
								req.user
							);
							// Ensure Camunda ends workflow processes given that manager has made final decision
							let {
								name: dataRequestPublisher,
							} = accessRecord.datasets[0].publisher;
							let bpmContext = {
								dataRequestStatus: applicationStatus,
								dataRequestManagerId: _id.toString(),
								dataRequestPublisher,
								managerApproved: true,
								businessKey: id,
							};
							bpmController.postManagerApproval(bpmContext);
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

	//PUT api/v1/data-access-request/:id/assignworkflow
	assignWorkflow: async (req, res) => {
		try {
			// 1. Get the required request params
			const {
				params: { id },
			} = req;
			let { _id: userId } = req.user;
			let { workflowId = '' } = req.body;
			if (_.isEmpty(workflowId)) {
				return res.status(400).json({
					success: false,
					message:
						'You must supply the unique identifier to assign a workflow to this application',
				});
			}
			// 2. Retrieve DAR from database
			let accessRecord = await DataRequestModel.findOne({ _id: id }).populate({
				path: 'datasets dataset mainApplicant authors',
				populate: {
					path: 'publisher additionalInfo',
					populate: {
						path: 'team',
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
			// 4. Check permissions of user is manager of associated team
			let authorised = false;
			if (_.has(accessRecord.datasets[0].toObject(), 'publisher.team')) {
				let {
					publisher: { team },
				} = accessRecord.datasets[0];
				authorised = teamController.checkTeamPermissions(
					teamController.roleTypes.MANAGER,
					team.toObject(),
					userId
				);
			}
			// 5. Refuse access if not authorised
			if (!authorised) {
				return res
					.status(401)
					.json({ status: 'failure', message: 'Unauthorised' });
			}
			// 6. Check publisher allows workflows
			let workflowEnabled = false;
			if (
				_.has(accessRecord.datasets[0].toObject(), 'publisher.workflowEnabled')
			) {
				({
					publisher: { workflowEnabled },
				} = accessRecord.datasets[0]);
				if (!workflowEnabled) {
					return res.status(400).json({
						success: false,
						message: 'This custodian has not enabled workflows',
					});
				}
			}
			// 7. Check no workflow already assigned
			let { workflowId: currentWorkflowId = '' } = accessRecord;
			if (!_.isEmpty(currentWorkflowId)) {
				return res.status(400).json({
					success: false,
					message: 'This application already has a workflow assigned',
				});
			}
			// 8. Check application is in-review
			let { applicationStatus } = accessRecord;
			if (applicationStatus !== applicationStatuses.INREVIEW) {
				return res.status(400).json({
					success: false,
					message:
						'The application status must be set to in review to assign a workflow',
				});
			}
			// 9. Retrieve workflow using ID from database
			const workflow = await WorkflowModel.findOne({
				_id: workflowId,
			}).populate([
				{
					path: 'steps.reviewers',
					model: 'User',
					select: '_id id firstname lastname email',
				},
			]);
			if (!workflow) {
				return res.status(404).json({ success: false });
			}
			// 10. Set first workflow step active and ensure all others are false
			let workflowObj = workflow.toObject();
			workflowObj.steps = workflowObj.steps.map((step) => {
				return { ...step, active: false };
			});
			workflowObj.steps[0].active = true;
			workflowObj.steps[0].startDateTime = new Date();
			// 11. Update application with attached workflow
			accessRecord.workflowId = workflowId;
			accessRecord.workflow = workflowObj;
			// 12. Submit save
			accessRecord.save(function (err) {
				if (err) {
					console.error(err);
					return res.status(400).json({
						success: false,
						message: err.message,
					});
				} else {
					// 13. Contact Camunda to start workflow process
					let {
						name: dataRequestPublisher,
					} = accessRecord.datasets[0].publisher;
					let reviewerList = workflowObj.steps[0].reviewers.map((reviewer) =>
						reviewer._id.toString()
					);
					let bpmContext = {
						businessKey: id,
						dataRequestStatus: applicationStatuses.INREVIEW,
						dataRequestUserId: userId.toString(),
						dataRequestPublisher,
						dataRequestStepName: workflowObj.steps[0].stepName,
						notifyReviewerSLA: workflowController.calculateStepDeadlineReminderDate(
							workflowObj.steps[0]
						),
						reviewerList,
					};
					bpmController.postStartStepReview(bpmContext);
					// 14. Gather context for notifications
					const emailContext = workflowController.getWorkflowEmailContext(
						accessRecord,
						workflowObj,
						0
					);
					// 15. Create notifications to reviewers of the step that has been completed
					module.exports.createNotifications(
						notificationTypes.REVIEWSTEPSTART,
						emailContext,
						accessRecord,
						req.user
					);
					// 16. Return workflow payload
					return res.status(200).json({
						success: true,
					});
				}
			});
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: 'An error occurred assigning the workflow',
			});
		}
	},

	//PUT api/v1/data-access-request/:id/startreview
	updateAccessRequestStartReview: async (req, res) => {
		try {
			// 1. Get the required request params
			const {
				params: { id },
			} = req;
			let { _id: userId } = req.user;
			// 2. Retrieve DAR from database
			let accessRecord = await DataRequestModel.findOne({ _id: id }).populate({
				path: 'publisherObj',
				populate: {
					path: 'team',
				},
			});
			if (!accessRecord) {
				return res
					.status(404)
					.json({ status: 'error', message: 'Application not found.' });
			}
			// 3. Check permissions of user is reviewer of associated team
			let authorised = false;
			if (_.has(accessRecord.toObject(), 'publisherObj.team')) {
				let { team } = accessRecord.publisherObj;
				authorised = teamController.checkTeamPermissions(
					teamController.roleTypes.MANAGER,
					team.toObject(),
					userId
				);
			}
			// 4. Refuse access if not authorised
			if (!authorised) {
				return res
					.status(401)
					.json({ status: 'failure', message: 'Unauthorised' });
			}
			// 5. Check application is in submitted state
			let { applicationStatus } = accessRecord;
			if (applicationStatus !== applicationStatuses.SUBMITTED) {
				return res.status(400).json({
					success: false,
					message:
						'The application status must be set to submitted to start a review',
				});
			}
			// 6. Update application to 'in review'
			accessRecord.applicationStatus = applicationStatuses.INREVIEW;
			accessRecord.dateReviewStart = new Date();
			// 7. Save update to access record
			await accessRecord.save(async (err) => {
				if (err) {
					console.error(err);
					res.status(500).json({ status: 'error', message: err });
				} else {
					// 8. Call Camunda controller to get pre-review process
					let response = await bpmController.getProcess(id);
					let { data = {} } = response;
					if (!_.isEmpty(data)) {
						let [obj] = data;
						let { id: taskId } = obj;
						let {
							publisherObj: { name },
						} = accessRecord;
						let bpmContext = {
							taskId,
							applicationStatus,
							managerId: userId.toString(),
							publisher: name,
							notifyManager: 'P999D',
						};
						// 9. Call Camunda controller to start manager review process
						bpmController.postStartManagerReview(bpmContext);
					}
				}
			});
			// 14. Return aplication and successful response
			return res.status(200).json({ status: 'success' });
		} catch (err) {
			console.log(err.message);
			res.status(500).json({ status: 'error', message: err });
		}
	},

	//PUT api/v1/data-access-request/:id/vote
	updateAccessRequestReviewVote: async (req, res) => {
		try {
			// 1. Get the required request params
			const {
				params: { id },
			} = req;
			let { _id: userId } = req.user;
			let { approved, comments = '' } = req.body;
			if (_.isUndefined(approved) || _.isEmpty(comments)) {
				return res.status(400).json({
					success: false,
					message: 'You must supply the approved status with a reason',
				});
			}
			// 2. Retrieve DAR from database
			let accessRecord = await DataRequestModel.findOne({ _id: id }).populate([
				{
					path: 'publisherObj',
					populate: {
						path: 'team',
						populate: {
							path: 'users',
						},
					},
				},
				{
					path: 'workflow.steps.reviewers',
					select: 'firstname lastname id email',
				},
				{
					path: 'datasets dataset',
				},
				{
					path: 'mainApplicant',
				},
			]);
			if (!accessRecord) {
				return res
					.status(404)
					.json({ status: 'error', message: 'Application not found.' });
			}
			// 3. Check permissions of user is reviewer of associated team
			let authorised = false;
			if (_.has(accessRecord.toObject(), 'publisherObj.team')) {
				let { team } = accessRecord.publisherObj;
				authorised = teamController.checkTeamPermissions(
					teamController.roleTypes.REVIEWER,
					team.toObject(),
					userId
				);
			}
			// 4. Refuse access if not authorised
			if (!authorised) {
				return res
					.status(401)
					.json({ status: 'failure', message: 'Unauthorised' });
			}
			// 5. Check application is in-review
			let { applicationStatus } = accessRecord;
			if (applicationStatus !== applicationStatuses.INREVIEW) {
				return res.status(400).json({
					success: false,
					message:
						'The application status must be set to in review to cast a vote',
				});
			}
			// 6. Ensure a workflow has been attached to this application
			let { workflow } = accessRecord;
			if (!workflow) {
				return res.status(400).json({
					success: false,
					message:
						'There is no workflow attached to this application in order to cast a vote',
				});
			}
			// 7. Ensure the requesting user is expected to cast a vote
			let { steps } = workflow;
			let activeStepIndex = steps.findIndex((step) => {
				return step.active === true;
			});
			if (
				!steps[activeStepIndex].reviewers
					.map((reviewer) => reviewer._id.toString())
					.includes(userId.toString())
			) {
				return res.status(400).json({
					success: false,
					message: 'You have not been assigned to vote on this review phase',
				});
			}
			//8. Ensure the requesting user has not already voted
			let { recommendations = [] } = steps[activeStepIndex];
			if (recommendations) {
				let found = recommendations.some((rec) => {
					return rec.reviewer.equals(userId);
				});
				if (found) {
					return res.status(400).json({
						success: false,
						message: 'You have already voted on this review phase',
					});
				}
			}
			// 9. Create new recommendation
			let newRecommendation = {
				approved,
				comments,
				reviewer: new mongoose.Types.ObjectId(userId),
				createdDate: new Date(),
			};
			// 10. Update access record with recommendation
			accessRecord.workflow.steps[activeStepIndex].recommendations = [
				...accessRecord.workflow.steps[activeStepIndex].recommendations,
				newRecommendation,
			];
			// 11. Workflow management - construct Camunda payloads
			let bpmContext = workflowController.buildNextStep(
				userId,
				accessRecord,
				activeStepIndex,
				false
			);
			// 12. If step is now complete, update database record
			if (bpmContext.stepComplete) {
				accessRecord.workflow.steps[activeStepIndex].active = false;
				accessRecord.workflow.steps[activeStepIndex].completed = true;
				accessRecord.workflow.steps[activeStepIndex].endDateTime = new Date();
			}
			// 13. If it was not the final phase that was completed, move to next step in database
			if (!bpmContext.finalPhaseApproved) {
				accessRecord.workflow.steps[activeStepIndex + 1].active = true;
				accessRecord.workflow.steps[
					activeStepIndex + 1
				].startDateTime = new Date();
			}
			// 14. Update MongoDb record for DAR
			await accessRecord.save(async (err) => {
				if (err) {
					console.error(err);
					res.status(500).json({ status: 'error', message: err });
				} else {
					// 15. Create emails and notifications
					let relevantStepIndex = 0,
						relevantNotificationType = '';
					if (bpmContext.stepComplete && !bpmContext.finalPhaseApproved) {
						// Create notifications to reviewers of the next step that has been activated
						relevantStepIndex = activeStepIndex + 1;
						relevantNotificationType = notificationTypes.REVIEWSTEPSTART;
					} else if (bpmContext.stepComplete && bpmContext.finalPhaseApproved) {
						// Create notifications to managers that the application is awaiting final approval
						relevantStepIndex = activeStepIndex;
						relevantNotificationType = notificationTypes.FINALDECISIONREQUIRED;
					}
					// Continue only if notification required
					if (!_.isEmpty(relevantNotificationType)) {
						const emailContext = workflowController.getWorkflowEmailContext(
							accessRecord,
							workflow,
							relevantStepIndex
						);
						module.exports.createNotifications(
							relevantNotificationType,
							emailContext,
							accessRecord,
							req.user
						);
					}
					// 16. Call Camunda controller to update workflow process
					bpmController.postCompleteReview(bpmContext);
				}
			});
			// 17. Return aplication and successful response
			return res
				.status(200)
				.json({ status: 'success', data: accessRecord._doc });
		} catch (err) {
			console.log(err.message);
			res.status(500).json({ status: 'error', message: err });
		}
	},

	//PUT api/v1/data-access-request/:id/stepoverride
	updateAccessRequestStepOverride: async (req, res) => {
		try {
			// 1. Get the required request params
			const {
				params: { id },
			} = req;
			let { _id: userId } = req.user;
			// 2. Retrieve DAR from database
			let accessRecord = await DataRequestModel.findOne({ _id: id }).populate([
				{
					path: 'publisherObj',
					populate: {
						path: 'team',
						populate: {
							path: 'users',
						},
					},
				},
				{
					path: 'workflow.steps.reviewers',
					select: 'firstname lastname id email',
				},
				{
					path: 'datasets dataset',
				},
				{
					path: 'mainApplicant',
				},
			]);
			if (!accessRecord) {
				return res
					.status(404)
					.json({ status: 'error', message: 'Application not found.' });
			}
			// 3. Check permissions of user is reviewer of associated team
			let authorised = false;
			if (_.has(accessRecord.toObject(), 'publisherObj.team')) {
				let { team } = accessRecord.publisherObj;
				authorised = teamController.checkTeamPermissions(
					teamController.roleTypes.MANAGER,
					team.toObject(),
					userId
				);
			}
			// 4. Refuse access if not authorised
			if (!authorised) {
				return res
					.status(401)
					.json({ status: 'failure', message: 'Unauthorised' });
			}
			// 5. Check application is in review state
			let { applicationStatus } = accessRecord;
			if (applicationStatus !== applicationStatuses.INREVIEW) {
				return res.status(400).json({
					success: false,
					message: 'The application status must be set to in review',
				});
			}
			// 6. Check a workflow is assigned with valid steps
			let { workflow = {} } = accessRecord;
			let { steps = [] } = workflow;
			if (_.isEmpty(workflow) || _.isEmpty(steps)) {
				return res.status(400).json({
					success: false,
					message: 'A valid workflow has not been attached to this application',
				});
			}
			// 7. Get the attached active workflow step
			let activeStepIndex = steps.findIndex((step) => {
				return step.active === true;
			});
			if (activeStepIndex === -1) {
				return res.status(400).json({
					success: false,
					message: 'There is no active step to override for this workflow',
				});
			}
			// 8. Update the step to be completed closing off end date/time
			accessRecord.workflow.steps[activeStepIndex].active = false;
			accessRecord.workflow.steps[activeStepIndex].completed = true;
			accessRecord.workflow.steps[activeStepIndex].endDateTime = new Date();
			// 9. Set up Camunda payload
			let bpmContext = workflowController.buildNextStep(
				userId,
				accessRecord,
				activeStepIndex,
				true
			);
			// 10. If it was not the final phase that was completed, move to next step
			if (!bpmContext.finalPhaseApproved) {
				accessRecord.workflow.steps[activeStepIndex + 1].active = true;
				accessRecord.workflow.steps[
					activeStepIndex + 1
				].startDateTime = new Date();
			}
			// 11. Save changes to the DAR
			await accessRecord.save(async (err) => {
				if (err) {
					console.error(err);
					res.status(500).json({ status: 'error', message: err });
				} else {
					// 12. Gather context for notifications (active step)
					let emailContext = workflowController.getWorkflowEmailContext(
						accessRecord,
						workflow,
						activeStepIndex
					);
					// 13. Create notifications to reviewers of the step that has been completed
					module.exports.createNotifications(
						notificationTypes.STEPOVERRIDE,
						emailContext,
						accessRecord,
						req.user
					);
					// 14. Create emails and notifications
					let relevantStepIndex = 0,
						relevantNotificationType = '';
					if (bpmContext.finalPhaseApproved) {
						// Create notifications to managers that the application is awaiting final approval
						relevantStepIndex = activeStepIndex;
						relevantNotificationType = notificationTypes.FINALDECISIONREQUIRED;
					} else {
						// Create notifications to reviewers of the next step that has been activated
						relevantStepIndex = activeStepIndex + 1;
						relevantNotificationType = notificationTypes.REVIEWSTEPSTART;
					}
					// Get the email context only if required
					if(relevantStepIndex !== activeStepIndex) {
						emailContext = workflowController.getWorkflowEmailContext(
							accessRecord,
							workflow,
							relevantStepIndex
						);
					}
					module.exports.createNotifications(
						relevantNotificationType,
						emailContext,
						accessRecord,
						req.user
					);
					// 15. Call Camunda controller to start manager review process
					bpmController.postCompleteReview(bpmContext);
				}
			});
			// 16. Return aplication and successful response
			return res.status(200).json({ status: 'success' });
		} catch (err) {
			console.log(err.message);
			res.status(500).json({ status: 'error', message: err });
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
			let accessRecord = await DataRequestModel.findOne({ _id: id }).populate([
				{
					path: 'datasets dataset',
					populate: {
						path: 'publisher',
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
				},
				{
					path: 'mainApplicant authors',
					populate: {
						path: 'additionalInfo',
					},
				},
				{
					path: 'publisherObj',
				},
			]);
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
			accessRecord.applicationStatus = applicationStatuses.SUBMITTED;
			// Check if workflow/5 Safes based application, set final status date if status will never change again
			let workflowEnabled = false;
			if (_.has(accessRecord.datasets[0].toObject(), 'publisher')) {
				if (!accessRecord.datasets[0].publisher.workflowEnabled) {
					accessRecord.dateFinalStatus = new Date();
				} else {
					workflowEnabled = true;
				}
			}
			let dateSubmitted = new Date();
			accessRecord.dateSubmitted = dateSubmitted;
			await accessRecord.save(async (err) => {
				if (err) {
					console.error(err);
					res.status(500).json({ status: 'error', message: err });
				} else {
					// If save has succeeded - send notifications
					// Send notifications and emails to custodian team and main applicant
					await module.exports.createNotifications(
						notificationTypes.SUBMITTED,
						{},
						accessRecord,
						req.user
					);
					// Start workflow process if publisher requires it
					if (workflowEnabled) {
						// Call Camunda controller to start workflow for submitted application
						let {
							publisherObj: { name: publisher },
						} = accessRecord;
						let bpmContext = {
							dateSubmitted,
							applicationStatus: applicationStatuses.SUBMITTED,
							publisher,
							businessKey: id,
						};
						bpmController.postStartPreReview(bpmContext);
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

	//POST api/v1/data-access-request/:id/notify
	notifyAccessRequestById: async (req, res) => {
		// 1. Get workflow etc.
		// 12. Gather context for notifications
		//const emailContext = workflowController.getWorkflowEmailContext(workflow, activeStepIndex);
		// 13. Create notifications to reviewers of the step that has been completed
		//module.exports.createNotifications(notificationTypes.DEADLINEWARNING, emailContext, accessRecord, req.user);
		return res.status(200).json({ status: 'success' });
	},

	createNotifications: async (type, context, accessRecord, user) => {
		// Project details from about application if 5 Safes
		let aboutApplication = JSON.parse(accessRecord.aboutApplication);
		let { projectName } = aboutApplication;
		let { projectId, _id, workflow = {}, dateSubmitted = '' } = accessRecord;
		if (_.isEmpty(projectId)) {
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
		let custodianManagers = [],
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
		// Deconstruct workflow context if passed
		let {
			workflowName = '',
			stepName = '',
			reviewerNames = '',
			reviewSections = '',
			nextStepName = '',
			stepReviewers = [],
			stepReviewerUserIds = [],
			currentDeadline = '',
		} = context;

		switch (type) {
			// DAR application status has been updated
			case notificationTypes.STATUSCHANGE:
				// 1. Create notifications
				// Custodian manager and current step reviewer notifications
				if (
					_.has(accessRecord.datasets[0].toObject(), 'publisher.team.users')
				) {
					// Retrieve all custodian manager user Ids and active step reviewers
					custodianManagers = teamController.getTeamMembersByRole(
						accessRecord.datasets[0].publisher.team,
						teamController.roleTypes.MANAGER
					);
					let activeStep = workflowController.getActiveWorkflowStep(workflow);
					stepReviewers = workflowController.getStepReviewers(activeStep);
					// Create custodian notification
					let statusChangeUserIds = [
						...custodianManagers,
						...stepReviewers,
					].map((user) => user.id);
					await notificationBuilder.triggerNotificationMessage(
						statusChangeUserIds,
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
						authors.map((author) => author.id),
						`A Data Access Request you are contributing to for ${datasetTitles} was ${context.applicationStatus} by ${publisher}`,
						'data access request',
						accessRecord._id
					);
				}

				// 2. Send emails to relevant users
				// Aggregate objects for custodian and applicant
				emailRecipients = [
					accessRecord.mainApplicant,
					...custodianManagers,
					...stepReviewers,
					...accessRecord.authors,
				];
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
					false
				);
				break;
			case notificationTypes.SUBMITTED:
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
					custodianManagers = teamController.getTeamMembersByRole(
						accessRecord.datasets[0].publisher.team,
						teamController.roleTypes.MANAGER
					);
					let custodianUserIds = custodianManagers.map((user) => user.id);
					await notificationBuilder.triggerNotificationMessage(
						custodianUserIds,
						`A Data Access Request has been submitted to ${publisher} for ${datasetTitles} by ${appFirstName} ${appLastName}`,
						'data access request',
						accessRecord._id
					);
				} else {
					const dataCustodianEmail =
						process.env.DATA_CUSTODIAN_EMAIL || contactPoint;
					custodianManagers = [{ email: dataCustodianEmail }];
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
					publisher,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
				};
				// Iterate through the recipient types
				for (let emailRecipientType of emailRecipientTypes) {
					// Send emails to custodian team members who have opted in to email notifications
					if (emailRecipientType === 'dataCustodian') {
						emailRecipients = [...custodianManagers];
					} else {
						// Send email to main applicant and contributors if they have opted in to email notifications
						emailRecipients = [
							accessRecord.mainApplicant,
							...accessRecord.authors,
						];
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
							false
						);
					}
				}
				break;
			case notificationTypes.CONTRIBUTORCHANGE:
				// 1. Deconstruct authors array from context to compare with existing Mongo authors
				const { newAuthors, currentAuthors } = context;
				// 2. Determine authors who have been removed
				let addedAuthors = [...newAuthors].filter(
					(author) => !currentAuthors.includes(author)
				);
				// 3. Determine authors who have been added
				let removedAuthors = [...currentAuthors].filter(
					(author) => !newAuthors.includes(author)
				);
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
					html = emailGenerator.generateContributorEmail(options);
					// Find related user objects and filter out users who have not opted in to email communications
					let addedUsers = await UserModel.find({
						id: { $in: addedAuthors },
					}).populate('additionalInfo');

					await notificationBuilder.triggerNotificationMessage(
						addedUsers.map((user) => user.id),
						`You have been added as a contributor for a Data Access Request to ${publisher} by ${firstname} ${lastname}`,
						'data access request',
						accessRecord._id
					);
					await emailGenerator.sendEmail(
						addedUsers,
						hdrukEmail,
						`You have been added as a contributor for a Data Access Request to ${publisher} by ${firstname} ${lastname}`,
						html,
						false
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

					await notificationBuilder.triggerNotificationMessage(
						removedUsers.map((user) => user.id),
						`You have been removed as a contributor from a Data Access Request to ${publisher} by ${firstname} ${lastname}`,
						'data access request unlinked',
						accessRecord._id
					);
					await emailGenerator.sendEmail(
						removedUsers,
						hdrukEmail,
						`You have been removed as a contributor from a Data Access Request to ${publisher} by ${firstname} ${lastname}`,
						html,
						false
					);
				}
				break;
			case notificationTypes.STEPOVERRIDE:
				// 1. Create reviewer notifications
				notificationBuilder.triggerNotificationMessage(
					stepReviewerUserIds,
					`${firstname} ${lastname} has approved a Data Access Request application phase that you were assigned to review`,
					'data access request',
					accessRecord._id
				);
				// 2. Create reviewer emails
				options = {
					id: accessRecord._id,
					projectName,
					projectId,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
					actioner: `${firstname} ${lastname}`,
					applicants,
					dateSubmitted,
					...context,
				};
				html = emailGenerator.generateStepOverrideEmail(options);
				emailGenerator.sendEmail(
					stepReviewers,
					hdrukEmail,
					`${firstname} ${lastname} has approved a Data Access Request application phase that you were assigned to review`,
					html,
					false
				);
				break;
			case notificationTypes.REVIEWSTEPSTART:
				// 1. Create reviewer notifications
				notificationBuilder.triggerNotificationMessage(
					stepReviewerUserIds,
					`You are required to review a new Data Access Request application for ${publisher} by ${moment(
						currentDeadline
					).format('D MMM YYYY HH:mm')}`,
					'data access request',
					accessRecord._id
				);
				// 2. Create reviewer emails
				options = {
					id: accessRecord._id,
					projectName,
					projectId,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
					actioner: `${firstname} ${lastname}`,
					applicants,
					dateSubmitted,
					...context,
				};
				html = emailGenerator.generateNewReviewPhaseEmail(options);
				emailGenerator.sendEmail(
					stepReviewers,
					hdrukEmail,
					`You are required to review a new Data Access Request application for ${publisher} by ${moment(
						currentDeadline
					).format('D MMM YYYY HH:mm')}`,
					html,
					false
				);
				break;
			case notificationTypes.FINALDECISIONREQUIRED:
				// 1. Get managers for publisher
				custodianManagers = teamController.getTeamMembersByRole(
					accessRecord.publisherObj.team,
					teamController.roleTypes.MANAGER
				);
				let managerUserIds = custodianManagers.map((user) => user.id);

				// 1. Create manager notifications
				notificationBuilder.triggerNotificationMessage(
					managerUserIds,
					`Action is required as a Data Access Request application for ${publisher} is now awaiting a final decision`,
					'data access request',
					accessRecord._id
				);
				// 2. Create manager emails
				options = {
					id: accessRecord._id,
					projectName,
					projectId,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
					actioner: `${firstname} ${lastname}`,
					applicants,
					dateSubmitted,
					...context,
				};
				html = emailGenerator.generateFinalDecisionRequiredEmail(options);
				emailGenerator.sendEmail(
					custodianManagers,
					hdrukEmail,
					`Action is required as a Data Access Request application for ${publisher} is now awaiting a final decision`,
					html,
					false
				);
				break;
			case notificationTypes.DEADLINEWARNING:
				// 1. Get all reviewers who have not yet voted on active phase
				// 2. Create reviewer notifications
				await notificationBuilder.triggerNotificationMessage(
					stepReviewerUserIds,
					`${firstname} ${lastname} has approved a Data Access Request phase you are reviewing`,
					'data access request',
					accessRecord._id
				);
				// 3. Create reviewer emails
				options = {
					id: accessRecord._id,
					projectName,
					projectId,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
					actioner: `${firstname} ${lastname}`,
					applicants,
					workflowName,
					stepName,
					reviewSections,
					reviewerNames,
					nextStepName,
				};
				html = await emailGenerator.generateReviewDeadlineWarning(options);
				await emailGenerator.sendEmail(
					stepReviewers,
					hdrukEmail,
					`${firstname} ${lastname} has approved a Data Access Request phase you are reviewing`,
					html,
					false
				);
				break;
			case notificationTypes.DEADLINEPASSED:
				// 1. Get all reviewers who have not yet voted on active phase
				// 2. Get all managers
				// 3. Create notifications
				await notificationBuilder.triggerNotificationMessage(
					stepReviewerUserIds,
					`${firstname} ${lastname} has approved a Data Access Request phase you are reviewing`,
					'data access request',
					accessRecord._id
				);
				// 4. Create emails
				options = {
					id: accessRecord._id,
					projectName,
					projectId,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
					actioner: `${firstname} ${lastname}`,
					applicants,
					workflowName,
					stepName,
					reviewSections,
					reviewerNames,
					nextStepName,
				};
				html = await emailGenerator.generateReviewDeadlinePassed(options);
				await emailGenerator.sendEmail(
					stepReviewers,
					hdrukEmail,
					`${firstname} ${lastname} has approved a Data Access Request phase you are reviewing`,
					html,
					false
				);
		}
	},

	getUserPermissionsForApplication: (application, userId, _id) => {
		try {
			let authorised = false,
				userType = '';
			// Return default unauthorised with no user type if incorrect params passed
			if (!application || !userId || !_id) {
				return { authorised, userType };
			}
			// Check if the user is a custodian team member and assign permissions if so
			if (_.has(application.datasets[0].toObject(), 'publisher.team')) {
				let isTeamMember = teamController.checkTeamPermissions(
					'',
					application.datasets[0].publisher.team.toObject(),
					_id
				);
				if (isTeamMember) {
					userType = userTypes.CUSTODIAN;
					authorised = true;
				}
			}
			// If user is not authenticated as a custodian, check if they are an author or the main applicant
			if (
				application.applicationStatus === applicationStatuses.INPROGRESS ||
				_.isEmpty(userType)
			) {
				if (
					application.authorIds.includes(userId) ||
					application.userId === userId
				) {
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
		let fullnames = [],
			autoCompleteLookups = { fullname: ['email'] };
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

	createApplicationDTO: (app, userId = '') => {
		let projectName = '',
			applicants = '',
			workflowName = '',
			workflowCompleted = false,
			remainingActioners = [],
			decisionDuration = '',
			decisionMade = false,
			decisionStatus = '',
			decisionComments = '',
			decisionDate = '',
			decisionApproved = false,
			managerUsers = [],
			stepName = '',
			deadlinePassed = '',
			reviewStatus = '',
			isReviewer = false,
			reviewPanels = [];

		// Check if the application has a workflow assigned
		let { workflow = {}, applicationStatus } = app;
		if (_.has(app, 'publisherObj.team.members')) {
			let {
				publisherObj: {
					team: { members, users },
				},
			} = app;
			let managers = members.filter((mem) => {
				return mem.roles.includes('manager');
			});
			managerUsers = users
				.filter((user) =>
					managers.some(
						(manager) => manager.memberid.toString() === user._id.toString()
					)
				)
				.map((user) => {
					let isCurrentUser = user._id.toString() === userId.toString();
					return `${user.firstname} ${user.lastname}${
						isCurrentUser ? ` (you)` : ``
					}`;
				});
			if (
				applicationStatus === applicationStatuses.SUBMITTED ||
				(applicationStatus === applicationStatuses.INREVIEW &&
					_.isEmpty(workflow))
			) {
				remainingActioners = managerUsers.join(', ');
			}
			if (!_.isEmpty(workflow)) {
				({ workflowName } = workflow);
				workflowCompleted = workflowController.getWorkflowCompleted(workflow);
				let activeStep = workflowController.getActiveWorkflowStep(workflow);
				// Calculate active step status
				if (!_.isEmpty(activeStep)) {
					({
						stepName = '',
						remainingActioners = [],
						deadlinePassed = '',
						reviewStatus = '',
						decisionMade = false,
						decisionStatus = '',
						decisionComments = '',
						decisionApproved,
						decisionDate,
						isReviewer = false,
						reviewPanels = [],
					} = workflowController.getActiveStepStatus(
						activeStep,
						users,
						userId
					));
					let activeStepIndex = workflow.steps.findIndex((step) => {
						return step.active === true;
					});
					workflow.steps[activeStepIndex] = {
						...workflow.steps[activeStepIndex],
						reviewStatus,
					};
				} else if (
					_.isUndefined(activeStep) &&
					applicationStatus === applicationStatuses.INREVIEW
				) {
					reviewStatus = 'Final decision required';
					remainingActioners = managerUsers.join(', ');
				}
				// Get decision duration if completed
				let { dateFinalStatus, dateSubmitted } = app;
				if (dateFinalStatus) {
					decisionDuration = parseInt(
						moment(dateFinalStatus).diff(dateSubmitted, 'days')
					);
				}
				// Set review section to display format
				let formattedSteps = [...workflow.steps].reduce((arr, item) => {
					let step = {
						...item,
						sections: [...item.sections].map(
							(section) => helper.darPanelMapper[section]
						),
					};
					arr.push(step);
					return arr;
				}, []);
				workflow.steps = [...formattedSteps];
			}
		}

		// Ensure backward compatibility with old single dataset DARs
		if (_.isEmpty(app.datasets) || _.isUndefined(app.datasets)) {
			app.datasets = [app.dataset];
			app.datasetIds = [app.datasetid];
		}
		let {
			datasetfields: { publisher },
			name,
		} = app.datasets[0];
		let { aboutApplication, questionAnswers } = app;

		if (aboutApplication) {
			let aboutObj = JSON.parse(aboutApplication);
			({ projectName } = aboutObj);
		}
		if (_.isEmpty(projectName)) {
			projectName = `${publisher} - ${name}`;
		}
		if (questionAnswers) {
			let questionAnswersObj = JSON.parse(questionAnswers);
			applicants = module.exports
				.extractApplicantNames(questionAnswersObj)
				.join(', ');
		}
		if (_.isEmpty(applicants)) {
			let { firstname, lastname } = app.mainApplicant;
			applicants = `${firstname} ${lastname}`;
		}
		return {
			...app,
			projectName,
			applicants,
			publisher,
			workflowName,
			workflowCompleted,
			decisionDuration,
			decisionMade,
			decisionStatus,
			decisionComments,
			decisionDate,
			decisionApproved,
			remainingActioners,
			stepName,
			deadlinePassed,
			reviewStatus,
			isReviewer,
			reviewPanels,
		};
	},

	calculateAvgDecisionTime: (applications) => {
		// Extract dateSubmitted dateFinalStatus
		let decidedApplications = applications.filter((app) => {
			let { dateSubmitted = '', dateFinalStatus = '' } = app;
			return (
				!_.isEmpty(dateSubmitted.toString()) &&
				!_.isEmpty(dateFinalStatus.toString())
			);
		});
		// Find difference between dates in milliseconds
		if (!_.isEmpty(decidedApplications)) {
			let totalDecisionTime = decidedApplications.reduce((count, current) => {
				let { dateSubmitted, dateFinalStatus } = current;
				let start = moment(dateSubmitted);
				let end = moment(dateFinalStatus);
				let diff = end.diff(start, 'seconds');
				count += diff;
				return count;
			}, 0);
			// Divide by number of items
			if (totalDecisionTime > 0)
				return parseInt(totalDecisionTime / decidedApplications.length / 86400);
		}
		return 0;
	},
};
