import { isEmpty, has, isNil, orderBy } from 'lodash';
import moment, { version } from 'moment';

import helper from '../utilities/helper.util';
import datarequestUtil from '../datarequest/utils/datarequest.util';
import constants from '../utilities/constants.util';
import { processFile, fileStatus } from '../utilities/cloudStorage.util';
import { amendmentService } from '../datarequest/amendment/dependency';

export default class DataRequestService {
	constructor(dataRequestRepository) {
		this.dataRequestRepository = dataRequestRepository;
	}

	async getAccessRequestsByUser(userId, query = {}) {
		return this.dataRequestRepository.getAccessRequestsByUser(userId, query);
	}

	getApplicationById(id) {
		return this.dataRequestRepository.getApplicationById(id);
	}

	getApplicationByDatasets(datasetIds, applicationStatus, userId) {
		return this.dataRequestRepository.getApplicationByDatasets(datasetIds, applicationStatus, userId);
	}

	getApplicationWithTeamById(id, options) {
		return this.dataRequestRepository.getApplicationWithTeamById(id, options);
	}

	getApplicationWithWorkflowById(id, options) {
		return this.dataRequestRepository.getApplicationWithWorkflowById(id, options);
	}

	getApplicationToSubmitById(id) {
		return this.dataRequestRepository.getApplicationToSubmitById(id);
	}

	getApplicationToUpdateById(id) {
		return this.dataRequestRepository.getApplicationToUpdateById(id);
	}

	getApplicationForUpdateRequest(id) {
		return this.dataRequestRepository.getApplicationForUpdateRequest(id);
	}

	getApplicationIsReadOnly(userType, applicationStatus) {
		let readOnly = true;
		if (userType === constants.userTypes.APPLICANT && applicationStatus === constants.applicationStatuses.INPROGRESS) {
			readOnly = false;
		}
		return readOnly;
	}

	getFilesForApplicationById(id, options) {
		return this.dataRequestRepository.getFilesForApplicationById(id, options);
	}

	getDatasetsForApplicationByIds(arrDatasetIds) {
		return this.dataRequestRepository.getDatasetsForApplicationByIds(arrDatasetIds);
	}

	deleteApplicationById(id) {
		return this.dataRequestRepository.deleteApplicationById(id);
	}

	replaceApplicationById(id, newAcessRecord) {
		return this.dataRequestRepository.replaceApplicationById(id, newAcessRecord);
	}

	async buildApplicationForm(publisher, datasetIds, datasetTitles, requestingUserId) {
		// 1. Get schema to base application form on
		const dataRequestSchema = await this.dataRequestRepository.getApplicationFormSchema(publisher);

		// 2. Build up the accessModel for the user
		const { jsonSchema, _id: schemaId, isCloneable = false } = dataRequestSchema;

		// 3. Set form type
		const formType = schemaId.toString === constants.enquiryFormId ? constants.formTypes.Enquiry : constants.formTypes.Extended5Safe;

		// 4. Create new DataRequestModel
		return {
			userId: requestingUserId,
			datasetIds,
			datasetTitles,
			isCloneable,
			jsonSchema,
			schemaId,
			publisher,
			questionAnswers: {},
			aboutApplication: {},
			applicationStatus: constants.applicationStatuses.INPROGRESS,
			formType,
		};
	}

	async createApplication(data) {
		const application = await this.dataRequestRepository.createApplication(data);
		application.projectId = helper.generateFriendlyId(application._id);
		application.createMajorVersion(1);
		await this.dataRequestRepository.updateApplicationById(application._id, application);
		return application;
	}

	validateRequestedVersion(accessRecord, requestedVersion) {
		let isValidVersion = true;

		// 1. Return base major version for specified access record if no specific version requested
		if (!requestedVersion && accessRecord) {
			return { isValidVersion, requestedMajorVersion: accessRecord.majorVersion, requestedMinorVersion: undefined };
		}

		// 2. Regex to validate and process the requested application version (e.g. 1, 2, 1.0, 1.1, 2.1, 3.11)
		let fullMatch, requestedMajorVersion, requestedMinorVersion;
		const regexMatch = requestedVersion.match(/^(\d+)$|^(\d+)\.?(\d+)$/);
		if (regexMatch) {
			fullMatch = regexMatch[0];
			requestedMajorVersion = regexMatch[1] || regexMatch[2];
			requestedMinorVersion = regexMatch[3] || regexMatch[2];
		}

		// 3. Catch invalid version requests
		try {
			let { majorVersion, amendmentIterations = [] } = accessRecord;
			majorVersion = parseInt(majorVersion);
			requestedMajorVersion = parseInt(requestedMajorVersion);
			if (requestedMinorVersion) {
				requestedMinorVersion = parseInt(requestedMinorVersion);
			} else if (requestedMajorVersion && !requestedMinorVersion) {
				requestedMinorVersion = 0;
			}

			if (!fullMatch || majorVersion !== requestedMajorVersion || requestedMinorVersion > amendmentIterations.length) {
				isValidVersion = false;
			}
		} catch {
			isValidVersion = false;
		}

		return { isValidVersion, requestedMajorVersion, requestedMinorVersion };
	}

	buildVersionHistory = versionTree => {
		const unsortedVersions = Object.keys(versionTree).reduce((arr, versionKey) => {
			const { applicationId: _id, link, displayTitle, detailedTitle } = versionTree[versionKey];

			const version = {
				number: versionKey,
				_id,
				link,
				displayTitle,
				detailedTitle,
			};

			arr = [...arr, version];

			return arr;
		}, []);

		return orderBy(unsortedVersions, ['number'], ['desc']);
	};

	getProjectName(accessRecord) {
		// Retrieve project name from about application section
		const { aboutApplication: { projectName } = {} } = accessRecord;
		if (projectName) {
			return projectName;
		} else if (accessRecord.datasets.length > 0) {
			// Build default project name from publisher and dataset name
			const {
				datasetfields: { publisher },
				name,
			} = accessRecord.datasets[0];
			return `${publisher} - ${name}`;
		} else {
			return 'No project name';
		}
	}

	getProjectNames(applications = []) {
		return [...applications].map(accessRecord => {
			const projectName = this.getProjectName(accessRecord);
			const { _id } = accessRecord;
			return { projectName, _id };
		});
	}

	getApplicantNames(accessRecord) {
		// Retrieve applicant names from form answers
		const { questionAnswers = {} } = accessRecord;
		let applicants = datarequestUtil.extractApplicantNames(questionAnswers);
		let applicantNames = '';
		// Return only main applicant if no applicants added
		if (isEmpty(applicants)) {
			const { firstname, lastname } = accessRecord.mainApplicant;
			applicantNames = `${firstname} ${lastname}`;
		} else {
			applicantNames = applicants.join(', ');
		}
		return applicantNames;
	}

	getDecisionDuration(accessRecord) {
		const { dateFinalStatus, dateSubmitted } = accessRecord;
		if (dateFinalStatus && dateSubmitted) {
			return parseInt(moment(dateFinalStatus).diff(dateSubmitted, 'days'));
		} else {
			return '';
		}
	}

	updateApplicationById(id, data, options = {}) {
		return this.dataRequestRepository.updateApplicationById(id, data, options);
	}

	calculateAvgDecisionTime(accessRecords = []) {
		// Guard for empty array passed
		if (isEmpty(accessRecords)) return 0;
		// Extract dateSubmitted dateFinalStatus
		let decidedApplications = accessRecords.filter(app => {
			let { dateSubmitted = '', dateFinalStatus = '' } = app;
			return !isEmpty(dateSubmitted.toString()) && !isEmpty(dateFinalStatus.toString());
		});
		// Find difference between dates in milliseconds
		if (!isEmpty(decidedApplications)) {
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

	buildUpdateObject(data) {
		let updateObj = {};
		let { aboutApplication, questionAnswers, updatedQuestionId, user, jsonSchema = '' } = data;
		if (aboutApplication) {
			const { datasetIds, datasetTitles } = aboutApplication.selectedDatasets.reduce(
				(newObj, dataset) => {
					newObj.datasetIds = [...newObj.datasetIds, dataset.datasetId];
					newObj.datasetTitles = [...newObj.datasetTitles, dataset.name];
					return newObj;
				},
				{ datasetIds: [], datasetTitles: [] }
			);

			updateObj = { aboutApplication, datasetIds, datasetTitles };
		}
		if (questionAnswers) {
			updateObj = { ...updateObj, questionAnswers, updatedQuestionId, user };
		}

		if (!isEmpty(jsonSchema)) {
			updateObj = { ...updateObj, jsonSchema };
		}

		return updateObj;
	}

	async updateApplication(accessRecord, updateObj) {
		// 1. Extract properties
		let { applicationStatus, _id } = accessRecord;
		let { updatedQuestionId = '', user } = updateObj;
		// 2. If application is in progress, update initial question answers
		if (applicationStatus === constants.applicationStatuses.INPROGRESS) {
			await this.dataRequestRepository.updateApplicationById(_id, updateObj, { new: true });
			// 3. Else if application has already been submitted make amendment
		} else if (
			applicationStatus === constants.applicationStatuses.INREVIEW ||
			applicationStatus === constants.applicationStatuses.SUBMITTED
		) {
			if (isNil(updateObj.questionAnswers)) {
				return accessRecord;
			}
			let updatedAnswer = updateObj.questionAnswers[updatedQuestionId];
			accessRecord = amendmentService.handleApplicantAmendment(accessRecord, updatedQuestionId, '', updatedAnswer, user);
			await this.dataRequestRepository.replaceApplicationById(_id, accessRecord);
		}
		return accessRecord;
	}

	async uploadFiles(accessRecord, files, descriptions, ids, userId) {
		let fileArr = [];
		// Check and see if descriptions and ids are an array
		let descriptionArray = Array.isArray(descriptions);
		let idArray = Array.isArray(ids);
		// Process the files for scanning
		for (let i = 0; i < files.length; i++) {
			// Get description information
			let description = descriptionArray ? descriptions[i] : descriptions;
			// Get uniqueId
			let generatedId = idArray ? ids[i] : ids;
			// Remove - from uuidV4
			let uniqueId = generatedId.replace(/-/gim, '');
			// Send to db
			const response = await processFile(files[i], accessRecord._id, uniqueId);
			// Deconstruct response
			let { status } = response;
			// Setup fileArr for mongoo
			let newFile = {
				status: status.trim(),
				description: description.trim(),
				fileId: uniqueId,
				size: files[i].size,
				name: files[i].originalname,
				owner: userId,
				error: status === fileStatus.ERROR ? 'Could not upload. Unknown error. Please try again.' : '',
			};
			// Update local for post back to FE
			fileArr.push(newFile);
			// mongoo db update files array
			accessRecord.files.push(newFile);
		}
		// Write back into mongo [{userId, fileName, status: enum, size}]
		let updatedRecord = await this.dataRequestRepository.saveFileUploadChanges(accessRecord);

		// Process access record into object
		let record = updatedRecord._doc;
		// Fetch files
		let mediaFiles = record.files.map(f => {
			return f._doc;
		});

		return mediaFiles;
	}

	doInitialSubmission(accessRecord) {
		// 1. Update application to submitted status
		accessRecord.submissionType = constants.submissionTypes.INITIAL;
		accessRecord.applicationStatus = constants.applicationStatuses.SUBMITTED;
		// 2. Check if workflow/5 Safes based application, set final status date if status will never change again
		if (has(accessRecord.toObject(), 'publisherObj')) {
			if (!accessRecord.publisherObj.workflowEnabled) {
				accessRecord.dateFinalStatus = new Date();
				accessRecord.workflowEnabled = false;
			} else {
				accessRecord.workflowEnabled = true;
			}
		}
		const dateSubmitted = new Date();
		accessRecord.dateSubmitted = dateSubmitted;
		// 3. Return updated access record for saving
		return accessRecord;
	}

	syncRelatedApplications(versionTree) {
		// 1. Extract all major version _ids denoted by an application type on each node in the version tree
		const applicationIds = Object.keys(versionTree).reduce((arr, key) => {
			if (versionTree[key].applicationType) {
				arr.push(versionTree[key].applicationId);
			}
			return arr;
		}, []);
		// 2. Update all related applications
		this.dataRequestRepository.syncRelatedApplications(applicationIds, versionTree);
	}
}
