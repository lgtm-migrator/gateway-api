import constants from './../utilities/constants.util';
import { UserModel } from '../user/user.model';
import { orderBy, has, first, isEmpty, last } from 'lodash';
import moment from 'moment';

export default class activityLogService {
	constructor(activityLogRepository) {
		this.activityLogRepository = activityLogRepository;
	}

	async searchLogs(versionIds, type, userType, versions, includePresubmission) {
		const logs = await this.activityLogRepository.searchLogs(versionIds, type, userType);
		return this.formatLogs(logs, versions, includePresubmission);
	}

	getLog(id, type) {
		return this.activityLogRepository.getLog(id, type);
	}

	deleteLog(id) {
		return this.activityLogRepository.deleteLog(id);
	}

	getActiveQuestion(questionsArr, questionId) {
		let child;

		if (!questionsArr) return;

		for (const questionObj of questionsArr) {
			if (questionObj.questionId === questionId) return questionObj;

			if (typeof questionObj.input === 'object' && typeof questionObj.input.options !== 'undefined') {
				questionObj.input.options
					.filter(option => {
						return typeof option.conditionalQuestions !== 'undefined' && option.conditionalQuestions.length > 0;
					})
					.forEach(option => {
						if (!child) {
							child = this.getActiveQuestion(option.conditionalQuestions, questionId);
						}
					});
			}

			if (child) return child;
		}
	}

	formatLogs(logs, versions, includePresubmission = true) {
		let presubmissionEvents = [];
		if (includePresubmission) {
			presubmissionEvents = this.buildPresubmissionEvents(logs);
		}

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
				const {
					dateSubmitted: minorVersionDateSubmitted,
					dateCreated: minorVersionDateCreated,
					dateReturned: minorVersionDateReturned,
					_id: minorVersionId,
				} = iterationMinorVersion;
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

		if (!isEmpty(presubmissionEvents)) {
			formattedVersionEvents.push(presubmissionEvents);
		}

		const orderedVersionEvents = orderBy(formattedVersionEvents, ['versionNumber'], ['desc']);

		return orderedVersionEvents;
	}

	buildPresubmissionEvents(logs) {
		const presubmissionEvents = this.getEventsForVersion(logs);

		if (isEmpty(presubmissionEvents)) return {};

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

	buildVersionEvents(
		versionNumber,
		dateSubmitted,
		dateCreated,
		dateReturned,
		applicationType,
		applicationStatus,
		getEventsFn,
		calculateTimeWithPartyfn
	) {
		let daysSinceSubmission;

		if (dateSubmitted) {
			const dateNow = moment();
			dateSubmitted = moment(dateSubmitted);
			const numberDaysSinceSubmission = dateNow.diff(dateSubmitted, 'days');
			daysSinceSubmission = `${numberDaysSinceSubmission} ${numberDaysSinceSubmission === 1 ? `day` : `days`}`;
			dateSubmitted = dateSubmitted.format('D MMMM YYYY');
		}

		if (dateCreated) {
			dateCreated = moment(dateCreated);
			dateCreated = dateCreated.format('D MMMM YYYY');
		}

		if (dateReturned) {
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
			case constants.activityLogEvents.PRESUBMISSION_MESSAGE:
				this.logPresubmissionMessages(context);
				break;
			case constants.activityLogEvents.CONTEXTUAL_MESSAGE:
				this.logContextualMessage(context);
				break;
			case constants.activityLogEvents.NOTE:
				this.logNote(context);
				break;
			case constants.activityLogEvents.UPDATE_REQUESTED:
				this.logUpdateRequestedEvent(context);
				break;
			case constants.activityLogEvents.WORKFLOW_ASSIGNED:
				this.logWorkflowAssignedEvent(context);
				break;
			case constants.activityLogEvents.REVIEW_PHASE_STARTED:
				this.logReviewPhaseStartedEvent(context);
				break;
			case constants.activityLogEvents.RECOMMENDATION_WITH_ISSUE:
				this.logReccomendationWithIssueEvent(context);
				break;
			case constants.activityLogEvents.RECOMMENDATION_WITH_NO_ISSUE:
				this.logReccomendationWithNoIssueEvent(context);
				break;
			case constants.activityLogEvents.DEADLINE_PASSED:
				this.logDeadlinePassedEvent(context);
				break;
			case constants.activityLogEvents.FINAL_DECISION_REQUIRED:
				this.logFinalDecisionRequiredEvent(context);
				break;
			case constants.activityLogEvents.MANUAL_EVENT:
				this.logManualEvent(context);
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

		const detHtml =
			`<div class='activity-log-detail'>` +
			`<div class='activity-log-detail-header'>Conditions:</div>` +
			`<div class='activity-log-detail-row'>${accessRequest.applicationStatusDesc}</div>` +
			`</div>`;

		const log = {
			eventType: constants.activityLogEvents.APPLICATION_APPROVED_WITH_CONDITIONS,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Application approved with conditions by custodian manager ${user.firstname} ${user.lastname}`,
			detailedText: `Conditions:\n${accessRequest.applicationStatusDesc}`,
			html: `<b>Application approved with conditions</b> by custodian manager <b>${user.firstname} ${user.lastname}</b>`,
			detailedHtml: detHtml,
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

		const detHtml =
			`<div class='activity-log-detail'>` +
			`<div class='activity-log-detail-header'>Reason for rejection:</div>` +
			`<div class='activity-log-detail-row'>${accessRequest.applicationStatusDesc}</div>` +
			`</div>`;

		const log = {
			eventType: constants.activityLogEvents.APPLICATION_REJECTED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Application rejected by custodian manager ${user.firstname} ${user.lastname}`,
			detailedText: `Reason for rejection:\n${accessRequest.applicationStatusDesc}`,
			html: `<b>Application rejected</b> by custodian manager <b>${user.firstname} ${user.lastname}</b>`,
			detailedHtml: detHtml,
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
			html: `<a class='activity-log-detail-link' href="${version.link}">Version 1</a> application has been submitted by applicant <b>${user.firstname} ${user.lastname}</b>`,
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

		const detHtml =
			`<div class='activity-log-detail'>` +
			`<div class='activity-log-detail-header'>Reason for amendment:</div>` +
			`<div class='activity-log-detail-row'>${accessRequest.submissionDescription}</div>` +
			`</div>`;

		const log = {
			eventType: constants.activityLogEvents.AMENDMENT_SUBMITTED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Amendment submitted by applicant ${user.firstname} ${user.lastname}. ${version.displayTitle} of this application has been created.`,
			detailedText: `Reason for amendment:\n${accessRequest.submissionDescription}`,
			html: `<a class='activity-log-detail-link' href="${version.link}">Amendment submitted</a> by applicant <b>${user.firstname} ${user.lastname}</b>. <a class='activity-log-detail-link' href="${version.link}">${version.displayTitle}</a> of this application has been created.`,
			detailedHtml: detHtml,
			user: user._id,
			version: version.detailedTitle,
			versionId: version.applicationId,
			userTypes: [constants.userTypes.APPLICANT, constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logUpdatesSubmittedEvent(context) {
		const { accessRequest, user } = context;

		const currentVersion = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length}`];
		const previousVersion = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length - 1}`];

		const questionAnswers = accessRequest.amendmentIterations[accessRequest.amendmentIterations.length - 1].questionAnswers;
		const numberOfUpdatesSubmitted = Object.keys(questionAnswers).length;

		let detHtml = '';
		let detText = '';

		Object.keys(questionAnswers).forEach(questionId => {
			const previousAnswer = accessRequest.questionAnswers[questionId];
			const questionSet = accessRequest.jsonSchema.questionSets.find(qs => qs.questionSetId === questionAnswers[questionId].questionSetId);

			const updatedAnswer = questionAnswers[questionId].answer;

			const questionPanel = accessRequest.jsonSchema.questionPanels.find(qp => qp.panelId === questionSet.questionSetId);

			const page = accessRequest.jsonSchema.pages.find(p => p.pageId === questionPanel.pageId);

			const question = this.getActiveQuestion(questionSet.questions, questionId);

			detHtml = detHtml.concat(
				`<div class='activity-log-detail'>` +
					`<div class='activity-log-detail-header'>${page.title + ' | ' + questionSet.questionSetHeader}</div>` +
					`<div class='activity-log-detail-row'>` +
					`<div class='activity-log-detail-row-question'>Question</div>` +
					`<div class='activity-log-detail-row-answer'>${question.question}</div>` +
					`</div>` +
					`<div class='activity-log-detail-row'>` +
					`<div class='activity-log-detail-row-question'> Previous Answer</div>` +
					`<div class='activity-log-detail-row-answer'>${previousAnswer}</div>` +
					`</div>` +
					`<div class='activity-log-detail-row'>` +
					`<div class='activity-log-detail-row-question'> Updated Answer</div>` +
					`<div class='activity-log-detail-row-answer'>${updatedAnswer}</div>` +
					`</div>` +
					`</div>`
			);

			detText = detText.concat(
				`${page.title + ' | ' + questionSet.questionSetHeader}\nQuestion: ${
					question.question
				}\nPrevious Answer: ${previousAnswer}\nUpdated Answer: ${updatedAnswer}\n\n`
			);
		});

		const logUpdate = {
			eventType: constants.activityLogEvents.UPDATE_SUBMITTED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			detailedText: detText,
			plainText: `${numberOfUpdatesSubmitted} ${numberOfUpdatesSubmitted > 1 ? 'updates' : 'update'} requested by custodian manager ${
				user.firstname
			} ${user.lastname}.`,
			html: `<a class='activity-log-detail-link' href="${previousVersion.link}">${numberOfUpdatesSubmitted} ${
				numberOfUpdatesSubmitted > 1 ? ' updates ' : ' update '
			} submitted</a> by applicant <b>${user.firstname} ${user.lastname}</b>.`,
			detailedHtml: detHtml,
			user: user._id,
			version: previousVersion.detailedTitle,
			versionId: accessRequest.amendmentIterations.length > 1 ? previousVersion.iterationId : previousVersion.applicationId,
			userTypes: [constants.userTypes.APPLICANT, constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(logUpdate);

		const logUpdates = {
			eventType: constants.activityLogEvents.UPDATES_SUBMITTED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Updates submitted by applicant ${user.firstname} ${user.lastname}. ${currentVersion.displayTitle} of this application has been created.`,
			html: `<a class='activity-log-detail-link' href="${currentVersion.link}">Updates submitted</a> by applicant <b>${user.firstname} ${user.lastname}</b>. <a class='activity-log-detail-link' href="${currentVersion.link}">${currentVersion.displayTitle}</a> of this application has been created.`,
			user: user._id,
			version: currentVersion.detailedTitle,
			versionId: accessRequest.amendmentIterations.length > 0 ? currentVersion.iterationId : currentVersion.applicationId,
			userTypes: [constants.userTypes.APPLICANT, constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(logUpdates);
	}

	async logUpdateRequestedEvent(context) {
		const { accessRequest, user } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length - 1}`];

		const questionAnswers = accessRequest.amendmentIterations[accessRequest.amendmentIterations.length - 1].questionAnswers;
		const numberOfUpdatesRequested = Object.keys(questionAnswers).length;

		let detHtml = '';
		let detText = '';

		Object.keys(questionAnswers).forEach(questionId => {
			const answer = accessRequest.questionAnswers[questionId];
			const questionSet = accessRequest.jsonSchema.questionSets.find(qs => qs.questionSetId === questionAnswers[questionId].questionSetId);

			const questionPanel = accessRequest.jsonSchema.questionPanels.find(qp => qp.panelId === questionSet.questionSetId);

			const page = accessRequest.jsonSchema.pages.find(p => p.pageId === questionPanel.pageId);

			const question = this.getActiveQuestion(questionSet.questions, questionId);

			detHtml = detHtml.concat(
				`<div class='activity-log-detail'>` +
					`<div class='activity-log-detail-header'>${page.title + ' | ' + questionSet.questionSetHeader}</div>` +
					`<div class='activity-log-detail-row'>` +
					`<div class='activity-log-detail-row-question'>Question</div>` +
					`<div class='activity-log-detail-row-answer'>${question.question}</div>` +
					`</div>` +
					`<div class='activity-log-detail-row'>` +
					`<div class='activity-log-detail-row-question'>Answer</div>` +
					`<div class='activity-log-detail-row-answer'>${answer}</div>` +
					`</div>` +
					`</div>`
			);

			detText = detText.concat(
				`${page.title + ' | ' + questionSet.questionSetHeader}\nQuestion: ${question.question}\nAnswer: ${answer}\n\n`
			);
		});

		const log = {
			eventType: constants.activityLogEvents.UPDATE_REQUESTED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),

			plainText: `${numberOfUpdatesRequested} ${numberOfUpdatesRequested > 1 ? 'updates' : 'update'} requested by custodian manager ${
				user.firstname
			} ${user.lastname}.`,
			detailedText: detText,
			html: `<a class='activity-log-detail-link' href="${version.link}">${numberOfUpdatesRequested} ${
				numberOfUpdatesRequested > 1 ? ' updates ' : ' update '
			} requested</a> by custodian manager <b>${user.firstname} ${user.lastname}</b>.`,
			detailedHtml: detHtml,
			user: user._id,
			version: version.detailedTitle,
			versionId: accessRequest.amendmentIterations.length > 1 ? version.iterationId : version.applicationId,
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

	async logWorkflowAssignedEvent(context) {
		const { accessRequest, user } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length}`];

		const { workflow } = accessRequest;

		const detHtml =
			`<div class='activity-log-detail'><div class='activity-log-detail-header'>${workflow.workflowName}</div>` +
			workflow.steps
				.map(step => {
					return (
						`<div class='activity-log-detail-row'>` +
						`<div class='activity-log-detail-row-question'>${step.stepName}</div>` +
						`<div class='activity-log-detail-row-answer'>${step.reviewers.map(
							reviewer => reviewer.firstname + ' ' + reviewer.lastname
						)}</div>` +
						`</div>`
					);
				})
				.join(' ') +
			`</div>`;

		const detText = `${workflow.workflowName}\n${workflow.steps
			.map(step => {
				return step.stepName + ' ' + step.reviewers.map(reviewer => reviewer.firstname + ' ' + reviewer.lastname).join() + '\n';
			})
			.join('')}`;

		const log = {
			eventType: constants.activityLogEvents.WORKFLOW_ASSIGNED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `${workflow.workflowName} has been assigned by custodian manager ${user.firstname} ${user.lastname}`,
			detailedText: detText,
			html: `<a class='activity-log-detail-link' href="${version.link}">${workflow.workflowName}</a> has been assigned by custodian manager <b>${user.firstname} ${user.lastname}</b>`,
			detailedHtml: detHtml,
			user: user._id,
			version: version.detailedTitle,
			versionId: accessRequest.amendmentIterations.length > 0 ? version.iterationId : version.applicationId,
			userTypes: [constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logReviewPhaseStartedEvent(context) {
		const { accessRequest, user } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length}`];

		const { workflow } = accessRequest;

		const step = workflow.steps.find(step => step.active);

		const log = {
			eventType: constants.activityLogEvents.REVIEW_PHASE_STARTED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `${step.stepName} has started. ${workflow.steps.findIndex(step => step.active) + 1} out of ${
				workflow.steps.length
			} phases`,
			html: `<a class='activity-log-detail-link' href="${version.link}">${step.stepName}</a> has started. <b>${
				workflow.steps.findIndex(step => step.active) + 1
			} out of ${workflow.steps.length} phases</b>`,
			user: user._id,
			version: version.detailedTitle,
			versionId: accessRequest.amendmentIterations.length > 0 ? version.iterationId : version.applicationId,
			userTypes: [constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logReccomendationWithIssueEvent(context) {
		const { comments, accessRequest, user } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length}`];

		const detHtml =
			`<div class='activity-log-detail'>` +
			`<div class='activity-log-detail-header'>Recommendation: Issues found</div>` +
			`<div class='activity-log-detail-row'>${comments}</div>` +
			`</div>`;

		const detText = `Recommendation: Issues found\n${comments}`;

		const log = {
			eventType: constants.activityLogEvents.RECOMMENDATION_WITH_ISSUE,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Recommendation with issues found sent by reviewer ${user.firstname} ${user.lastname}`,
			detailedText: detText,
			html: `<a class='activity-log-detail-link' href="${version.link}">Recommendation with issues found</a> sent by reviewer <b>${user.firstname} ${user.lastname}</b>`,
			detailedHtml: detHtml,
			user: user._id,
			version: version.detailedTitle,
			versionId: accessRequest.amendmentIterations.length > 0 ? version.iterationId : version.applicationId,
			userTypes: [constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logReccomendationWithNoIssueEvent(context) {
		const { comments, accessRequest, user } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length}`];

		const detHtml =
			`<div class='activity-log-detail'>` +
			`<div class='activity-log-detail-header'>Recommendation: No issues found</div>` +
			`<div class='activity-log-detail-row'>${comments}</div>` +
			`</div>`;

		const detText = `Recommendation: No issues found\n${comments}`;

		const log = {
			eventType: constants.activityLogEvents.RECOMMENDATION_WITH_NO_ISSUE,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Recommendation with no issues found sent by reviewer ${user.firstname} ${user.lastname}`,
			detailedText: detText,
			html: `<a class='activity-log-detail-link' href="${version.link}">Recommendation with no issues found</a> sent by reviewer <b>${user.firstname} ${user.lastname}</b>`,
			detailedHtml: detHtml,
			user: user._id,
			version: version.detailedTitle,
			versionId: accessRequest.amendmentIterations.length > 0 ? version.iterationId : version.applicationId,
			userTypes: [constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logFinalDecisionRequiredEvent(context) {
		const { accessRequest, user } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length}`];

		const log = {
			eventType: constants.activityLogEvents.FINAL_DECISION_REQUIRED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Final decision required by custodian by custodian manager ${user.firstname} ${user.lastname}. All review phases completed`,
			html: `<a class='activity-log-detail-link' href="${version.link}">Final decision</a> required by custodian by custodian manager <b>${user.firstname} ${user.lastname}. All review phases completed<b>`,
			user: user._id,
			version: version.detailedTitle,
			versionId: accessRequest.amendmentIterations.length > 0 ? version.iterationId : version.applicationId,
			userTypes: [constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logPresubmissionMessages(context) {
		const logs = [];
		const { applicationId, messages, publisher } = context;

		// Create log for each message submitted
		messages.forEach(message => {
			const { createdBy, userType, createdDate } = message;

			if (!userType) return;

			const log = {
				eventType: constants.activityLogEvents.PRESUBMISSION_MESSAGE,
				logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
				timestamp: createdDate,
				user: createdBy._id,
				version: 'Pre-submission',
				versionId: applicationId,
				userTypes: [constants.userTypes.APPLICANT, constants.userTypes.CUSTODIAN],
				isPresubmission: true,
				...this.buildMessage(
					createdBy,
					userType,
					publisher,
					createdDate,
					message.messageDescription,
					`window.currentComponent.toggleDrawer(&quot;${message.topic}&quot;)`
				),
			};
			logs.push(log);
		});
		// Save all logs relating to presubmissions messages
		await this.activityLogRepository.createActivityLogs(logs);
	}

	async logDeadlinePassedEvent(context) {
		const { accessRequest } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length}`];

		const systemGeneratedUser = await UserModel.findOne({
			firstname: constants.systemGeneratedUser.FIRSTNAME,
			lastname: constants.systemGeneratedUser.LASTNAME,
		});

		const { workflow } = accessRequest;

		const step = workflow.steps.find(step => step.active);

		const { startDateTime, deadline } = step;
		const dateDeadline = moment(startDateTime).add(deadline, 'days');
		const daysSinceDeadlinePassed = moment().diff(dateDeadline, 'days');

		const detHtml =
			`<div class='activity-log-detail'>
			<div class='activity-log-detail-row-question'>Recommendations required from:</div>` +
			step.reviewers
				.map(reviewer => {
					return `<div class='activity-log-detail-row-answer'>` + reviewer.firstname + ' ' + reviewer.lastname + `</div>`;
				})
				.join('') +
			`</div>`;

		const detText =
			`Recommendations required from:` +
			step.reviewers
				.map(reviewer => {
					return `${reviewer.firstname + ' ' + reviewer.lastname}\n`;
				})
				.join('');

		const log = {
			eventType: constants.activityLogEvents.DEADLINE_PASSED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Deadline was ${daysSinceDeadlinePassed} ${daysSinceDeadlinePassed > 1 ? 'days' : 'day'} ago for ${step.stepName} ${
				workflow.steps.findIndex(step => step.active) + 1
			} out of ${workflow.steps.length} phases`,
			html: `<b>Deadline was ${daysSinceDeadlinePassed} ${
				daysSinceDeadlinePassed > 1 ? 'days' : 'day'
			} ago</b> for <a class='activity-log-detail-link' href="${version.link}">${step.stepName}</a> (<b>${
				workflow.steps.findIndex(step => step.active) + 1
			} out of ${workflow.steps.length} phases</b>)`,
			detailedHtml: detHtml,
			detailedText: detText,
			user: systemGeneratedUser._id,
			version: version.detailedTitle,
			versionId: accessRequest.amendmentIterations.length > 0 ? version.iterationId : version.applicationId,
			userTypes: [constants.userTypes.CUSTODIAN],
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logManualEvent(context) {
		const { versionId, versionTitle, description, timestamp, user = {} } = context;

		const log = {
			eventType: constants.activityLogEvents.MANUAL_EVENT,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp,
			user: user._id,
			version: versionTitle,
			versionId,
			userTypes: [constants.userTypes.APPLICANT, constants.userTypes.CUSTODIAN],
			html: `<b>New event "${description}"</b> added by custodian manager <b>${user.firstname} ${user.lastname}</b>`,
			plainText: `New event "${description}" added by custodian manager ${user.firstname} ${user.lastname}`,
		};

		// Save all logs relating to presubmissions messages
		await this.activityLogRepository.createActivityLog(log);
	}

	async logContextualMessage(context) {
		const { accessRequest, user, userType, questionId, messageBody } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length}`];

		const questionInfo = this.getQuestionInfo(accessRequest, questionId);

		const isPresubmission =
			accessRequest.applicationType === constants.submissionTypes.INITIAL &&
			accessRequest.applicationStatus === constants.applicationStatuses.INPROGRESS;

		const detailedHtml =
			`<div class='activity-log-detail'>` +
			`<div class='activity-log-detail-header'>${questionInfo.page.title + ' | ' + questionInfo.questionSet.questionSetHeader}</div>` +
			`<div class='activity-log-detail-row'>` +
			`<div class='activity-log-detail-row-question'>Question</div>` +
			`<div class='activity-log-detail-row-answer'>${questionInfo.question.question}</div>` +
			`</div>` +
			`<div class='activity-log-detail-row'>` +
			`<div class='activity-log-detail-row-question'>Message</div>` +
			`<div class='activity-log-detail-row-answer'>${messageBody}</div>` +
			`</div>` +
			`</div>`;

		const detailedText = `${questionInfo.page.title + ' | ' + questionInfo.questionSet.questionSetHeader}\nQuestion: ${
			questionInfo.question.question
		}\nMessage: ${messageBody}`;

		const plainText =
			userType === constants.userTypes.CUSTODIAN
				? `Message sent from ${user.firstname} ${user.lastname}`
				: `Message sent from applicant ${user.firstname} ${user.lastname}`;

		const html =
			userType === constants.userTypes.CUSTODIAN
				? `<a class='activity-log-detail-link' href="${version.link}">Message</a> sent from <b>${user.firstname} ${user.lastname} (${accessRequest.publisher})</b>`
				: `<a class='activity-log-detail-link' href="${version.link}">Message</a> sent from applicant <b>${user.firstname} ${user.lastname}</b>`;

		const log = {
			eventType: constants.activityLogEvents.CONTEXTUAL_MESSAGE,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			user: user._id,
			version: isPresubmission ? 'Pre-submission' : version.detailedTitle,
			isPresubmission: isPresubmission,
			versionId: accessRequest.amendmentIterations.length > 0 ? version.iterationId : version.applicationId,
			userTypes: [constants.userTypes.CUSTODIAN, constants.userTypes.APPLICANT],
			detailedText,
			detailedHtml,
			plainText,
			html,
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	async logNote(context) {
		const { accessRequest, user, userType, questionId, messageBody } = context;
		const version = accessRequest.versionTree[`${accessRequest.majorVersion}.${accessRequest.amendmentIterations.length}`];

		const questionInfo = this.getQuestionInfo(accessRequest, questionId);

		const isPresubmission =
			accessRequest.applicationType === constants.submissionTypes.INITIAL &&
			accessRequest.applicationStatus === constants.applicationStatuses.INPROGRESS;

		const detailedHtml =
			`<div class='activity-log-detail'>` +
			`<div class='activity-log-detail-header'>${questionInfo.page.title + ' | ' + questionInfo.questionSet.questionSetHeader}</div>` +
			`<div class='activity-log-detail-row'>` +
			`<div class='activity-log-detail-row-question'>Question</div>` +
			`<div class='activity-log-detail-row-answer'>${questionInfo.question.question}</div>` +
			`</div>` +
			`<div class='activity-log-detail-row'>` +
			`<div class='activity-log-detail-row-question'>Note</div>` +
			`<div class='activity-log-detail-row-answer'>${messageBody}</div>` +
			`</div>` +
			`</div>`;

		const detailedText = `${questionInfo.page.title + ' | ' + questionInfo.questionSet.questionSetHeader}\nQuestion: ${
			questionInfo.question.question
		}\n$Note: ${messageBody}`;

		const plainText =
			userType === constants.userTypes.CUSTODIAN
				? `Note added by ${user.firstname} ${user.lastname}`
				: `Note added by applicant ${user.firstname} ${user.lastname}`;

		const html =
			userType === constants.userTypes.CUSTODIAN
				? `<a class='activity-log-detail-link' href="${version.link}">Note</a> added by <b>${user.firstname} ${user.lastname} (${accessRequest.publisher})</b>`
				: `<a class='activity-log-detail-link' href="${version.link}">Note</a> added by applicant <b>${user.firstname} ${user.lastname}</b>`;

		const log = {
			eventType: constants.activityLogEvents.NOTE,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			user: user._id,
			version: isPresubmission ? 'Pre-submission' : version.detailedTitle,
			isPresubmission: isPresubmission,
			versionId: accessRequest.amendmentIterations.length > 0 ? version.iterationId : version.applicationId,
			userTypes: userType,
			detailedText,
			plainText,
			html,
			detailedHtml,
		};

		await this.activityLogRepository.createActivityLog(log);
	}

	getQuestionInfo(accessRequest, questionId) {
		const questionSet = accessRequest.jsonSchema.questionSets.find(qs => qs.questions.find(question => question.questionId === questionId));

		const questionPanel = accessRequest.jsonSchema.questionPanels.find(qp => qp.panelId === questionSet.questionSetId);

		const page = accessRequest.jsonSchema.pages.find(p => p.pageId === questionPanel.pageId);

		const question = this.getActiveQuestion(questionSet.questions, questionId);

		return { questionSet, questionPanel, page, question };
	}

	buildMessage(createdBy, userType, publisher, createdDate, messageBody, onClickScript) {
		const { firstname, lastname } = createdBy;
		let plainText, detailedText, html, detailedHtml;

		switch (userType) {
			case constants.userTypes.APPLICANT:
				plainText = `Message sent from applicant ${firstname} ${lastname}`;
				detailedText = `${firstname} ${lastname}\n${messageBody}`;
				html = `<a class='activity-log-detail-link' href='javascript:;' onClick='${onClickScript}'>Message</a> sent from applicant <b>${firstname} ${lastname}</b>`;
				detailedHtml =
					`<div class='activity-log-detail'>` +
					`<div class='activity-log-detail-header'>${firstname} ${lastname}</div>` +
					`<div class='activity-log-detail-row'>${messageBody}</div>` +
					`</div>`;
				break;
			case constants.userTypes.CUSTODIAN:
				plainText = `Message sent from ${firstname} ${lastname}`;
				detailedText = `${firstname} ${lastname}\n${messageBody}`;
				html = `<a class='activity-log-detail-link' href='javascript:;' onClick='${onClickScript}'>Message</a> sent from <b>${firstname} ${lastname} (${publisher})</b>`;
				detailedHtml =
					`<div class='activity-log-detail'>` +
					`<div class='activity-log-detail-header'>${firstname} ${lastname} (${publisher})</div>` +
					`<div class='activity-log-detail-row'>${messageBody}</div>` +
					`</div>`;
				break;
		}

		return {
			html,
			detailedHtml,
			plainText,
			detailedText,
		};
	}
}
