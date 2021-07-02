import constants from './../utilities/constants.util';

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
				logApplicationSubmittedEvent(context);
				break;
			case constants.activityLogEvents.REVIEW_PROCESS_STARTED:
				logReviewProcessStartedEvent(context);
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

		await this.activityLogRepository.createActivityLog(log, logType);
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
}
