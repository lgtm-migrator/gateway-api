import { isEmpty, has, isUndefined } from 'lodash';
import moment from 'moment';

export default class DataRequestService {
	constructor(dataRequestRepository) {
		this.dataRequestRepository = dataRequestRepository;
	}

	async getAccessRequestsByUser(userId, query = {}) {
		return this.dataRequestRepository.getAccessRequestsByUser(userId, query);
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

	createApplicationDTO(accessRecord, userType, userId = '') {
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
			reviewPanels = []

		// Check if the application has a workflow assigned
		let { workflow = {}, applicationStatus } = accessRecord;
		if (has(accessRecord, 'publisherObj.team.members')) {
			let {
				publisherObj: {
					team: { members, users },
				},
			} = accessRecord;
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
				(applicationStatus === constants.applicationStatuses.INREVIEW && isEmpty(workflow))
			) {
				remainingActioners = managerUsers.join(', ');
			}
			if (!isEmpty(workflow)) {
				({ workflowName } = workflow);
				workflowCompleted = this.workflowService.getWorkflowCompleted(workflow);
				let activeStep = this.workflowService.getActiveWorkflowStep(workflow);
				// Calculate active step status
				if (!isEmpty(activeStep)) {
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
					} = this.workflowService.getActiveStepStatus(activeStep, users, userId));
					let activeStepIndex = workflow.steps.findIndex(step => {
						return step.active === true;
					});
					workflow.steps[activeStepIndex] = {
						...workflow.steps[activeStepIndex],
						reviewStatus,
					};
				} else if (isUndefined(activeStep) && applicationStatus === constants.applicationStatuses.INREVIEW) {
					reviewStatus = 'Final decision required';
					remainingActioners = managerUsers.join(', ');
				}
				// Get decision duration if completed
				let { dateFinalStatus, dateSubmitted } = accessRecord;
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
		if (isEmpty(accessRecord.datasets) || isUndefined(accessRecord.datasets)) {
			accessRecord.datasets = [accessRecord.dataset];
			accessRecord.datasetIds = [accessRecord.datasetid];
		}
		let {
			datasetfields: { publisher },
			name,
		} = accessRecord.datasets[0];
		let { aboutApplication, questionAnswers } = accessRecord;

		if (aboutApplication) {
			({ projectName } = aboutApplication);
		}
		if (isEmpty(projectName)) {
			projectName = `${publisher} - ${name}`;
		}
		if (questionAnswers) {
			applicants = datarequestUtil.extractApplicantNames(questionAnswers).join(', ');
		}
		if (isEmpty(applicants)) {
			let { firstname, lastname } = accessRecord.mainApplicant;
			applicants = `${firstname} ${lastname}`;
		}
		return {
			...accessRecord,
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
			reviewPanels
		};
	}
}
