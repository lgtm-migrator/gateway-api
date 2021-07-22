import constants from './../utilities/constants.util';
import { UserModel } from '../user/user.model';
import { chain, groupBy, isEmpty, last, orderBy } from 'lodash';
import moment from 'moment';

export default class activityLogService {
	constructor(activityLogRepository) {
		this.activityLogRepository = activityLogRepository;
	}

	async searchLogs(versionIds, type, userType, versions) {
		const logs = await this.activityLogRepository.searchLogs(versionIds, type, userType);
		return this.formatLogs(logs, versions);
	}

	formatLogs(logs, versions) {
		const presubmissionEvents = this.buildPresubmissionEvents(logs);

		const formattedVersionEvents = versions.reduce((arr, version) => {
			const {
				majorVersion: majorVersionNumber,
				dateSubmitted,
				applicationType,
				applicationStatus,
				_id: majorVersionId,
				amendmentIterations = [],
			} = version;

			const majorVersion = this.buildVersionEvents(`${majorVersionNumber}`, dateSubmitted, applicationType, applicationStatus, () => {
				return this.getEventsForVersion(logs, majorVersionId);
			});
			if (majorVersion.events.length > 0) {
				arr.push(majorVersion);
			}

			amendmentIterations.forEach((iterationMinorVersion, index) => {
				const { dateSubmitted: minorVersionDateSubmitted, _id: minorVersionId } = iterationMinorVersion;
				const minorVersion = this.buildVersionEvents(
					`${majorVersionNumber}.${index + 1}`,
					minorVersionDateSubmitted,
					'Update',
					applicationStatus,
					() => {
						return this.getEventsForVersion(logs, minorVersionId);
					}
				);
				if (minorVersion.events.length > 0) {
					arr.push(minorVersion);
				}
			});

			return arr;
		}, []);

		const orderedVersionEvents = orderBy([presubmissionEvents, ...formattedVersionEvents], ['versionNumber'], ['desc']);

		return orderedVersionEvents;
	}

	buildPresubmissionEvents(logs) {
		const presubmissionEvents = this.getEventsForVersion(logs);

		if (isEmpty(presubmissionEvents)) return [];

		const firstMessageDate = moment(last(presubmissionEvents).timestamp).format('D MMMM YYYY');

		return {
			version: `Pre-submission`,
			versionNumber: 0,
			meta: {
				dateSubmitted: firstMessageDate,
			},
			events: presubmissionEvents,
		};
	}

	getEventsForVersion(logs, versionId) {
		let versionEvents = [];
		if (versionId) {
			versionEvents = logs.filter(log => log.versionId.toString() === versionId.toString() && !log.isPresubmission);
		} else {
			versionEvents = logs.filter(log => log.isPresubmission);
		}
		const orderedVersionEvents = orderBy(versionEvents, ['timestamp'], ['desc']);
		return orderedVersionEvents;
	}

	buildVersionEvents(versionNumber, dateSubmitted, applicationType, applicationStatus, getEventsFn) {
		let daysSinceSubmission;

		if (dateSubmitted) {
			const dateNow = moment();
			dateSubmitted = moment(dateSubmitted);
			const numberDaysSinceSubmission = dateNow.diff(dateSubmitted, 'days');
			daysSinceSubmission = `${numberDaysSinceSubmission} ${numberDaysSinceSubmission === 1 ? `day` : `days`}`;
			dateSubmitted = dateSubmitted.format('D MMMM YYYY');
		}

		const timeWithApplicants = this.calculateTimeWithApplicants();

		return {
			version: `Version ${versionNumber}`,
			versionNumber: parseFloat(versionNumber),
			meta: {
				...(dateSubmitted && { dateSubmitted }),
				...(daysSinceSubmission && { daysSinceSubmission }),
				applicationType,
				applicationStatus,
				timeWithApplicants,
			},
			events: getEventsFn(),
		};
	}

	calculateTimeWithApplicants() {
		return '100%';
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
			case constants.activityLogEvents.PRESUBMISSION_MESSAGE:
				this.logPresubmissionMessages(context);
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

	async logPresubmissionMessages(context) {
		const logs = [];
		const { applicationId, messages, publisher } = context;
		
		// Create log for each message submitted
		messages.forEach(message => {
			const { createdBy, createdByName, createdByUserType, createdDate } = message;
			const sender = this.buildMessageSender(createdByName, createdByUserType, publisher);
			const log = {
				eventType: constants.activityLogEvents.PRESUBMISSION_MESSAGE,
				logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
				timestamp: createdDate,
				user: createdBy,
				version: 'Pre-submission',
				versionId: applicationId,
				userTypes: [constants.userTypes.APPLICANT, constants.userTypes.CUSTODIAN],
				isPresubmission: true,
				...this.buildMessageText(sender, message),
				...this.buildMessageHtml(sender, createdByUserType, message),
			};

			logs.push(log);
		});

		// Save all logs relating to presubmissions messages
		await this.activityLogRepository.createActivityLogs(logs);
	}

	buildMessageSender(createdByName, userType, publisher) {
		let sender;
		const { firstname, lastname } = createdByName;
		switch(userType) {
			case constants.userTypes.APPLICANT:
				sender = `applicant ${firstname} ${lastname}`;
				break;
			case constants.userTypes.CUSTODIAN:
				sender = `${firstname} ${lastname} (${publisher})`;
				break;
		}
		return sender;
	}

	buildMessageText(sender) {
		let plainText, detailedText;

		plainText = `Messages sent from ${sender}`;

		return {
			plainText,
			detailedText
		};
	}

	buildMessageHtml(sender) {
		let html, detailedHtml;

		html = `Message sent from <b>${sender}</b>`;

		return {
			html,
			detailedHtml
		};
	}
}
