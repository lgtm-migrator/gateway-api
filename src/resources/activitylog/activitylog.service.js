import constants from './../utilities/constants.util';
import { UserModel } from '../user/user.model';

export default class activityLogService {
	constructor(activityLogRepository) {
		this.activityLogRepository = activityLogRepository;
	}

	async searchLogs(versionIds, type, userType) {
		const logs = await this.activityLogRepository.searchLogs(versionIds, type, userType);
		return logs;
	}

	async logActivity(eventType, context) {
		switch (eventType) {
			case constants.activityLogEvents.APPLICATION_SUBMITTED:
				this.logApplicationSubmittedEvent(context);
				break;
			case constants.activityLogEvents.REVIEW_PROCESS_STARTED:
				this.logReviewProcessStartedEvent(context);
				break;
			case constants.activityLogEvents.UPDATES_SUBMITTED:
				this.logUpdatesSubmittedEvent(context);
				break;
			case constants.activityLogEvents.AMENDMENT_SUBMITTED:
				this.logAmendmentSubmittedEvent(context);
				break;
			case constants.activityLogEvents.APPLICATION_APPROVED:
				this.logApplicationApprovedEvent(context);
				break;
			case constants.activityLogEvents.APPLICATION_APPROVED_WITH_CONDITIONS:
				this.logApplicationApprovedWithConditionsEvent(context);
				break;
			case constants.activityLogEvents.APPLICATION_REJECTED:
				this.logApplicationRejectedEvent(context);
				break;
			case constants.activityLogEvents.COLLABORATOR_ADDEDD:
				this.logCollaboratorAddedEvent(context);
				break;
			case constants.activityLogEvents.COLLABORATOR_REMOVED:
				this.logCollaboratorRemovedEvent(context);
				break;
		}
	}

	async logReviewProcessStartedEvent(context) {
		const { accessRequest, user } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.0`];

		const log = {
			eventType: constants.activityLogEvents.REVIEW_PROCESS_STARTED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Review process started by custodian manager ${user.firstname} ${user.lastname}`,
			html: `<b>Review process started</b> by custodian manager <b>${user.firstname} ${user.lastname}</b>`,
			user: user._id,
			version: version.detailedTitle,
			versionId: version.applicationId,
			userTypes: [constants.userTypes.APPLICANT, constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logApplicationApprovedEvent(context) {
		const { accessRequest, user } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length}`];

		const log = {
			eventType: constants.activityLogEvents.APPLICATION_APPROVED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Application approved by custodian manager ${user.firstname} ${user.lastname}`,
			html: `<b>Application approved</b> by custodian manager <b>${user.firstname} ${user.lastname}</b>`,
			user: user._id,
			version: version.detailedTitle,
			versionId: accessRequest.amendmentIterations.length > 0 ? version.iterationId : version.applicationId,
			userTypes: [constants.userTypes.APPLICANT, constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logApplicationApprovedWithConditionsEvent(context) {
		const { accessRequest, user } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length}`];

		const log = {
			eventType: constants.activityLogEvents.APPLICATION_APPROVED_WITH_CONDITIONS,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Application approved with conditions by custodian manager ${user.firstname} ${user.lastname}`,
			detailedText: `Conditions: ${accessRequest.applicationStatusDesc}`,
			html: `<b>Application approved with conditions</b> by custodian manager <b>${user.firstname} ${user.lastname}</b>`,
			detailedHtml: `Conditions: ${accessRequest.applicationStatusDesc}`,
			user: user._id,
			version: version.detailedTitle,
			versionId: accessRequest.amendmentIterations.length > 0 ? version.iterationId : version.applicationId,
			userTypes: [constants.userTypes.APPLICANT, constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logApplicationRejectedEvent(context) {
		const { accessRequest, user } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length}`];

		const log = {
			eventType: constants.activityLogEvents.APPLICATION_REJECTED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Application rejected by custodian manager ${user.firstname} ${user.lastname}`,
			detailedText: `Reason for rejection: ${accessRequest.applicationStatusDesc}`,
			html: `<b>Application rejected</b> by custodian manager <b>${user.firstname} ${user.lastname}</b>`,
			detailedHtml: `Reason for rejection: ${accessRequest.applicationStatusDesc}`,
			user: user._id,
			version: version.detailedTitle,
			versionId: accessRequest.amendmentIterations.length > 0 ? version.iterationId : version.applicationId,
			userTypes: [constants.userTypes.APPLICANT, constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logApplicationSubmittedEvent(context) {
		const { accessRequest, user } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.0`];

		const log = {
			eventType: constants.activityLogEvents.APPLICATION_SUBMITTED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Version 1 application has been submitted by applicant ${user.firstname} ${user.lastname}`,
			html: `<a href="${version.link}">Version 1</a> application has been submitted by applicant <b>${user.firstname} ${user.lastname}</b>`,
			user: user._id,
			version: version.detailedTitle,
			versionId: version.applicationId,
			userTypes: [constants.userTypes.APPLICANT, constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logAmendmentSubmittedEvent(context) {
		const { accessRequest, user } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.0`];

		const log = {
			eventType: constants.activityLogEvents.AMENDMENTS_SUBMITTED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Amendments submitted by applicant ${user.firstname} ${user.lastname}. ${version.displayTitle} of this application has been created.`,
			detailedText: `Reason for amendment: ${accessRequest.submissionDescription}`,
			html: `Amendments submitted by applicant <b>${user.firstname} ${user.lastname}</b>. <a href="${version.link}">${version.displayTitle}</a> of this application has been created.`,
			detailedHtml: `Reason for amendment: ${accessRequest.submissionDescription}`,
			user: user._id,
			version: version.detailedTitle,
			versionId: version.applicationId,
			userTypes: [constants.userTypes.APPLICANT, constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logUpdatesSubmittedEvent(context) {
		const { accessRequest, user } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length}`];

		const log = {
			eventType: constants.activityLogEvents.UPDATES_SUBMITTED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Updates submitted by applicant ${user.firstname} ${user.lastname}. ${version.displayTitle} of this application has been created.`,
			html: `Updates submitted by applicant <b>${user.firstname} ${user.lastname}</b>. <a href="${version.link}">${version.displayTitle}</a> of this application has been created.`,
			user: user._id,
			version: version.detailedTitle,
			versionId: accessRequest.amendmentIterations.length > 0 ? version.iterationId : version.applicationId,
			userTypes: [constants.userTypes.APPLICANT, constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logCollaboratorAddedEvent(context) {
		const { accessRequest, user, collaboratorId } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length}`];

		const collaborator = await UserModel.findOne({
			id: collaboratorId,
		});

		const log = {
			eventType: constants.activityLogEvents.COLLABORATOR_ADDEDD,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Applicant ${user.firstname} ${user.lastname} added ${collaborator.firstname} ${collaborator.lastname} as a collaborator`,
			html: `Applicant <b>${user.firstname} ${user.lastname}</b> added <b>${collaborator.firstname} ${collaborator.lastname}</b> as a collaborator`,
			user: user._id,
			version: version.detailedTitle,
			versionId: accessRequest.amendmentIterations.length > 0 ? version.iterationId : version.applicationId,
			userTypes: [constants.userTypes.APPLICANT],
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logCollaboratorRemovedEvent(context) {
		const { accessRequest, user, collaboratorId } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length}`];

		const collaborator = await UserModel.findOne({
			id: collaboratorId,
		});

		const log = {
			eventType: constants.activityLogEvents.COLLABORATOR_REMOVED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Applicant ${user.firstname} ${user.lastname} removed ${collaborator.firstname} ${collaborator.lastname} as a collaborator`,
			html: `Applicant <b>${user.firstname} ${user.lastname}</b> removed <b>${collaborator.firstname} ${collaborator.lastname}</b> as a collaborator`,
			user: user._id,
			version: version.detailedTitle,
			versionId: accessRequest.amendmentIterations.length > 0 ? version.iterationId : version.applicationId,
			userTypes: [constants.userTypes.APPLICANT],
		};

		await this.activityLogRepository.createActivityLog(log);
	}
}
