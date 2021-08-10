import constants from './../utilities/constants.util';
import { UserModel } from '../user/user.model';
import { orderBy, has, first, isEmpty, last } from 'lodash';
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
				dateCreated,
				applicationType,
				applicationStatus,
				_id: majorVersionId,
				amendmentIterations = [],
			} = version;

			const partyDurations = this.getPartyTimeDistribution(version);

			const majorVersion = this.buildVersionEvents(
				`${majorVersionNumber}`,
				dateSubmitted,
				dateCreated,
				null,
				applicationType,
				applicationStatus,
				() => this.getEventsForVersion(logs, majorVersionId),
				() => this.calculateTimeWithParty(partyDurations, constants.userTypes.APPLICANT)
			);

			if (majorVersion.events.length > 0) {
				arr.push(majorVersion);
			}

			amendmentIterations.forEach((iterationMinorVersion, index) => {
				const { dateSubmitted: minorVersionDateSubmitted, dateCreated: minorVersionDateCreated, dateReturned: minorVersionDateReturned, _id: minorVersionId } = iterationMinorVersion;
				const partyDurations = this.getPartyTimeDistribution(iterationMinorVersion);
				const minorVersion = this.buildVersionEvents(
					`${majorVersionNumber}.${index + 1}`,
					minorVersionDateSubmitted,
					minorVersionDateCreated,
					minorVersionDateReturned,
					'Update',
					applicationStatus,
					() => this.getEventsForVersion(logs, minorVersionId),
					() => this.calculateTimeWithParty(partyDurations, constants.userTypes.APPLICANT)
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

	buildVersionEvents(versionNumber, dateSubmitted, dateCreated, dateReturned, applicationType, applicationStatus, getEventsFn, calculateTimeWithPartyfn) {
		let daysSinceSubmission;

		if (dateSubmitted) {
			const dateNow = moment();
			dateSubmitted = moment(dateSubmitted);
			const numberDaysSinceSubmission = dateNow.diff(dateSubmitted, 'days');
			daysSinceSubmission = `${numberDaysSinceSubmission} ${numberDaysSinceSubmission === 1 ? `day` : `days`}`;
			dateSubmitted = dateSubmitted.format('D MMMM YYYY');
		}

		if(dateCreated) {
			dateCreated = moment(dateCreated);
			dateCreated = dateCreated.format('D MMMM YYYY');
		}

		if(dateReturned) {
			dateReturned = moment(dateReturned);
			dateReturned = dateReturned.format('D MMMM YYYY');
		}

		return {
			version: `Version ${versionNumber}`,
			versionNumber: parseFloat(versionNumber),
			meta: {
				...(dateSubmitted && { dateSubmitted }),
				...(dateCreated && { dateCreated }),
				...(dateReturned && { dateReturned }),
				...(daysSinceSubmission && { daysSinceSubmission }),
				applicationType,
				applicationStatus,
				timeWithApplicants: calculateTimeWithPartyfn(),
			},
			events: getEventsFn(),
		};
	}

	calculateTimeWithParty(partyDurations, partyType) {
		let totalTime = 0;

		const partyTotalDurations = partyDurations.reduce((obj, timeRange) => {
			const { from, to, party } = timeRange;
			const toDate = moment(to);
			const fromDate = moment(from);
			const duration = moment.duration(toDate.diff(fromDate));
			const durationSeconds = duration.asSeconds();
			totalTime = totalTime + durationSeconds;

			obj[party] = (obj[party] || 0) + durationSeconds;

			return obj;
		}, {});

		const partyPercentage = Math.round(((partyTotalDurations[partyType] || 0) / totalTime) * 100);

		return `${partyPercentage}%`;
	}

	getPartyTimeDistribution(version) {
		const isMajorVersion = has(version, 'applicationStatus');
		let partyTimes = [];

		if (isMajorVersion) {
			const { amendmentIterations: minorVersions } = version;
			partyTimes = [
				...this.getMajorVersionActivePartyDurations(version),
				...minorVersions.reduce((arr, minorVersion) => {
					return [...arr, ...this.getMinorVersionActivePartyDurations(minorVersion)];
				}, []),
			];
		} else {
			partyTimes = [...this.getMinorVersionActivePartyDurations(version)];
		}

		return partyTimes;
	}

	getMajorVersionActivePartyDurations(majorVersion) {
		const { amendmentIterations: minorVersions = [] } = majorVersion;
		let partyDurations = [];

		if (majorVersion.dateSubmitted) {
			if (isEmpty(minorVersions)) {
				partyDurations.push({
					from: moment(majorVersion.dateSubmitted),
					to: moment(majorVersion.dateFinalStatus),
					party: constants.userTypes.CUSTODIAN,
				});
			} else {
				minorVersions.forEach((minorVersion, index) => {
					if (minorVersion === first(minorVersions)) {
						partyDurations.push({
							from: moment(majorVersion.dateSubmitted),
							to: moment(minorVersion.dateCreated),
							party: constants.userTypes.CUSTODIAN,
						});
					}

					if (minorVersion === last(minorVersions)) {
						partyDurations.push({
							from: moment(minorVersion.dateSubmitted),
							to: moment(majorVersion.dateFinalStatus),
							party: constants.userTypes.CUSTODIAN,
						});
					} else {
						partyDurations.push({
							from: moment(minorVersion.dateSubmitted),
							to: moment(minorVersions[index + 1].dateCreated),
							party: constants.userTypes.CUSTODIAN,
						});
					}
				});
			}
		}

		return partyDurations;
	}

	getMinorVersionActivePartyDurations(minorVersion) {
		const { dateCreated, dateReturned, dateSubmitted } = minorVersion;
		let partyDurations = [];

		if (dateCreated) {
			partyDurations.push({
				from: moment(dateCreated),
				to: moment(dateReturned),
				party: constants.userTypes.CUSTODIAN,
			});
		}

		if (dateReturned) {
			partyDurations.push({
				from: moment(dateReturned),
				to: moment(dateSubmitted),
				party: constants.userTypes.APPLICANT,
			});
		}

		return partyDurations;
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
			eventType: constants.activityLogEvents.AMENDMENT_SUBMITTED,
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
