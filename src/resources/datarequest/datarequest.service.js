import { isEmpty } from 'lodash';
import moment from 'moment';

import datarequestUtil from '../datarequest/utils/datarequest.util';
import constants from '../utilities/constants.util';

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

	getApplicationIsReadOnly(userType, applicationStatus) {
		let readOnly = true;
		if (userType === constants.userTypes.APPLICANT && applicationStatus === constants.applicationStatuses.INPROGRESS) {
			readOnly = false;
		}
		return readOnly;
	}

	getProjectName(accessRecord) {
		// Retrieve project name from about application section
		const {
			aboutApplication: { projectName },
		} = accessRecord;
		if (projectName) {
			return projectName;
		} else {
			// Build default project name from publisher and dataset name
			const {
				datasetfields: { publisher },
				name,
			} = accessRecord.datasets[0];
			return `${publisher} - ${name}`;
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
}
