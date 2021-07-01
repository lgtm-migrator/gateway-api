import constants from './../utilities/constants.util';
import { ActivityLogModel } from './activitylog.model';

export async function logActivity(eventType, context) {
	switch (eventType) {
		case constants.activityLogEvents.APPLICATION_SUBMITTED:
			logApplicationSubmittedEvent(context);
			break;
		case constants.activityLogEvents.REVIEW_PROCESS_STARTED:
			logReviewProcessStartedEvent(context);
			break;
	}
}

async function logReviewProcessStartedEvent(context) {
	const { accessRequest, user } = context;
	const version = accessRequest.versionTree[`${accessRequest.majorVersion}.0`];

	let activityLog = new ActivityLogModel({
		eventType: constants.activityLogEvents.REVIEW_PROCESS_STARTED,
		timestamp: Date.now(),
		plainText: `Review process started by custodian manager ${user.firstname} ${user.lastname}`,
		html: `<b>Review process started</b> by custodian manager <b>${user.firstname} ${user.lastname}</b>`,
		user: user._id,
		version: version.detailedTitle,
		versionId: version.applicationId,
		userTypes: [constants.userTypes.APPLICANT, constants.userTypes.CUSTODIAN],
	});
	await activityLog.save();
}

async function logApplicationSubmittedEvent(context) {
	const { accessRequest, user } = context;
	const version = accessRequest.versionTree[`${accessRequest.majorVersion}.0`];

	let activityLog = new ActivityLogModel({
		eventType: constants.activityLogEvents.APPLICATION_SUBMITTED,
		timestamp: Date.now(),
		plainText: `Version 1 application has been submitted by applicant ${user.firstname} ${user.lastname}`,
		html: `<a href="${version.link}">Version 1</a> application has been submitted by applicant <b>${user.firstname} ${user.lastname}</b>`,
		user: user._id,
		version: version.detailedTitle,
		versionId: version.applicationId,
		userTypes: [constants.userTypes.APPLICANT, constants.userTypes.CUSTODIAN],
	});

	await activityLog.save();
}
