import { DataRequestModel } from './datarequest.model';
import { WorkflowModel } from '../workflow/workflow.model';
import { Data as ToolModel } from '../tool/data.model';
import { DataRequestSchemaModel } from './schema/datarequest.schemas.model';
import { UserModel } from '../user/user.model';

import teamController from '../team/team.controller';
import workflowController from '../workflow/workflow.controller';
import datarequestUtil from './utils/datarequest.util';
import notificationBuilder from '../utilities/notificationBuilder';

import emailGenerator from '../utilities/emailGenerator.util';
import helper from '../utilities/helper.util';
import dynamicForm from '../utilities/dynamicForms/dynamicForm.util';
import constants from '../utilities/constants.util';
import { processFile, getFile, fileStatus } from '../utilities/cloudStorage.util';
import _ from 'lodash';
import inputSanitizer from '../utilities/inputSanitizer';
import Controller from '../base/controller';
import { logger } from '../utilities/logger';

const logCategory = 'Data Access Request';
import moment from 'moment';
import mongoose from 'mongoose';
import i18next from '../internationalization/i18next';

const amendmentController = require('./amendment/amendment.controller');
const bpmController = require('../bpmnworkflow/bpmnworkflow.controller');

export default class DataRequestController extends Controller {
	constructor(dataRequestService, workflowService, amendmentService, topicService, messageService, activityLogService) {
		super(dataRequestService);
		this.dataRequestService = dataRequestService;
		this.workflowService = workflowService;
		this.amendmentService = amendmentService;
		this.activityLogService = activityLogService;
		this.topicService = topicService;
		this.messageService = messageService;
	}

	// ###### APPLICATION CRUD OPERATIONS #######

	//GET api/v1/data-access-request
	async getAccessRequestsByUser(req, res) {
		try {
			// Deconstruct the parameters passed
			let { query = {} } = req;
			const requestingUserId = parseInt(req.user.id);

			// Find all data access request applications for requesting user
			let applications = await this.dataRequestService.getAccessRequestsByUser(requestingUserId, query);

			// Create detailed application object including workflow, review meta details
			let modifiedApplications = [...applications]
				.map(accessRecord => {
					accessRecord = this.workflowService.getWorkflowDetails(accessRecord, requestingUserId);
					accessRecord.projectName = this.dataRequestService.getProjectName(accessRecord);
					accessRecord.applicants = this.dataRequestService.getApplicantNames(accessRecord);
					accessRecord.decisionDuration = this.dataRequestService.getDecisionDuration(accessRecord);
					accessRecord.versions = this.dataRequestService.buildVersionHistory(
						accessRecord.versionTree,
						accessRecord._id,
						null,
						constants.userTypes.APPLICANT
					);
					accessRecord.amendmentStatus = this.amendmentService.calculateAmendmentStatus(accessRecord, constants.userTypes.APPLICANT);
					return accessRecord;
				})
				.sort((a, b) => b.updatedAt - a.updatedAt);

			// Calculate average decision time across submitted applications
			let avgDecisionTime = this.dataRequestService.calculateAvgDecisionTime(applications);

			// Return payload
			return res.status(200).json({
				success: true,
				data: modifiedApplications,
				avgDecisionTime,
				canViewSubmitted: true,
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'An error occurred searching for user applications',
			});
		}
	}

	//GET api/v1/data-access-request/:id
	async getAccessRequestById(req, res) {
		try {
			// 1. Get dataSetId from params
			const {
				params: { id },
			} = req;
			const { version: requestedVersion } = req.query;
			const requestingUser = req.user;
			const requestingUserId = parseInt(req.user.id);
			const requestingUserObjectId = req.user._id;

			// 2. Find the matching record and include attached datasets records with publisher details and workflow details
			let accessRecord = await this.dataRequestService.getApplicationById(id);
			if (!accessRecord) {
				return res.status(404).json({ status: 'error', message: 'The application could not be found.' });
			}

			// 3. If invalid version requested, return 404
			const { isValidVersion, requestedMajorVersion, requestedMinorVersion } = this.dataRequestService.validateRequestedVersion(
				accessRecord,
				requestedVersion
			);
			if (!isValidVersion) {
				return res.status(404).json({ status: 'error', message: 'The requested application version could not be found.' });
			}

			// 4. Get requested amendment iteration details
			const { versionIndex, activeParty, isLatestMinorVersion } = this.amendmentService.getAmendmentIterationDetailsByVersion(
				accessRecord,
				requestedMinorVersion
			);

			// 5. Check if requesting user is custodian member or applicant/contributor
			const { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(
				accessRecord,
				requestingUserId,
				requestingUserObjectId
			);
			if (!authorised) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}

			// 6. Set edit mode for applicants who have not yet submitted
			const { applicationStatus, jsonSchema, versionTree, applicationType } = accessRecord;
			accessRecord.readOnly = this.dataRequestService.getApplicationIsReadOnly(userType, applicationStatus);

			// 7. Count amendments for the latest version - returns 0 immediately if not viewing latest version
			const countAmendments = this.amendmentService.countAmendments(accessRecord, userType, isLatestMinorVersion);

			// 8. Get the workflow status for the requested application version for the requesting user
			const {
				inReviewMode,
				reviewSections,
				hasRecommended,
				isManager,
				workflow,
			} = this.workflowService.getApplicationWorkflowStatusForUser(accessRecord, requestingUserObjectId);

			// 9. Get role type for requesting user, applicable for only Custodian users i.e. Manager/Reviewer role
			const userRole =
				userType === constants.userTypes.APPLICANT ? '' : isManager ? constants.roleTypes.MANAGER : constants.roleTypes.REVIEWER;

			// 10. Handle amendment type application loading for Custodian showing any changes in the major version
			if (applicationType === constants.submissionTypes.AMENDED && userType === constants.userTypes.CUSTODIAN) {
				const minorVersion = _.isNil(requestedMinorVersion) ? accessRecord.amendmentIterations.length : requestedMinorVersion;

				if (accessRecord.amendmentIterations.length === 0 || minorVersion === 0) {
					accessRecord = this.amendmentService.highlightChanges(accessRecord);
				}
			}

			// 11. Inject completed update requests from previous version to the requested version e.g. 1.1 if 1.2 requested
			accessRecord = this.amendmentService.injectAmendments(accessRecord, userType, requestingUser, versionIndex - 1, true);

			// 12. Inject updates for current version
			accessRecord = this.amendmentService.injectAmendments(accessRecord, userType, requestingUser, versionIndex, true);

			// 13. Inject updates from any unreleased version e.g. 1.2
			accessRecord = this.amendmentService.injectAmendments(
				accessRecord,
				userType,
				requestingUser,
				versionIndex + 1,
				isLatestMinorVersion,
				false
			);

			// 14. Append question actions depending on user type and application status
			accessRecord.jsonSchema = datarequestUtil.injectQuestionActions(
				jsonSchema,
				userType,
				applicationStatus,
				userRole,
				activeParty,
				isLatestMinorVersion
			);

			// 15. Inject message and note counts
			const messages = await this.topicService.getTopicsForDAR(id, constants.DARMessageTypes.DARMESSAGE);
			let notes = [];
			if (userType === constants.userTypes.APPLICANT) {
				notes = await this.topicService.getTopicsForDAR(id, constants.DARMessageTypes.DARNOTESAPPLICANT);
			} else if (userType === constants.userTypes.CUSTODIAN) {
				notes = await this.topicService.getTopicsForDAR(id, constants.DARMessageTypes.DARNOTESCUSTODIAN);
			}
			if (messages.length > 0 || notes.length > 0) {
				accessRecord.jsonSchema = datarequestUtil.injectMessagesAndNotesCount(accessRecord.jsonSchema, messages, notes);
			}

			// 16. Build version selector
			const requestedFullVersion = `${requestedMajorVersion}.${
				_.isNil(requestedMinorVersion) ? accessRecord.amendmentIterations.length : requestedMinorVersion
			}`;
			accessRecord.versions = this.dataRequestService.buildVersionHistory(versionTree, accessRecord._id, requestedFullVersion, userType);

			// 17. Return application form
			return res.status(200).json({
				status: 'success',
				data: {
					...accessRecord,
					datasets: accessRecord.datasets,
					...countAmendments,
					userType,
					activeParty,
					projectId: accessRecord.projectId || helper.generateFriendlyId(accessRecord._id),
					inReviewMode,
					reviewSections,
					hasRecommended,
					workflow,
					files: accessRecord.files || [],
					isLatestMinorVersion,
				},
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'An error occurred opening this data access request application',
			});
		}
	}

	//GET api/v1/data-access-request/datasets/:datasetIds
	async getAccessRequestByUserAndMultipleDatasets(req, res) {
		try {
			let data = {};
			// 1. Get datasetIds from params
			const {
				params: { datasetIds, dataSetId },
			} = req;
			const resolvedIds = datasetIds || dataSetId;
			const arrDatasetIds = resolvedIds.split(',');

			// 2. Get the user details
			const { _id: requestingUserObjectId, id: requestingUserId, firstname, lastname } = req.user;

			// 3. Find the matching record
			let accessRecord = await this.dataRequestService.getApplicationByDatasets(
				arrDatasetIds,
				constants.applicationStatuses.INPROGRESS,
				requestingUserId
			);

			// 4. Get datasets
			const datasets = await this.dataRequestService.getDatasetsForApplicationByIds(arrDatasetIds);
			const arrDatasetNames = datasets.map(dataset => dataset.name);

			// 5. If in progress application found use existing endpoint to handle logic to fetch and return
			if (accessRecord) {
				req.params.id = accessRecord._id;
				return await this.getAccessRequestById(req, res);
			} else {
				if (_.isEmpty(datasets)) {
					return res.status(500).json({ status: 'error', message: 'No datasets available.' });
				}
				const {
					datasetfields: { publisher = '' },
				} = datasets[0];

				// 1. GET the template from the custodian or take the default (Cannot have dataset specific question sets for multiple datasets)
				accessRecord = await this.dataRequestService.buildApplicationForm(
					publisher,
					arrDatasetIds,
					arrDatasetNames,
					requestingUserId,
					requestingUserObjectId
				);

				// 2. Ensure a question set was found
				if (!accessRecord) {
					return res.status(400).json({
						status: 'error',
						message: 'Application form could not be created',
					});
				}

				// 3. Create and save new application
				const newApplication = await this.dataRequestService.createApplication(accessRecord).catch(err => {
					logger.logError(err, logCategory);
				});

				// 4. Set return data
				data = {
					...newApplication._doc,
					mainApplicant: { firstname, lastname },
				};
			}

			// 6. Append question actions depending on user type and application status
			data.jsonSchema = datarequestUtil.injectQuestionActions(
				data.jsonSchema,
				constants.userTypes.APPLICANT,
				data.applicationStatus,
				null,
				constants.userTypes.APPLICANT
			);

			// 7. Return payload
			return res.status(200).json({
				status: 'success',
				data: {
					...data,
					datasets,
					projectId: data.projectId || helper.generateFriendlyId(data._id),
					userType: constants.userTypes.APPLICANT,
					activeParty: constants.userTypes.APPLICANT,
					inReviewMode: false,
					reviewSections: [],
					files: data.files || [],
				},
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'An error occurred opening a data access request application for the requested dataset(s)',
			});
		}
	}

	//POST api/v1/data-access-request/:id
	async submitAccessRequestById(req, res) {
		try {
			// 1. id is the _id object in mongoo.db not the generated id or dataset Id
			const {
				params: { id },
			} = req;
			const requestingUser = req.user;
			const requestingUserId = parseInt(req.user.id);
			const requestingUserObjectId = req.user._id;
			const { description = '' } = req.body;
			let notificationType;

			// 2. Find the relevant data request application
			let accessRecord = await this.dataRequestService.getApplicationToSubmitById(id);

			if (!accessRecord) {
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}

			// 3. Check user type and authentication to submit application
			let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(
				accessRecord,
				requestingUserId,
				requestingUserObjectId
			);
			if (!authorised) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}

			// 4. Ensure single datasets are mapped correctly into array (backward compatibility for single dataset applications)
			if (_.isEmpty(accessRecord.datasets)) {
				accessRecord.datasets = [accessRecord.dataset];
			}

			// 5. Perform either initial submission or resubmission depending on application status
			if (accessRecord.applicationStatus === constants.applicationStatuses.INPROGRESS) {
				switch (accessRecord.applicationType) {
					case constants.submissionTypes.AMENDED:
						accessRecord = await this.dataRequestService.doAmendSubmission(accessRecord, description);
						await this.activityLogService.logActivity(constants.activityLogEvents.AMENDMENT_SUBMITTED, {
							accessRequest: accessRecord,
							user: requestingUser,
						});
						notificationType = constants.notificationTypes.APPLICATIONAMENDED;
						break;
					case constants.submissionTypes.INITIAL:
					default:
						accessRecord = await this.dataRequestService.doInitialSubmission(accessRecord);
						await this.activityLogService.logActivity(constants.activityLogEvents.APPLICATION_SUBMITTED, {
							accessRequest: accessRecord,
							user: requestingUser,
						});
						notificationType = constants.notificationTypes.SUBMITTED;
						break;
				}
			} else if (
				accessRecord.applicationStatus === constants.applicationStatuses.INREVIEW ||
				accessRecord.applicationStatus === constants.applicationStatuses.SUBMITTED
			) {
				accessRecord = await this.amendmentService.doResubmission(accessRecord, requestingUserObjectId.toString());
				await this.dataRequestService.syncRelatedVersions(accessRecord.versionTree);
				await this.activityLogService.logActivity(constants.activityLogEvents.UPDATES_SUBMITTED, {
					accessRequest: accessRecord,
					user: requestingUser,
				});
				notificationType = constants.notificationTypes.RESUBMITTED;
			}

			// 6. Ensure a valid submission is taking place
			if (_.isNil(accessRecord.applicationType)) {
				return res.status(400).json({
					status: 'error',
					message: 'Application cannot be submitted as it has reached a final decision status.',
				});
			}

			// 7. Save changes to db
			let savedAccessRecord = await this.dataRequestService.replaceApplicationById(id, accessRecord).catch(err => {
				logger.logError(err, logCategory);
			});

			// 8. Inject amendments from minor versions
			savedAccessRecord = this.amendmentService.injectAmendments(accessRecord, userType, requestingUser);

			// 9. Send notifications
			await this.createNotifications(notificationType, {}, accessRecord.toObject(), requestingUser);

			// 10. Start workflow process in Camunda if publisher requires it and it is the first submission
			if (savedAccessRecord.workflowEnabled && savedAccessRecord.applicationType === constants.submissionTypes.INITIAL) {
				let {
					publisherObj: { name: publisher },
					dateSubmitted,
				} = accessRecord;
				let bpmContext = {
					dateSubmitted,
					applicationStatus: constants.applicationStatuses.SUBMITTED,
					publisher,
					businessKey: id,
				};
				bpmController.postStartPreReview(bpmContext);
			}

			// 11. Return aplication and successful response
			return res.status(200).json({ status: 'success', data: savedAccessRecord });
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'An error occurred submitting the application',
			});
		}
	}

	//PATCH api/v1/data-access-request/:id
	async updateAccessRequestDataElement(req, res) {
		try {
			// 1. Id is the _id object in mongoo.db not the generated id or dataset Id
			const {
				params: { id },
				body: data,
			} = req;
			const requestingUser = req.user;
			// 2. Destructure body and update only specific fields by building a segregated non-user specified update object
			let updateObj = this.dataRequestService.buildUpdateObject({
				...data,
				user: requestingUser,
			});
			// 3. Find data request by _id to determine current status
			let accessRecord = await this.dataRequestService.getApplicationToUpdateById(id);
			// 4. Check access record
			if (!accessRecord) {
				return res.status(404).json({ status: 'error', message: 'Data Access Request not found.' });
			}
			// 5. Update record object
			accessRecord = await this.dataRequestService.updateApplication(accessRecord, updateObj).catch(err => {
				logger.logError(err, logCategory);
			});
			const { unansweredAmendments = 0, answeredAmendments = 0, dirtySchema = false } = accessRecord;

			if (dirtySchema) {
				// 6. Support for versioning
				if (accessRecord.amendmentIterations.length > 0) {
					// Detemine which versions to return
					let currentVersionIndex;
					let previousVersionIndex;
					const unreleasedVersionIndex = accessRecord.amendmentIterations.findIndex(iteration => _.isNil(iteration.dateReturned));

					if (unreleasedVersionIndex === -1) {
						currentVersionIndex = accessRecord.amendmentIterations.length - 1;
					} else {
						currentVersionIndex = accessRecord.amendmentIterations.length - 2;
					}
					previousVersionIndex = currentVersionIndex - 1;

					// Inject updates from previous version
					accessRecord = this.amendmentService.injectAmendments(
						accessRecord,
						constants.userTypes.APPLICANT,
						requestingUser,
						previousVersionIndex,
						true
					);

					// Inject updates from current version
					accessRecord = this.amendmentService.injectAmendments(
						accessRecord,
						constants.userTypes.APPLICANT,
						requestingUser,
						currentVersionIndex,
						true
					);

					// Inject updates from possible unreleased version
					if (unreleasedVersionIndex !== -1) {
						accessRecord = this.amendmentService.injectAmendments(
							accessRecord,
							constants.userTypes.APPLICANT,
							requestingUser,
							unreleasedVersionIndex,
							true,
							false
						);
					}
				}
			}
			// 7. Return new data object
			return res.status(200).json({
				status: 'success',
				unansweredAmendments,
				answeredAmendments,
				jsonSchema: dirtySchema ? accessRecord.jsonSchema : undefined,
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'An error occurred updating the application',
			});
		}
	}

	//PUT api/v1/data-access-request/:id
	async updateAccessRequestById(req, res) {
		try {
			// 1. Id is the _id object in MongoDb not the generated id or dataset Id
			const {
				params: { id },
			} = req;
			// 2. Get the userId
			const requestingUser = req.user;
			const requestingUserId = parseInt(req.user.id);
			const requestingUserObjectId = req.user._id;

			let applicationStatus = '',
				applicationStatusDesc = '';

			// 3. Find the relevant data request application
			let accessRecord = await this.dataRequestService.getApplicationWithWorkflowById(id, { lean: false });
			if (!accessRecord) {
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}

			// 4. Check if the user is permitted to perform update to application
			let isDirty = false,
				statusChange = false,
				contributorChange = false;
			let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(
				accessRecord.toObject(),
				requestingUserId,
				requestingUserObjectId
			);

			if (!authorised) {
				return res.status(401).json({
					status: 'error',
					message: 'Unauthorised to perform this update.',
				});
			}

			let { authorIds: currentAuthors } = accessRecord;
			let newAuthors = [];

			// 5. Extract new application status and desc to save updates
			if (userType === constants.userTypes.CUSTODIAN) {
				// Only a custodian manager can set the final status of an application
				authorised = false;
				const { team = {} } = accessRecord.publisherObj.toObject();
				if (!_.isEmpty(team)) {
					authorised = teamController.checkTeamPermissions(constants.roleTypes.MANAGER, team, requestingUserObjectId);
				}
				if (!authorised) {
					return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
				}
				// Extract params from body
				({ applicationStatus, applicationStatusDesc } = req.body);
				const finalStatuses = [
					constants.applicationStatuses.SUBMITTED,
					constants.applicationStatuses.APPROVED,
					constants.applicationStatuses.REJECTED,
					constants.applicationStatuses.APPROVEDWITHCONDITIONS,
					constants.applicationStatuses.WITHDRAWN,
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
						accessRecord.workflow.steps = accessRecord.workflow.steps.map(step => {
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
						});
					}
				}
				if (applicationStatusDesc) {
					accessRecord.applicationStatusDesc = inputSanitizer.removeNonBreakingSpaces(applicationStatusDesc);
					isDirty = true;
				}
				// If applicant, allow update to contributors/authors
			} else if (userType === constants.userTypes.APPLICANT) {
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
			// 6. If a change has been made, notify custodian and main applicant
			if (isDirty) {
				await accessRecord.save().catch(err => {
					logger.logError(err, logCategory);
				});

				// If save has succeeded - send notifications
				// Send notifications to added/removed contributors
				if (contributorChange) {
					await this.createNotifications(
						constants.notificationTypes.CONTRIBUTORCHANGE,
						{ newAuthors, currentAuthors },
						accessRecord,
						requestingUser
					);

					let addedAuthors = [...newAuthors].filter(author => !currentAuthors.includes(author));
					await addedAuthors.forEach(addedAuthor =>
						this.activityLogService.logActivity(constants.activityLogEvents.COLLABORATOR_ADDEDD, {
							accessRequest: accessRecord,
							user: req.user,
							collaboratorId: addedAuthor,
						})
					);

					let removedAuthors = [...currentAuthors].filter(author => !newAuthors.includes(author));
					await removedAuthors.forEach(removedAuthor =>
						this.activityLogService.logActivity(constants.activityLogEvents.COLLABORATOR_REMOVED, {
							accessRequest: accessRecord,
							user: req.user,
							collaboratorId: removedAuthor,
						})
					);
				}
				if (statusChange) {
					//Update any connected version trees
					this.dataRequestService.updateVersionStatus(accessRecord, accessRecord.applicationStatus);

					if (accessRecord.applicationStatus === constants.applicationStatuses.APPROVED)
						await this.activityLogService.logActivity(constants.activityLogEvents.APPLICATION_APPROVED, {
							accessRequest: accessRecord,
							user: req.user,
						});
					else if (accessRecord.applicationStatus === constants.applicationStatuses.APPROVEDWITHCONDITIONS) {
						await this.activityLogService.logActivity(constants.activityLogEvents.APPLICATION_APPROVED_WITH_CONDITIONS, {
							accessRequest: accessRecord,
							user: req.user,
						});
					} else if (accessRecord.applicationStatus === constants.applicationStatuses.REJECTED) {
						await this.activityLogService.logActivity(constants.activityLogEvents.APPLICATION_REJECTED, {
							accessRequest: accessRecord,
							user: req.user,
						});
					}

					// Send notifications to custodian team, main applicant and contributors regarding status change
					await this.createNotifications(
						constants.notificationTypes.STATUSCHANGE,
						{ applicationStatus, applicationStatusDesc },
						accessRecord,
						requestingUser
					);
					// Ensure Camunda ends workflow processes given that manager has made final decision
					let { name: dataRequestPublisher } = accessRecord.publisherObj;
					let bpmContext = {
						dataRequestStatus: applicationStatus,
						dataRequestManagerId: requestingUserObjectId.toString(),
						dataRequestPublisher,
						managerApproved: true,
						businessKey: id,
					};
					bpmController.postManagerApproval(bpmContext);
				}
			}
			// 7. Return application
			return res.status(200).json({
				status: 'success',
				data: accessRecord._doc,
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'An error occurred updating the application',
			});
		}
	}

	//DELETE api/v1/data-access-request/:id
	async deleteDraftAccessRequest(req, res) {
		try {
			// 1. Get the required request and body params
			const {
				params: { id: appIdToDelete },
			} = req;
			const requestingUser = req.user;
			const requestingUserId = parseInt(req.user.id);
			const requestingUserObjectId = req.user._id;

			// 2. Retrieve DAR to delete from database
			const appToDelete = await this.dataRequestService.getApplicationWithTeamById(appIdToDelete, { lean: true });

			// 3. Get the requesting users permission levels
			let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(
				appToDelete,
				requestingUserId,
				requestingUserObjectId
			);

			// 4. Return unauthorised message if the requesting user is not an applicant
			if (!authorised || userType !== constants.userTypes.APPLICANT) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}

			// 5. If application is not in progress, actions cannot be performed
			if (appToDelete.applicationStatus !== constants.applicationStatuses.INPROGRESS) {
				return res.status(400).json({
					success: false,
					message: 'This application is no longer in pre-submission status and therefore this action cannot be performed',
				});
			}

			// 6. Delete application
			await this.dataRequestService.deleteApplication(appToDelete).catch(err => {
				logger.logError(err, logCategory);
			});

			// 7. Create notifications
			await this.createNotifications(constants.notificationTypes.APPLICATIONDELETED, {}, appToDelete, requestingUser);

			return res.status(200).json({
				success: true,
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'An error occurred deleting the existing application',
			});
		}
	}

	// ###### ADDITIONAL FORM OPERATIONS #######

	//POST api/v1/data-access-request/:id/clone
	async cloneApplication(req, res) {
		try {
			// 1. Get the required request and body params
			const {
				params: { id },
			} = req;
			const requestingUser = req.user;
			const requestingUserId = parseInt(req.user.id);
			const requestingUserObjectId = req.user._id;
			const { datasetIds = [], datasetTitles = [], publisher = '', appIdToCloneInto = '' } = req.body;
			const { version: requestedVersion } = req.query;

			// 2. Retrieve DAR to clone from database
			let appToClone = await this.dataRequestService.getApplicationWithTeamById(id, { lean: true });

			if (!appToClone) {
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}

			// 3. If invalid version requested to clone, return 404
			const { isValidVersion, requestedMinorVersion } = this.dataRequestService.validateRequestedVersion(appToClone, requestedVersion);
			if (!isValidVersion) {
				return res.status(404).json({ status: 'error', message: 'The requested application version could not be found.' });
			}

			// 4. Get requested amendment iteration details
			const { versionIndex } = this.amendmentService.getAmendmentIterationDetailsByVersion(appToClone, requestedMinorVersion);

			// 5. Get the requesting users permission levels
			let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(appToClone, requestingUserId, requestingUserObjectId);

			// 6. Return unauthorised message if the requesting user is not an applicant
			if (!authorised || userType !== constants.userTypes.APPLICANT) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}

			// 7. Update question answers with modifications since original submission
			appToClone = this.amendmentService.injectAmendments(appToClone, constants.userTypes.APPLICANT, requestingUser, versionIndex);

			// 8. Set up new access record or load presubmission application as provided in request and save
			let clonedAccessRecord = {};
			if (_.isEmpty(appIdToCloneInto)) {
				clonedAccessRecord = await datarequestUtil.cloneIntoNewApplication(appToClone, {
					userId: requestingUserId,
					datasetIds,
					datasetTitles,
					publisher,
				});
				// Save new record
				clonedAccessRecord = await this.dataRequestService.createApplication(clonedAccessRecord).catch(err => {
					logger.logError(err, logCategory);
				});
			} else {
				const appToCloneInto = await this.dataRequestService.getApplicationWithTeamById(appIdToCloneInto, { lean: true });
				// Ensure application to clone into was found
				if (!appToCloneInto) {
					return res.status(404).json({ status: 'error', message: 'Application to clone into not found.' });
				}
				// Get permissions for application to clone into
				let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(
					appToCloneInto,
					requestingUserId,
					requestingUserObjectId
				);
				//  Return unauthorised message if the requesting user is not authorised to the new application
				if (!authorised || userType !== constants.userTypes.APPLICANT) {
					return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
				}
				clonedAccessRecord = await datarequestUtil.cloneIntoExistingApplication(appToClone, appToCloneInto);

				// Save into existing record
				clonedAccessRecord = await this.dataRequestService
					.updateApplicationById(appIdToCloneInto, clonedAccessRecord, { new: true })
					.catch(err => {
						logger.logError(err, logCategory);
					});
			}
			// 9. Create notifications
			await this.createNotifications(
				constants.notificationTypes.APPLICATIONCLONED,
				{ newDatasetTitles: datasetTitles, newApplicationId: clonedAccessRecord._id.toString() },
				appToClone,
				requestingUser
			);

			// 10. Return successful response
			return res.status(200).json({
				success: true,
				accessRecord: clonedAccessRecord,
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'An error occurred cloning the existing application',
			});
		}
	}

	//POST api/v1/data-access-request/:id/actions
	async performAction(req, res) {
		try {
			// 1. Get the required request params
			const {
				params: { id },
			} = req;
			const requestingUserId = parseInt(req.user.id);
			const requestingUserObjectId = req.user._id;
			let { questionId, questionSetId, questionIds = [], mode, separatorText = '' } = req.body;
			if (_.isEmpty(questionId) || _.isEmpty(questionSetId)) {
				return res.status(400).json({
					success: false,
					message: 'You must supply the unique identifiers for the question to perform an action',
				});
			}

			// 2. Retrieve DAR from database
			let accessRecord = await this.dataRequestService.getApplicationWithTeamById(id, { lean: false });
			if (!accessRecord) {
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}

			// 3. If application is not in progress, actions cannot be performed
			if (accessRecord.applicationStatus !== constants.applicationStatuses.INPROGRESS) {
				return res.status(400).json({
					success: false,
					message: 'This application is no longer in pre-submission status and therefore this action cannot be performed',
				});
			}
			// 4. Get the requesting users permission levels
			let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(
				accessRecord.toObject(),
				requestingUserId,
				requestingUserObjectId
			);

			// 5. Return unauthorised message if the requesting user is not an applicant
			if (!authorised || userType !== constants.userTypes.APPLICANT) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}

			// 6. Extract schema and answers
			let { jsonSchema, questionAnswers } = _.cloneDeep(accessRecord);

			// 7. Perform different action depending on mode passed
			switch (mode) {
				case constants.formActions.ADDREPEATABLESECTION:
					const duplicateQuestionSet = dynamicForm.duplicateQuestionSet(questionSetId, jsonSchema);
					jsonSchema = dynamicForm.insertQuestionSet(questionSetId, duplicateQuestionSet, jsonSchema);
					break;
				case constants.formActions.REMOVEREPEATABLESECTION:
					jsonSchema = dynamicForm.removeQuestionSetReferences(questionSetId, questionId, jsonSchema);
					questionAnswers = dynamicForm.removeQuestionSetAnswers(questionId, questionAnswers);
					break;
				case constants.formActions.ADDREPEATABLEQUESTIONS:
					if (_.isEmpty(questionIds)) {
						return res.status(400).json({
							success: false,
							message: 'You must supply the question identifiers to duplicate when performing this action',
						});
					}
					const duplicateQuestions = dynamicForm.duplicateQuestions(questionSetId, questionIds, separatorText, jsonSchema);
					jsonSchema = dynamicForm.insertQuestions(questionSetId, questionId, duplicateQuestions, jsonSchema);
					break;
				case constants.formActions.REMOVEREPEATABLEQUESTIONS:
					if (_.isEmpty(questionIds)) {
						return res.status(400).json({
							success: false,
							message: 'You must supply the question identifiers to remove when performing this action',
						});
					}
					questionIds = [...questionIds, questionId];
					jsonSchema = dynamicForm.removeQuestionReferences(questionSetId, questionIds, jsonSchema);
					questionAnswers = dynamicForm.removeQuestionAnswers(questionIds, questionAnswers);
					break;
				default:
					return res.status(400).json({
						success: false,
						message: 'You must supply a valid action to perform',
					});
			}

			// 8. Update record
			accessRecord.jsonSchema = jsonSchema;
			accessRecord.questionAnswers = questionAnswers;

			// 9. Save changes to database
			await accessRecord.save().catch(err => {
				logger.logError(err, logCategory);
			});

			// 10. Append question actions for in progress applicant
			jsonSchema = datarequestUtil.injectQuestionActions(
				jsonSchema,
				constants.userTypes.APPLICANT, // current user type
				constants.applicationStatuses.INPROGRESS,
				null,
				constants.userTypes.APPLICANT // active party
			);

			// 11. Return necessary object to reflect schema update
			return res.status(200).json({
				success: true,
				accessRecord: {
					jsonSchema,
					questionAnswers,
				},
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'An error occurred updating the application amendment',
			});
		}
	}

	//POST api/v1/data-access-request/:id/amend
	async createAmendment(req, res) {
		try {
			// 1. Get dataSetId from params
			const {
				params: { id },
			} = req;
			const { version: requestedVersion } = req.query;
			const requestingUser = req.user;
			const requestingUserId = parseInt(req.user.id);
			const requestingUserObjectId = req.user._id;

			// 2. Find the matching record and include attached datasets records with publisher details and workflow details
			let accessRecord = await this.dataRequestService.getApplicationById(id);
			if (!accessRecord) {
				return res.status(404).json({ status: 'error', message: 'The application could not be found.' });
			}

			// 3. Check if requesting user is custodian member or applicant/contributor
			const { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(
				accessRecord,
				requestingUserId,
				requestingUserObjectId
			);
			if (!authorised || userType !== constants.userTypes.APPLICANT) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}

			// 4. If invalid version requested, return 404
			const { isValidVersion, requestedMinorVersion } = this.dataRequestService.validateRequestedVersion(accessRecord, requestedVersion);
			if (!isValidVersion) {
				return res.status(404).json({ status: 'error', message: 'The requested application version could not be found.' });
			}

			// 5. Check version is the latest version
			const { isLatestMinorVersion } = this.amendmentService.getAmendmentIterationDetailsByVersion(accessRecord, requestedMinorVersion);
			if (!isLatestMinorVersion) {
				return res
					.status(400)
					.json({ status: 'error', message: 'This action can only be performed against the latest version of an approved application' });
			}

			// 6. Check application is in correct status
			const { applicationStatus } = accessRecord;
			if (
				applicationStatus !== constants.applicationStatuses.APPROVED &&
				applicationStatus !== constants.applicationStatuses.APPROVEDWITHCONDITIONS
			) {
				return res
					.status(400)
					.json({ status: 'error', message: 'This action can only be performed against an application that has been approved' });
			}

			// 7. Update question answers with modifications since original submission (minor version updates)
			accessRecord = this.amendmentService.injectAmendments(accessRecord, constants.userTypes.APPLICANT, requestingUser);

			// 8. Perform amend
			let newAccessRecord = await this.dataRequestService.createAmendment(accessRecord).catch(err => {
				logger.logError(err, logCategory);
			});

			if (!newAccessRecord) {
				return res.status(400).json({ status: 'error', message: 'Creating application amendment failed' });
			}

			// 9. Get amended application (new major version) with all details populated
			newAccessRecord = await this.dataRequestService.getApplicationById(newAccessRecord._id);

			// 10. Return successful response and version details
			return res.status(201).json({
				status: 'success',
				data: {
					_id: newAccessRecord._id,
					newVersion: newAccessRecord.majorVersion,
				},
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'An error occurred opening this data access request application',
			});
		}
	}

	// ###### FILE UPLOAD #######

	//POST api/v1/data-access-request/:id/upload
	async uploadFiles(req, res) {
		try {
			// 1. Get DAR ID
			const {
				params: { id },
			} = req;
			const requestingUserId = parseInt(req.user.id);
			const requestingUserObjectId = req.user._id;
			// 2. Get files
			let files = req.files;
			// 3. Descriptions and uniqueIds file from FE
			let { descriptions, ids } = req.body;
			// 4. Get access record
			let accessRecord = await this.dataRequestService.getApplicationWithTeamById(id, { lean: false });
			if (!accessRecord) {
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}
			// 5. Check if requesting user is custodian member or applicant/contributor
			let { authorised } = datarequestUtil.getUserPermissionsForApplication(accessRecord, requestingUserId, requestingUserObjectId);
			// 6. Check authorisation
			if (!authorised) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}
			// 7. Check files
			if (_.isEmpty(files)) {
				return res.status(400).json({ status: 'error', message: 'No files to upload' });
			}
			// 8. Upload files
			const mediaFiles = await this.dataRequestService
				.uploadFiles(accessRecord, files, descriptions, ids, requestingUserObjectId)
				.catch(err => {
					logger.logError(err, logCategory);
				});
			// 9. return response
			return res.status(200).json({ status: 'success', mediaFiles });
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'An error occurred uploading the file to the application',
			});
		}
	}

	//GET api/v1/data-access-request/:id/file/:fileId/status
	async getFileStatus(req, res) {
		try {
			// 1. get params
			const {
				params: { id, fileId },
			} = req;

			// 2. get AccessRecord
			let accessRecord = await DataRequestModel.findOne({ _id: id });
			if (!accessRecord) {
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}

			// 3. get file
			const fileIndex = accessRecord.files.findIndex(file => file.fileId === fileId);
			if (fileIndex === -1) return res.status(404).json({ status: 'error', message: 'File not found.' });

			// 4. Return successful response
			return res.status(200).json({ status: accessRecord.files[fileIndex].status });
		} catch (err) {
			console.error(err.message);
			res.status(500).json({ status: 'error', message: err.message });
		}
	}

	//GET api/v1/data-access-request/:id/file/:fileId
	async getFile(req, res) {
		try {
			// 1. get params
			const {
				params: { id, fileId },
			} = req;

			// 2. get AccessRecord
			let accessRecord = await DataRequestModel.findOne({ _id: id });
			if (!accessRecord) {
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}
			// 3. process access record into object
			let record = accessRecord._doc;
			// 4. find the file in the files array from db
			let mediaFile =
				record.files.find(f => {
					let { fileId: dbFileId } = f._doc;
					return dbFileId === fileId;
				}) || {};
			// 5. no file return
			if (_.isEmpty(mediaFile)) {
				return res.status(400).json({
					status: 'error',
					message: 'No file to download, please try again later',
				});
			}
			// 6. get the name of the file
			let { name, fileId: dbFileId } = mediaFile._doc;
			// 7. get the file
			await getFile(name, dbFileId, id);
			// 8. send file back to user
			return res.status(200).sendFile(`${process.env.TMPDIR}${id}/${dbFileId}_${name}`);
		} catch (err) {
			console.error(err.message);
			res.status(500).json({ status: 'error', message: err.message });
		}
	}

	//PUT api/v1/data-access-request/:id/vote
	async updateAccessRequestReviewVote(req, res) {
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
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}
			// 3. Check permissions of user is reviewer of associated team
			let authorised = false;
			if (_.has(accessRecord.toObject(), 'publisherObj.team')) {
				let { team } = accessRecord.publisherObj;
				authorised = teamController.checkTeamPermissions(constants.roleTypes.REVIEWER, team.toObject(), userId);
			}
			// 4. Refuse access if not authorised
			if (!authorised) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}
			// 5. Check application is in-review
			let { applicationStatus } = accessRecord;
			if (applicationStatus !== constants.applicationStatuses.INREVIEW) {
				return res.status(400).json({
					success: false,
					message: 'The application status must be set to in review to cast a vote',
				});
			}
			// 6. Ensure a workflow has been attached to this application
			let { workflow } = accessRecord;
			if (!workflow) {
				return res.status(400).json({
					success: false,
					message: 'There is no workflow attached to this application in order to cast a vote',
				});
			}
			// 7. Ensure the requesting user is expected to cast a vote
			let { steps } = workflow;
			let activeStepIndex = steps.findIndex(step => {
				return step.active === true;
			});
			if (!steps[activeStepIndex].reviewers.map(reviewer => reviewer._id.toString()).includes(userId.toString())) {
				return res.status(400).json({
					success: false,
					message: 'You have not been assigned to vote on this review phase',
				});
			}
			//8. Ensure the requesting user has not already voted
			let { recommendations = [] } = steps[activeStepIndex];
			if (recommendations) {
				let found = recommendations.some(rec => {
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
			let bpmContext = workflowController.buildNextStep(userId, accessRecord, activeStepIndex, false);
			// 12. If step is now complete, update database record
			if (bpmContext.stepComplete) {
				accessRecord.workflow.steps[activeStepIndex].active = false;
				accessRecord.workflow.steps[activeStepIndex].completed = true;
				accessRecord.workflow.steps[activeStepIndex].endDateTime = new Date();
			}
			// 13. If it was not the final phase that was completed, move to next step in database
			if (!bpmContext.finalPhaseApproved) {
				accessRecord.workflow.steps[activeStepIndex + 1].active = true;
				accessRecord.workflow.steps[activeStepIndex + 1].startDateTime = new Date();
			}
			// 14. Update MongoDb record for DAR
			await accessRecord.save(async err => {
				if (err) {
					console.error(err.message);
					res.status(500).json({ status: 'error', message: err.message });
				} else {
					// 15. Create emails and notifications
					let relevantStepIndex = 0,
						relevantNotificationType = '';
					if (bpmContext.stepComplete && !bpmContext.finalPhaseApproved) {
						// Create notifications to reviewers of the next step that has been activated
						relevantStepIndex = activeStepIndex + 1;
						relevantNotificationType = constants.notificationTypes.REVIEWSTEPSTART;
					} else if (bpmContext.stepComplete && bpmContext.finalPhaseApproved) {
						// Create notifications to managers that the application is awaiting final approval
						relevantStepIndex = activeStepIndex;
						relevantNotificationType = constants.notificationTypes.FINALDECISIONREQUIRED;
					}
					// Continue only if notification required
					if (!_.isEmpty(relevantNotificationType)) {
						const emailContext = workflowController.getWorkflowEmailContext(accessRecord, workflow, relevantStepIndex);
						module.exports.createNotifications(relevantNotificationType, emailContext, accessRecord, req.user);
					}
					// 16. Call Camunda controller to update workflow process
					bpmController.postCompleteReview(bpmContext);
				}
			});
			// 17. Return aplication and successful response
			return res.status(200).json({ status: 'success', data: accessRecord._doc });
		} catch (err) {
			console.error(err.message);
			res.status(500).json({ status: 'error', message: err.message });
		}
	}

	//PUT api/v1/data-access-request/:id/stepoverride
	async updateAccessRequestStepOverride(req, res){
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
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}
			// 3. Check permissions of user is manager of associated team
			let authorised = false;
			if (_.has(accessRecord.toObject(), 'publisherObj.team')) {
				let { team } = accessRecord.publisherObj;
				authorised = teamController.checkTeamPermissions(constants.roleTypes.MANAGER, team.toObject(), userId);
			}
			// 4. Refuse access if not authorised
			if (!authorised) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}
			// 5. Check application is in review state
			let { applicationStatus } = accessRecord;
			if (applicationStatus !== constants.applicationStatuses.INREVIEW) {
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
			let activeStepIndex = steps.findIndex(step => {
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
			let bpmContext = workflowController.buildNextStep(userId, accessRecord, activeStepIndex, true);
			// 10. If it was not the final phase that was completed, move to next step
			if (!bpmContext.finalPhaseApproved) {
				accessRecord.workflow.steps[activeStepIndex + 1].active = true;
				accessRecord.workflow.steps[activeStepIndex + 1].startDateTime = new Date();
			}
			// 11. Save changes to the DAR
			await accessRecord.save(async err => {
				if (err) {
					console.error(err.message);
					res.status(500).json({ status: 'error', message: err.message });
				} else {
					// 12. Gather context for notifications (active step)
					let emailContext = workflowController.getWorkflowEmailContext(accessRecord, workflow, activeStepIndex);
					// 13. Create notifications to reviewers of the step that has been completed
					module.exports.createNotifications(constants.notificationTypes.STEPOVERRIDE, emailContext, accessRecord, req.user);
					// 14. Create emails and notifications
					let relevantStepIndex = 0,
						relevantNotificationType = '';
					if (bpmContext.finalPhaseApproved) {
						// Create notifications to managers that the application is awaiting final approval
						relevantStepIndex = activeStepIndex;
						relevantNotificationType = constants.notificationTypes.FINALDECISIONREQUIRED;
					} else {
						// Create notifications to reviewers of the next step that has been activated
						relevantStepIndex = activeStepIndex + 1;
						relevantNotificationType = constants.notificationTypes.REVIEWSTEPSTART;
					}
					// Get the email context only if required
					if (relevantStepIndex !== activeStepIndex) {
						emailContext = workflowController.getWorkflowEmailContext(accessRecord, workflow, relevantStepIndex);
					}
					module.exports.createNotifications(relevantNotificationType, emailContext, accessRecord, req.user);
					// 15. Call Camunda controller to start manager review process
					bpmController.postCompleteReview(bpmContext);
				}
			});
			// 16. Return aplication and successful response
			return res.status(200).json({ status: 'success' });
		} catch (err) {
			console.error(err.message);
			res.status(500).json({ status: 'error', message: err.message });
		}
	}

	//PUT api/v1/data-access-request/:id/deletefile
	async updateAccessRequestDeleteFile(req, res){
		try {
			const {
				params: { id },
			} = req;

			// 1. Id of the file to delete
			let { fileId } = req.body;

			// 2. Find the relevant data request application
			let accessRecord = await DataRequestModel.findOne({ _id: id });

			if (!accessRecord) {
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}

			// 4. Ensure single datasets are mapped correctly into array
			if (_.isEmpty(accessRecord.datasets)) {
				accessRecord.datasets = [accessRecord.dataset];
			}

			// 5. If application is not in progress, actions cannot be performed
			if (accessRecord.applicationStatus !== constants.applicationStatuses.INPROGRESS) {
				return res.status(400).json({
					success: false,
					message: 'This application is no longer in pre-submission status and therefore this action cannot be performed',
				});
			}

			// 6. Get the requesting users permission levels
			let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(accessRecord.toObject(), req.user.id, req.user._id);
			// 7. Return unauthorised message if the requesting user is not an applicant
			if (!authorised || userType !== constants.userTypes.APPLICANT) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}

			// 8. Remove the file from the application
			const newFileList = accessRecord.files.filter(file => file.fileId !== fileId);

			accessRecord.files = newFileList;

			// 9. write back into mongo
			await accessRecord.save();

			// 10. Return successful response
			return res.status(200).json({ status: 'success' });
		} catch (err) {
			console.error(err.message);
			res.status(500).json({ status: 'error', message: err.message });
		}
	}

	//POST api/v1/data-access-request/:id
  async	submitAccessRequestById(req, res){
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
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}
			// 3. Check user type and authentication to submit application
			let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(accessRecord, req.user.id, req.user._id);
			if (!authorised) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}
			// 4. Ensure single datasets are mapped correctly into array (backward compatibility for single dataset applications)
			if (_.isEmpty(accessRecord.datasets)) {
				accessRecord.datasets = [accessRecord.dataset];
			}
			// 5. Perform either initial submission or resubmission depending on application status
			if (accessRecord.applicationStatus === constants.applicationStatuses.INPROGRESS) {
				accessRecord = module.exports.doInitialSubmission(accessRecord);
			} else if (
				accessRecord.applicationStatus === constants.applicationStatuses.INREVIEW ||
				accessRecord.applicationStatus === constants.applicationStatuses.SUBMITTED
			) {
				accessRecord = amendmentController.doResubmission(accessRecord.toObject(), req.user._id.toString());
			}
			// 6. Ensure a valid submission is taking place
			if (_.isNil(accessRecord.submissionType)) {
				return res.status(400).json({
					status: 'error',
					message: 'Application cannot be submitted as it has reached a final decision status.',
				});
			}
			// 7. Save changes to db
			await DataRequestModel.replaceOne({ _id: id }, accessRecord, async err => {
				if (err) {
					console.error(err.message);
					return res.status(500).json({
						status: 'error',
						message: 'An error occurred saving the changes',
					});
				} else {
					// 8. Send notifications and emails with amendments
					accessRecord = amendmentController.injectAmendments(accessRecord, userType, req.user);
					await module.exports.createNotifications(
						accessRecord.submissionType === constants.submissionTypes.INITIAL
							? constants.notificationTypes.SUBMITTED
							: constants.notificationTypes.RESUBMITTED,
						{},
						accessRecord,
						req.user
					);
					// 9. Start workflow process in Camunda if publisher requires it and it is the first submission
					if (accessRecord.workflowEnabled && accessRecord.submissionType === constants.submissionTypes.INITIAL) {
						let {
							publisherObj: { name: publisher },
							dateSubmitted,
						} = accessRecord;
						let bpmContext = {
							dateSubmitted,
							applicationStatus: constants.applicationStatuses.SUBMITTED,
							publisher,
							businessKey: id,
						};
						bpmController.postStartPreReview(bpmContext);
					}
				}
			});
			// 10. Return aplication and successful response
			return res.status(200).json({ status: 'success', data: accessRecord._doc });
		} catch (err) {
			console.error(err.message);
			res.status(500).json({ status: 'error', message: err.message });
		}
	}

	doInitialSubmission(accessRecord){
		// 1. Update application to submitted status
		accessRecord.submissionType = constants.submissionTypes.INITIAL;
		accessRecord.applicationStatus = constants.applicationStatuses.SUBMITTED;
		// 2. Check if workflow/5 Safes based application, set final status date if status will never change again
		if (_.has(accessRecord.datasets[0].toObject(), 'publisher') && !_.isNull(accessRecord.datasets[0].publisher)) {
			if (!accessRecord.datasets[0].publisher.workflowEnabled) {
				accessRecord.dateFinalStatus = new Date();
				accessRecord.workflowEnabled = false;
			} else {
				accessRecord.workflowEnabled = true;
			}
		}
		let dateSubmitted = new Date();
		accessRecord.dateSubmitted = dateSubmitted;
		// 3. Return updated access record for saving
		return accessRecord;
	}

	//POST api/v1/data-access-request/:id/email
	 async mailDataAccessRequestInfoById(req, res){
		try {
			// 1. Get the required request params
			const {
				params: { id },
			} = req;

			// 2. Retrieve DAR from database
			let accessRecord = await DataRequestModel.findOne({ _id: id }).populate([
				{
					path: 'datasets dataset',
				},
				{
					path: 'mainApplicant',
				},
			]);

			if (!accessRecord) {
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}

			// 3. Ensure single datasets are mapped correctly into array
			if (_.isEmpty(accessRecord.datasets)) {
				accessRecord.datasets = [accessRecord.dataset];
			}

			// 4. If application is not in progress, actions cannot be performed
			if (accessRecord.applicationStatus !== constants.applicationStatuses.INPROGRESS) {
				return res.status(400).json({
					success: false,
					message: 'This application is no longer in pre-submission status and therefore this action cannot be performed',
				});
			}

			// 5. Get the requesting users permission levels
			let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(accessRecord.toObject(), req.user.id, req.user._id);
			// 6. Return unauthorised message if the requesting user is not an applicant
			if (!authorised || userType !== constants.userTypes.APPLICANT) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}

			// 7. Send notification to the authorised user
			module.exports.createNotifications(constants.notificationTypes.INPROGRESS, {}, accessRecord, req.user);

			return res.status(200).json({ status: 'success' });
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: 'An error occurred',
			});
		}
	}

	//POST api/v1/data-access-request/:id/notify
	async notifyAccessRequestById(req, res){
		// 1. Get the required request params
		const {
			params: { id },
		} = req;
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
			return res.status(404).json({ status: 'error', message: 'Application not found.' });
		}
		let { workflow } = accessRecord;
		if (_.isEmpty(workflow)) {
			return res.status(400).json({
				status: 'error',
				message: 'There is no workflow attached to this application.',
			});
		}
		let activeStepIndex = workflow.steps.findIndex(step => {
			return step.active === true;
		});
		// 3. Determine email context if deadline has elapsed or is approaching
		const emailContext = workflowController.getWorkflowEmailContext(accessRecord, workflow, activeStepIndex);
		// 4. Send emails based on deadline elapsed or approaching
		if (emailContext.deadlineElapsed) {
			module.exports.createNotifications(constants.notificationTypes.DEADLINEPASSED, emailContext, accessRecord, req.user);
		} else {
			module.exports.createNotifications(constants.notificationTypes.DEADLINEWARNING, emailContext, accessRecord, req.user);
		}
		return res.status(200).json({ status: 'success' });
	}

	//POST api/v1/data-access-request/:id/actions
	async performAction(req, res){
		try {
			// 1. Get the required request params
			const {
				params: { id },
			} = req;
			let { questionId, questionSetId, questionIds = [], mode, separatorText = '' } = req.body;
			if (_.isEmpty(questionId) || _.isEmpty(questionSetId)) {
				return res.status(400).json({
					success: false,
					message: 'You must supply the unique identifiers for the question to perform an action',
				});
			}
			// 2. Retrieve DAR from database
			let accessRecord = await DataRequestModel.findOne({ _id: id }).populate([
				{
					path: 'datasets dataset',
				},
				{
					path: 'publisherObj',
					populate: {
						path: 'team',
						populate: {
							path: 'users',
						},
					},
				},
			]);
			if (!accessRecord) {
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}
			// 3. If application is not in progress, actions cannot be performed
			if (accessRecord.applicationStatus !== constants.applicationStatuses.INPROGRESS) {
				return res.status(400).json({
					success: false,
					message: 'This application is no longer in pre-submission status and therefore this action cannot be performed',
				});
			}
			// 4. Get the requesting users permission levels
			let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(accessRecord.toObject(), req.user.id, req.user._id);
			// 5. Return unauthorised message if the requesting user is not an applicant
			if (!authorised || userType !== constants.userTypes.APPLICANT) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}
			// 6. Extract schema and answers
			let { jsonSchema, questionAnswers } = _.cloneDeep(accessRecord);
			// 7. Perform different action depending on mode passed
			switch (mode) {
				case constants.formActions.ADDREPEATABLESECTION:
					let duplicateQuestionSet = dynamicForm.duplicateQuestionSet(questionSetId, jsonSchema);
					jsonSchema = dynamicForm.insertQuestionSet(questionSetId, duplicateQuestionSet, jsonSchema);
					break;
				case constants.formActions.REMOVEREPEATABLESECTION:
					jsonSchema = dynamicForm.removeQuestionSetReferences(questionSetId, questionId, jsonSchema);
					questionAnswers = dynamicForm.removeQuestionSetAnswers(questionId, questionAnswers);
					break;
				case constants.formActions.ADDREPEATABLEQUESTIONS:
					if (_.isEmpty(questionIds)) {
						return res.status(400).json({
							success: false,
							message: 'You must supply the question identifiers to duplicate when performing this action',
						});
					}
					let duplicateQuestions = dynamicForm.duplicateQuestions(questionSetId, questionIds, separatorText, jsonSchema);
					jsonSchema = dynamicForm.insertQuestions(questionSetId, questionId, duplicateQuestions, jsonSchema);
					break;
				case constants.formActions.REMOVEREPEATABLEQUESTIONS:
					if (_.isEmpty(questionIds)) {
						return res.status(400).json({
							success: false,
							message: 'You must supply the question identifiers to remove when performing this action',
						});
					}
					questionIds = [...questionIds, questionId];
					jsonSchema = dynamicForm.removeQuestionReferences(questionSetId, questionIds, jsonSchema);
					questionAnswers = dynamicForm.removeQuestionAnswers(questionIds, questionAnswers);
					break;
				default:
					return res.status(400).json({
						success: false,
						message: 'You must supply a valid action to perform',
					});
			}
			// 8. Update record
			accessRecord.jsonSchema = jsonSchema;
			accessRecord.questionAnswers = questionAnswers;
			// 9. Save changes to database
			await accessRecord.save(async err => {
				if (err) {
					console.error(err.message);
					return res.status(500).json({ status: 'error', message: err.message });
				} else {
					// 10. Append question actions for in progress applicant
					jsonSchema = datarequestUtil.injectQuestionActions(
						jsonSchema,
						constants.userTypes.APPLICANT, // current user type
						constants.applicationStatuses.INPROGRESS,
						null,
						constants.userTypes.APPLICANT // active party
					);
					// 11. Return necessary object to reflect schema update
					return res.status(200).json({
						success: true,
						accessRecord: {
							jsonSchema,
							questionAnswers,
						},
					});
				}
			});
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: 'An error occurred updating the application amendment',
			});
		}
	}

	//POST api/v1/data-access-request/:id/clone
	 async  cloneApplication(req, res){
		try {
			// 1. Get the required request and body params
			const {
				params: { id: appIdToClone },
			} = req;
			const { datasetIds = [], datasetTitles = [], publisher = '', appIdToCloneInto = '' } = req.body;

			// 2. Retrieve DAR to clone from database
			let appToClone = await DataRequestModel.findOne({ _id: appIdToClone })
				.populate([
					{
						path: 'datasets dataset authors',
					},
					{
						path: 'mainApplicant',
					},
					{
						path: 'publisherObj',
						populate: {
							path: 'team',
							populate: {
								path: 'users',
							},
						},
					},
				])
				.lean();
			if (!appToClone) {
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}

			// 3. Get the requesting users permission levels
			let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(appToClone, req.user.id, req.user._id);

			// 4. Return unauthorised message if the requesting user is not an applicant
			if (!authorised || userType !== constants.userTypes.APPLICANT) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}

			// 5. Update question answers with modifications since original submission
			appToClone = amendmentController.injectAmendments(appToClone, constants.userTypes.APPLICANT, req.user);

			// 6. Create callback function used to complete the save process
			const saveCallBack = (err, doc) => {
				if (err) {
					console.error(err.message);
					return res.status(500).json({ status: 'error', message: err.message });
				}

				// Create notifications
				module.exports.createNotifications(
					constants.notificationTypes.APPLICATIONCLONED,
					{ newDatasetTitles: datasetTitles, newApplicationId: doc._id.toString() },
					appToClone,
					req.user
				);

				// Return successful response
				return res.status(200).json({
					success: true,
					accessRecord: doc,
				});
			};

			// 7. Set up new access record or load presubmission application as provided in request and save
			let clonedAccessRecord = {};
			if (_.isEmpty(appIdToCloneInto)) {
				clonedAccessRecord = await datarequestUtil.cloneIntoNewApplication(appToClone, {
					userId: req.user.id,
					datasetIds,
					datasetTitles,
					publisher,
				});
				// Save new record
				await DataRequestModel.create(clonedAccessRecord, saveCallBack);
			} else {
				let appToCloneInto = await DataRequestModel.findOne({ _id: appIdToCloneInto })
					.populate([
						{
							path: 'datasets dataset authors',
						},
						{
							path: 'mainApplicant',
						},
						{
							path: 'publisherObj',
							populate: {
								path: 'team',
								populate: {
									path: 'users',
								},
							},
						},
					])
					.lean();
				// Ensure application to clone into was found
				if (!appToCloneInto) {
					return res.status(404).json({ status: 'error', message: 'Application to clone into not found.' });
				}
				// Get permissions for application to clone into
				let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(appToCloneInto, req.user.id, req.user._id);
				//  Return unauthorised message if the requesting user is not authorised to the new application
				if (!authorised || userType !== constants.userTypes.APPLICANT) {
					return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
				}
				clonedAccessRecord = await datarequestUtil.cloneIntoExistingApplication(appToClone, appToCloneInto);

				// Save into existing record
				await DataRequestModel.findOneAndUpdate({ _id: appIdToCloneInto }, clonedAccessRecord, { new: true }, saveCallBack);
			}
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: 'An error occurred cloning the existing application',
			});
		}
	}

	async  updateFileStatus(req, res){
		try {
			// 1. Get the required request params
			const {
				params: { id, fileId },
			} = req;

			let { status } = req.body;

			// 2. Find the relevant data request application
			let accessRecord = await DataRequestModel.findOne({ _id: id });

			if (!accessRecord) {
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}

			//3. Check the status is valid
			if (
				status !== fileStatus.UPLOADED &&
				status !== fileStatus.SCANNED &&
				status !== fileStatus.ERROR &&
				status !== fileStatus.QUARANTINED
			) {
				return res.status(400).json({ status: 'error', message: 'File status not valid' });
			}

			//4. get the file
			const fileIndex = accessRecord.files.findIndex(file => file.fileId === fileId);
			if (fileIndex === -1) return res.status(404).json({ status: 'error', message: 'File not found.' });

			//5. update the status
			accessRecord.files[fileIndex].status = status;

			//6. write back into mongo
			await accessRecord.save();

			return res.status(200).json({
				success: true,
			});
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: err.message,
			});
		}
	}

	// API DELETE api/v1/data-access-request/:id
	async deleteDraftAccessRequest(req, res){
		try {
			// 1. Get the required request and body params
			const {
				params: { id: appIdToDelete },
			} = req;

			// 2. Retrieve DAR to clone from database
			let appToDelete = await DataRequestModel.findOne({ _id: appIdToDelete }).populate([
				{
					path: 'datasets dataset authors',
				},
				{
					path: 'mainApplicant',
				},
				{
					path: 'publisherObj',
					populate: {
						path: 'team',
						populate: {
							path: 'users',
						},
					},
				},
			]);

			// 3. Get the requesting users permission levels
			let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(appToDelete, req.user.id, req.user._id);

			// 4. Return unauthorised message if the requesting user is not an applicant
			if (!authorised || userType !== constants.userTypes.APPLICANT) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}

			// 5. If application is not in progress, actions cannot be performed
			if (appToDelete.applicationStatus !== constants.applicationStatuses.INPROGRESS) {
				return res.status(400).json({
					success: false,
					message: 'This application is no longer in pre-submission status and therefore this action cannot be performed',
				});
			}

			// 6. Delete applicatioin
			DataRequestModel.findOneAndDelete({ _id: appIdToDelete }, err => {
				if (err) console.error(err.message);
			});

			// 7. Create notifications
			await module.exports.createNotifications(constants.notificationTypes.APPLICATIONDELETED, {}, appToDelete, req.user);

			return res.status(200).json({
				success: true,
			});
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: 'An error occurred deleting the existing application',
			});
		}
	}

	 async  createNotifications(type, context, accessRecord, user){
		// Project details from about application if 5 Safes
		let { aboutApplication = {} } = accessRecord;
		let { projectName = 'No project name set' } = aboutApplication;
		let { projectId, _id, workflow = {}, dateSubmitted = '', jsonSchema, questionAnswers, createdAt } = accessRecord;
		if (_.isEmpty(projectId)) {
			projectId = _id;
		}
		let { pages, questionPanels, questionSets: questions } = jsonSchema;
		// Publisher details from single dataset
		let {
			datasetfields: { contactPoint, publisher },
		} = accessRecord.datasets[0];
		let datasetTitles = accessRecord.datasets.map(dataset => dataset.name).join(', ');
		// Main applicant (user obj)
		let { firstname: appFirstName, lastname: appLastName, email: appEmail } = accessRecord.mainApplicant;
		// Requesting user
		let { firstname, lastname } = user;
		// Instantiate default params
		let custodianManagers = [],
			custodianUserIds = [],
			managerUserIds = [],
			emailRecipients = [],
			options = {},
			html = '',
			attachmentContent = '',
			filename = '',
			jsonContent = {},
			authors = [],
			teamNotifications = {},
			teamNotificationEmails = [],
			subscribedEmails = [],
			memberOptedInEmails = [],
			optIn = false,
			attachments = [];
		let applicants = datarequestUtil.extractApplicantNames(questionAnswers).join(', ');
		// Fall back for single applicant on short application form
		if (_.isEmpty(applicants)) {
			applicants = `${appFirstName} ${appLastName}`;
		}
		// Get authors/contributors (user obj)
		if (!_.isEmpty(accessRecord.authors)) {
			authors = accessRecord.authors.map(author => {
				let { firstname, lastname, email, id } = author;
				return { firstname, lastname, email, id };
			});
		}
		// Deconstruct workflow context if passed
		let {
			workflowName = '',
			steps = [],
			stepName = '',
			reviewerNames = '',
			reviewSections = '',
			nextStepName = '',
			stepReviewers = [],
			stepReviewerUserIds = [],
			currentDeadline = '',
			remainingReviewers = [],
			remainingReviewerUserIds = [],
			dateDeadline,
		} = context;

		switch (type) {
			case constants.notificationTypes.INPROGRESS:
				await notificationBuilder.triggerNotificationMessage(
					[user.id],
					`An email with the data access request info for ${datasetTitles} has been sent to you`,
					'data access request',
					accessRecord._id
				);

				options = {
					userType: '',
					userEmail: appEmail,
					publisher,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
					userType: 'applicant',
					submissionType: constants.submissionTypes.INPROGRESS,
				};

				// Build email template
				({ html, jsonContent } = await emailGenerator.generateEmail(
					aboutApplication,
					questions,
					pages,
					questionPanels,
					questionAnswers,
					options
				));
				await emailGenerator.sendEmail(
					[user],
					`${i18next.t('translation:email.sender')}`,
					`Data Access Request in progress for ${datasetTitles}`,
					html,
					false,
					attachments
				);
				break;
			case constants.notificationTypes.STATUSCHANGE:
				// 1. Create notifications
				// Custodian manager and current step reviewer notifications
				if (_.has(accessRecord.datasets[0].toObject(), 'publisher.team.users')) {
					// Retrieve all custodian manager user Ids and active step reviewers
					custodianManagers = teamController.getTeamMembersByRole(accessRecord.datasets[0].publisher.team, constants.roleTypes.MANAGER);
					let activeStep = workflowController.getActiveWorkflowStep(workflow);
					stepReviewers = workflowController.getStepReviewers(activeStep);
					// Create custodian notification
					let statusChangeUserIds = [...custodianManagers, ...stepReviewers].map(user => user.id);
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
						authors.map(author => author.id),
						`A Data Access Request you are contributing to for ${datasetTitles} was ${context.applicationStatus} by ${publisher}`,
						'data access request',
						accessRecord._id
					);
				}

				// 2. Send emails to relevant users
				// Aggregate objects for custodian and applicant
				emailRecipients = [accessRecord.mainApplicant, ...custodianManagers, ...stepReviewers, ...accessRecord.authors];
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
					`${i18next.t('translation:email.sender')}`,
					`Data Access Request for ${datasetTitles} was ${context.applicationStatus} by ${publisher}`,
					html,
					false
				);
				break;
			case constants.notificationTypes.SUBMITTED:
				// 1. Create notifications
				// Custodian notification
				if (_.has(accessRecord.datasets[0].toObject(), 'publisher.team.users')) {
					// Retrieve all custodian user Ids to generate notifications
					custodianManagers = teamController.getTeamMembersByRole(accessRecord.datasets[0].publisher.team, constants.roleTypes.MANAGER);
					// Retrieve notifications for the team based on type return {notificationType, subscribedEmails, optIn}
					teamNotifications = teamController.getTeamNotificationByType(
						accessRecord.datasets[0].publisher.team,
						constants.teamNotificationTypes.DATAACCESSREQUEST
					);
					// only deconstruct if team notifications object returns - safeguard code
					if (!_.isEmpty(teamNotifications)) {
						// Get teamNotification emails if optIn true
						({ optIn = false, subscribedEmails = [] } = teamNotifications);
						// check subscribedEmails and optIn send back emails or blank []
						teamNotificationEmails = teamController.getTeamNotificationEmails(optIn, subscribedEmails);
					}
					// check the custodianManagers personal emails preferences against the team notifications settings exclude if necessary
					memberOptedInEmails = teamController.buildOptedInEmailList(
						custodianManagers,
						accessRecord.datasets[0].publisher.team,
						constants.teamNotificationTypes.DATAACCESSREQUEST
					);
					// check if publisher.team has email notifications
					custodianUserIds = custodianManagers.map(user => user.id);
					await notificationBuilder.triggerNotificationMessage(
						custodianUserIds,
						`A Data Access Request has been submitted to ${publisher} for ${datasetTitles} by ${appFirstName} ${appLastName}`,
						'data access request received',
						accessRecord._id,
						accessRecord.datasets[0].publisher.name
					);
				} else {
					const dataCustodianEmail = process.env.DATA_CUSTODIAN_EMAIL || contactPoint;
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
						accessRecord.authors.map(author => author.id),
						`A Data Access Request you are contributing to for ${datasetTitles} was successfully submitted to ${publisher} by ${firstname} ${lastname}`,
						'data access request',
						accessRecord._id
					);
				}
				// 2. Send emails to custodian and applicant
				// Create object to pass to email generator
				options = {
					userType: '',
					userEmail: appEmail,
					publisher,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
					id: accessRecord._id,
				};
				// Iterate through the recipient types
				for (let emailRecipientType of constants.submissionEmailRecipientTypes) {
					// Establish email context object
					options = {
						...options,
						userType: emailRecipientType,
						submissionType: constants.submissionTypes.INITIAL,
					};
					// Build email template
					({ html, jsonContent } = await emailGenerator.generateEmail(
						aboutApplication,
						questions,
						pages,
						questionPanels,
						questionAnswers,
						options
					));
					// Send emails to custodian team members who have opted in to email notifications
					if (emailRecipientType === 'dataCustodian') {
						// Get all custodian managers for the team / team Notifications
						if (!_.isEmpty(teamNotificationEmails)) {
							emailRecipients = [...memberOptedInEmails, ...teamNotificationEmails];
						} else {
							emailRecipients = [...memberOptedInEmails];
						}
						// Generate json attachment for external system integration
						attachmentContent = Buffer.from(JSON.stringify({ id: accessRecord._id, ...jsonContent })).toString('base64');
						filename = `${helper.generateFriendlyId(accessRecord._id)} ${moment().format().toString()}.json`;
						attachments = [await emailGenerator.generateAttachment(filename, attachmentContent, 'application/json')];
					} else {
						// Send email to main applicant and contributors if they have opted in to email notifications
						emailRecipients = [accessRecord.mainApplicant, ...accessRecord.authors];
					}
					// Send email
					if (!_.isEmpty(emailRecipients)) {
						await emailGenerator.sendEmail(
							emailRecipients,
							`${i18next.t('translation:email.sender')}`,
							`Data Access Request has been submitted to ${publisher} for ${datasetTitles}`,
							html,
							false,
							attachments
						);
					}
				}
				break;
			case constants.notificationTypes.RESUBMITTED:
				// 1. Create notifications
				// Custodian notification
				if (_.has(accessRecord.datasets[0], 'publisher.team.users')) {
					// Retrieve all custodian user Ids to generate notifications
					custodianManagers = teamController.getTeamMembersByRole(accessRecord.datasets[0].publisher.team, constants.roleTypes.MANAGER);
					custodianUserIds = custodianManagers.map(user => user.id);
					await notificationBuilder.triggerNotificationMessage(
						custodianUserIds,
						`A Data Access Request has been resubmitted with updates to ${publisher} for ${datasetTitles} by ${appFirstName} ${appLastName}`,
						'data access request',
						accessRecord._id
					);
				} else {
					const dataCustodianEmail = process.env.DATA_CUSTODIAN_EMAIL || contactPoint;
					custodianManagers = [{ email: dataCustodianEmail }];
				}
				// Applicant notification
				await notificationBuilder.triggerNotificationMessage(
					[accessRecord.userId],
					`Your Data Access Request for ${datasetTitles} was successfully resubmitted with updates to ${publisher}`,
					'data access request',
					accessRecord._id
				);
				// Contributors/authors notification
				if (!_.isEmpty(authors)) {
					await notificationBuilder.triggerNotificationMessage(
						accessRecord.authors.map(author => author.id),
						`A Data Access Request you are contributing to for ${datasetTitles} was successfully resubmitted with updates to ${publisher} by ${firstname} ${lastname}`,
						'data access request',
						accessRecord._id
					);
				}
				// 2. Send emails to custodian and applicant
				// Create object to pass to email generator
				options = {
					userType: '',
					userEmail: appEmail,
					publisher,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
					id: accessRecord._id,
				};
				// Iterate through the recipient types
				for (let emailRecipientType of constants.submissionEmailRecipientTypes) {
					// Establish email context object
					options = {
						...options,
						userType: emailRecipientType,
						submissionType: constants.submissionTypes.RESUBMISSION,
					};
					// Build email template
					({ html, jsonContent } = await emailGenerator.generateEmail(
						aboutApplication,
						questions,
						pages,
						questionPanels,
						questionAnswers,
						options
					));
					// Send emails to custodian team members who have opted in to email notifications
					if (emailRecipientType === 'dataCustodian') {
						emailRecipients = [...custodianManagers];
						// Generate json attachment for external system integration
						attachmentContent = Buffer.from(JSON.stringify({ id: accessRecord._id, ...jsonContent })).toString('base64');
						filename = `${helper.generateFriendlyId(accessRecord._id)} ${moment().format().toString()}.json`;
						attachments = [await emailGenerator.generateAttachment(filename, attachmentContent, 'application/json')];
					} else {
						// Send email to main applicant and contributors if they have opted in to email notifications
						emailRecipients = [accessRecord.mainApplicant, ...accessRecord.authors];
					}
					// Send email
					if (!_.isEmpty(emailRecipients)) {
						await emailGenerator.sendEmail(
							emailRecipients,
							`${i18next.t('translation:email.sender')}`,
							`Data Access Request to ${publisher} for ${datasetTitles} has been updated with updates`,
							html,
							false,
							attachments
						);
					}
				}
				break;
			case constants.notificationTypes.CONTRIBUTORCHANGE:
				// 1. Deconstruct authors array from context to compare with existing Mongo authors
				const { newAuthors, currentAuthors } = context;
				// 2. Determine authors who have been removed
				let addedAuthors = [...newAuthors].filter(author => !currentAuthors.includes(author));
				// 3. Determine authors who have been added
				let removedAuthors = [...currentAuthors].filter(author => !newAuthors.includes(author));
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
						addedUsers.map(user => user.id),
						`You have been added as a contributor for a Data Access Request to ${publisher} by ${firstname} ${lastname}`,
						'data access request',
						accessRecord._id
					);
					await emailGenerator.sendEmail(
						addedUsers,
						`${i18next.t('translation:email.sender')}`,
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
						removedUsers.map(user => user.id),
						`You have been removed as a contributor from a Data Access Request to ${publisher} by ${firstname} ${lastname}`,
						'data access request unlinked',
						accessRecord._id
					);
					await emailGenerator.sendEmail(
						removedUsers,
						`${i18next.t('translation:email.sender')}`,
						`You have been removed as a contributor from a Data Access Request to ${publisher} by ${firstname} ${lastname}`,
						html,
						false
					);
				}
				break;
			case constants.notificationTypes.STEPOVERRIDE:
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
					`${i18next.t('translation:email.sender')}`,
					`${firstname} ${lastname} has approved a Data Access Request application phase that you were assigned to review`,
					html,
					false
				);
				break;
			case constants.notificationTypes.REVIEWSTEPSTART:
				// 1. Create reviewer notifications
				notificationBuilder.triggerNotificationMessage(
					stepReviewerUserIds,
					`You are required to review a new Data Access Request application for ${publisher} by ${moment(currentDeadline).format(
						'D MMM YYYY HH:mm'
					)}`,
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
					`${i18next.t('translation:email.sender')}`,
					`You are required to review a new Data Access Request application for ${publisher} by ${moment(currentDeadline).format(
						'D MMM YYYY HH:mm'
					)}`,
					html,
					false
				);
				break;
			case constants.notificationTypes.FINALDECISIONREQUIRED:
				// 1. Get managers for publisher
				custodianManagers = teamController.getTeamMembersByRole(accessRecord.publisherObj.team, constants.roleTypes.MANAGER);
				managerUserIds = custodianManagers.map(user => user.id);

				// 2. Create manager notifications
				notificationBuilder.triggerNotificationMessage(
					managerUserIds,
					`Action is required as a Data Access Request application for ${publisher} is now awaiting a final decision`,
					'data access request',
					accessRecord._id
				);
				// 3. Create manager emails
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
					`${i18next.t('translation:email.sender')}`,
					`Action is required as a Data Access Request application for ${publisher} is now awaiting a final decision`,
					html,
					false
				);
				break;
			case constants.notificationTypes.DEADLINEWARNING:
				// 1. Create reviewer notifications
				await notificationBuilder.triggerNotificationMessage(
					remainingReviewerUserIds,
					`The deadline is approaching for a Data Access Request application you are reviewing`,
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
					workflowName,
					stepName,
					reviewSections,
					reviewerNames,
					nextStepName,
					dateDeadline,
				};
				html = await emailGenerator.generateReviewDeadlineWarning(options);
				await emailGenerator.sendEmail(
					remainingReviewers,
					`${i18next.t('translation:email.sender')}`,
					`The deadline is approaching for a Data Access Request application you are reviewing`,
					html,
					false
				);
				break;
			case constants.notificationTypes.DEADLINEPASSED:
				// 1. Get all managers
				custodianManagers = teamController.getTeamMembersByRole(accessRecord.publisherObj.team, constants.roleTypes.MANAGER);
				managerUserIds = custodianManagers.map(user => user.id);
				// 2. Combine managers and reviewers remaining
				let deadlinePassedUserIds = [...remainingReviewerUserIds, ...managerUserIds];
				let deadlinePassedUsers = [...remainingReviewers, ...custodianManagers];

				// 3. Create notifications
				await notificationBuilder.triggerNotificationMessage(
					deadlinePassedUserIds,
					`The deadline for a Data Access Request review phase has now elapsed`,
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
					dateDeadline,
				};
				html = await emailGenerator.generateReviewDeadlinePassed(options);
				await emailGenerator.sendEmail(
					deadlinePassedUsers,
					`${i18next.t('translation:email.sender')}`,
					`The deadline for a Data Access Request review phase has now elapsed`,
					html,
					false
				);
				break;
			case constants.notificationTypes.WORKFLOWASSIGNED:
				// 1. Get managers for publisher
				custodianManagers = teamController.getTeamMembersByRole(accessRecord.datasets[0].publisher.team, constants.roleTypes.MANAGER);
				// 2. Get managerIds for notifications
				managerUserIds = custodianManagers.map(user => user.id);
				// 3. deconstruct and set options for notifications and email
				options = {
					id: accessRecord._id,
					steps,
					projectId,
					projectName,
					applicants,
					actioner: `${firstname} ${lastname}`,
					workflowName,
					dateSubmitted,
					datasetTitles,
				};
				// 4. Create notifications for the managers only
				await notificationBuilder.triggerNotificationMessage(
					managerUserIds,
					`Workflow of ${workflowName} has been assiged to an appplication`,
					'data access request',
					accessRecord._id
				);
				// 5. Generate the email
				html = await emailGenerator.generateWorkflowAssigned(options);
				// 6. Send email to custodian managers only within the team
				await emailGenerator.sendEmail(
					custodianManagers,
					`${i18next.t('translation:email.sender')}`,
					`A Workflow has been assigned to an application request`,
					html,
					false
				);
				break;
			case constants.notificationTypes.APPLICATIONCLONED:
				// Deconstruct required variables from context object
				const { newDatasetTitles, newApplicationId } = context;
				// 1. Create notifications
				await notificationBuilder.triggerNotificationMessage(
					[accessRecord.userId],
					`Your Data Access Request for ${datasetTitles} was successfully duplicated into a new form for ${newDatasetTitles.join(
						','
					)}, which can now be edited`,
					'data access request',
					newApplicationId
				);
				// Create authors notification
				if (!_.isEmpty(authors)) {
					await notificationBuilder.triggerNotificationMessage(
						authors.map(author => author.id),
						`A Data Access Request you contributed to for ${datasetTitles} has been duplicated into a new form by ${firstname} ${lastname}`,
						'data access request unlinked',
						newApplicationId
					);
				}
				// 2. Send emails to relevant users
				// Aggregate objects for custodian and applicant
				emailRecipients = [accessRecord.mainApplicant, ...accessRecord.authors];
				// Create object to pass through email data
				options = {
					id: accessRecord._id,
					projectId,
					projectName,
					datasetTitles,
					dateSubmitted,
					applicants,
					firstname,
					lastname,
				};
				// Create email body content
				html = emailGenerator.generateDARClonedEmail(options);
				// Send email
				await emailGenerator.sendEmail(
					emailRecipients,
					`${i18next.t('translation:email.sender')}`,
					`Data Access Request for ${datasetTitles} has been duplicated into a new form by ${firstname} ${lastname}`,
					html,
					false
				);
				break;
			case constants.notificationTypes.APPLICATIONDELETED:
				// 1. Create notifications
				await notificationBuilder.triggerNotificationMessage(
					[accessRecord.userId],
					`Your Data Access Request for ${datasetTitles} was successfully deleted`,
					'data access request unlinked',
					accessRecord._id
				);
				// Create authors notification
				if (!_.isEmpty(authors)) {
					await notificationBuilder.triggerNotificationMessage(
						authors.map(author => author.id),
						`A draft Data Access Request you contributed to for ${datasetTitles} has been deleted by ${firstname} ${lastname}`,
						'data access request unlinked',
						accessRecord._id
					);
				}
				// 2. Send emails to relevant users
				// Aggregate objects for custodian and applicant
				emailRecipients = [accessRecord.mainApplicant, ...accessRecord.authors];
				// Create object to pass through email data
				options = {
					publisher,
					projectName,
					datasetTitles,
					createdAt,
					applicants,
					firstname,
					lastname,
				};
				// Create email body content
				html = emailGenerator.generateDARDeletedEmail(options);
				// Send email
				await emailGenerator.sendEmail(
					emailRecipients,
					`${i18next.t('translation:email.sender')}`,
					` ${firstname} ${lastname} has deleted a data access request application`,
					html,
					false
				);
				break;
		}
	}

	createApplicationDTO(app, userType, userId = ''){
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
			reviewPanels = [],
			amendmentStatus = '';

		// Check if the application has a workflow assigned
		let { workflow = {}, applicationStatus } = app;
		if (_.has(app, 'publisherObj.team.members')) {
			let {
				publisherObj: {
					team: { members, users },
				},
			} = app;
			let managers = members.filter(mem => {
				return mem.roles.includes('manager');
			});
			managerUsers = users
				.filter(user => managers.some(manager => manager.memberid.toString() === user._id.toString()))
				.map(user => {
					let isCurrentUser = user._id.toString() === userId.toString();
					return `${user.firstname} ${user.lastname}${isCurrentUser ? ` (you)` : ``}`;
				});
			if (
				applicationStatus === constants.applicationStatuses.SUBMITTED ||
				(applicationStatus === constants.applicationStatuses.INREVIEW && _.isEmpty(workflow))
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
					} = workflowController.getActiveStepStatus(activeStep, users, userId));
					let activeStepIndex = workflow.steps.findIndex(step => {
						return step.active === true;
					});
					workflow.steps[activeStepIndex] = {
						...workflow.steps[activeStepIndex],
						reviewStatus,
					};
				} else if (_.isUndefined(activeStep) && applicationStatus === constants.applicationStatuses.INREVIEW) {
					reviewStatus = 'Final decision required';
					remainingActioners = managerUsers.join(', ');
				}
				// Get decision duration if completed
				let { dateFinalStatus, dateSubmitted } = app;
				if (dateFinalStatus) {
					decisionDuration = parseInt(moment(dateFinalStatus).diff(dateSubmitted, 'days'));
				}
				// Set review section to display format
				let formattedSteps = [...workflow.steps].reduce((arr, item) => {
					let step = {
						...item,
						sections: [...item.sections].map(section => constants.darPanelMapper[section]),
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
			({ projectName } = aboutApplication);
		}
		if (_.isEmpty(projectName)) {
			projectName = `${publisher} - ${name}`;
		}
		if (questionAnswers) {
			applicants = datarequestUtil.extractApplicantNames(questionAnswers).join(', ');
		}
		if (_.isEmpty(applicants)) {
			let { firstname, lastname } = app.mainApplicant;
			applicants = `${firstname} ${lastname}`;
		}
		amendmentStatus = amendmentController.calculateAmendmentStatus(app, userType);
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
			amendmentStatus,
		};
	}

	calculateAvgDecisionTime (applications){
		// Extract dateSubmitted dateFinalStatus
		let decidedApplications = applications.filter(app => {
			let { dateSubmitted = '', dateFinalStatus = '' } = app;
			return !_.isEmpty(dateSubmitted.toString()) && !_.isEmpty(dateFinalStatus.toString());
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
			if (totalDecisionTime > 0) return parseInt(totalDecisionTime / decidedApplications.length / 86400);
		}
		return 0;
	}
};
