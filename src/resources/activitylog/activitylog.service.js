import constants from './../utilities/constants.util';
import { UserModel } from '../user/user.model';
import _, { orderBy } from 'lodash';
import moment from 'moment';

export default class activityLogService {
	constructor(activityLogRepository) {
		this.activityLogRepository = activityLogRepository;
	}

	async searchLogs(versionIds, type, userType, versions) {
		const logs = await this.activityLogRepository.searchLogs(versionIds, type, userType);
		return this.formatLogs(logs, versions);
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
			case constants.activityLogEvents.FINAL_DECISION_REQUIRED:
				this.logFinalDecisionRequiredEvent(context);
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
			detailedText: `Conditions: ${accessRequest.applicationStatusDesc}`,
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
			detailedText: `Reason for rejection: ${accessRequest.applicationStatusDesc}`,
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
			detailedText: `Reason for amendment: ${accessRequest.submissionDescription}`,
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

		//mettere gli update qui.
		const questionAnswers = accessRequest.amendmentIterations[accessRequest.amendmentIterations.length - 1].questionAnswers;
		const numberOfUpdatesSubmitted = Object.keys(questionAnswers).length;

		let detHtml = '';

		Object.keys(questionAnswers).forEach(questionId => {
			const previousAnswer = accessRequest.questionAnswers[questionId];
			const questionSet = accessRequest.jsonSchema.questionSets.filter(
				qs => qs.questionSetId === questionAnswers[questionId].questionSetId
			);

			const updatedAnswer = questionAnswers[questionId].answer;

			const questionPanel = accessRequest.jsonSchema.questionPanels.filter(qp => qp.panelId === questionSet[0].questionSetId);

			const page = accessRequest.jsonSchema.pages.filter(p => p.pageId === questionPanel[0].pageId);

			const question = this.getActiveQuestion(questionSet[0].questions, questionId);

			detHtml = detHtml.concat(
				`<div class='activity-log-detail'>` +
					`<div class='activity-log-detail-header'>${page[0].title + ' | ' + questionSet[0].questionSetHeader}</div>` +
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
		});

		const logUpdate = {
			eventType: constants.activityLogEvents.UPDATE_SUBMITTED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),

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

		//mettere gli update qui.
		const questionAnswers = accessRequest.amendmentIterations[accessRequest.amendmentIterations.length - 1].questionAnswers;
		const numberOfUpdatesRequested = Object.keys(questionAnswers).length;

		let detHtml = '';

		Object.keys(questionAnswers).forEach(questionId => {
			const answer = accessRequest.questionAnswers[questionId];
			const questionSet = accessRequest.jsonSchema.questionSets.filter(
				qs => qs.questionSetId === questionAnswers[questionId].questionSetId
			);

			const questionPanel = accessRequest.jsonSchema.questionPanels.filter(qp => qp.panelId === questionSet[0].questionSetId);

			const page = accessRequest.jsonSchema.pages.filter(p => p.pageId === questionPanel[0].pageId);

			const question = this.getActiveQuestion(questionSet[0].questions, questionId);

			detHtml = detHtml.concat(
				`<div class='activity-log-detail'>` +
					`<div class='activity-log-detail-header'>${page[0].title + ' | ' + questionSet[0].questionSetHeader}</div>` +
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
		});

		const log = {
			eventType: constants.activityLogEvents.UPDATE_REQUESTED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),

			plainText: `${numberOfUpdatesRequested} ${numberOfUpdatesRequested > 1 ? 'updates' : 'update'} requested by custodian manager ${
				user.firstname
			} ${user.lastname}.`,
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

		let detHtml = '';

		detHtml = detHtml.concat(`<div class='activity-log-detail'><div class='activity-log-detail-header'>${workflow.workflowName}</div>`);

		detHtml = detHtml.concat(
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
				.join(' ')
		);

		detHtml = detHtml.concat(`</div>`);

		const log = {
			eventType: constants.activityLogEvents.WORKFLOW_ASSIGNED,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `${workflow.workflowName} has been assigned by custodian manager ${user.firstname} ${user.lastname}`,
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

		const log = {
			eventType: constants.activityLogEvents.RECOMMENDATION_WITH_ISSUE,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Recommendation with issues found sent by reviewer <b>${user.firstname} ${user.lastname}`,
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

		const log = {
			eventType: constants.activityLogEvents.RECOMMENDATION_WITH_NO_ISSUE,
			logType: constants.activityLogTypes.DATA_ACCESS_REQUEST,
			timestamp: Date.now(),
			plainText: `Recommendation with no issues found sent by reviewer <b>${user.firstname} ${user.lastname}`,
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
}
