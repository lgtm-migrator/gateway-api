import constants from './../utilities/constants.util';
import { orderBy } from 'lodash';
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
		const formattedVersionEvents = versions.reduce((arr, version) => {
			const {
				majorVersion: majorVersionNumber,
				dateSubmitted,
				applicationType,
				applicationStatus,
				_id: majorVersionId,
				amendmentIterations = [],
			} = version;

			const majorVersion = this.buildVersionEvents(
				`${majorVersionNumber}`,
				dateSubmitted,
				applicationType,
				applicationStatus,
				() => { return this.getEventsForVersion(logs, majorVersionId) }
			);
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
					() => { return this.getEventsForVersion(logs, minorVersionId) }
				);
				if (minorVersion.events.length > 0) {
					arr.push(minorVersion);
				}
			});

			return arr;
		}, []);

		const orderedVersionEvents = orderBy(formattedVersionEvents, ['versionNumber'], ['desc']);

		return orderedVersionEvents;
	}

	getEventsForVersion(logs, versionId) {
		const versionEvents = logs.filter(log => log.versionId.toString() === versionId.toString());
		const orderedVersionEvents = orderBy(versionEvents, ['timestamp'], ['desc']);
		return orderedVersionEvents;
	}

	buildVersionEvents(versionNumber, dateSubmitted, applicationType, applicationStatus, getEventsFn) {
		let daysSinceSubmission;

		if(dateSubmitted) {
			const dateNow = moment();
			dateSubmitted = moment(dateSubmitted);
			const numberDaysSinceSubmission = dateNow.diff(dateSubmitted, 'days');
			daysSinceSubmission = `${numberDaysSinceSubmission} ${numberDaysSinceSubmission === 1 ? `day` : `days`}`;
			dateSubmitted = dateSubmitted.format('D MMMM YYYY');
		}

		const timeWithApplicants = this.calculateTimeWithApplicants()

		return {
			version: `Version ${versionNumber}`,
			versionNumber: parseFloat(versionNumber),
			meta: {
				...(dateSubmitted && { dateSubmitted }),
				...(daysSinceSubmission && { daysSinceSubmission }),
				applicationType,
				applicationStatus,
				timeWithApplicants
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
