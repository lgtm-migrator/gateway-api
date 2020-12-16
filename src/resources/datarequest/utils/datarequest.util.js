import _ from 'lodash';
import constants from '../../utilities/constants.util';
import teamController from '../../team/team.controller';
import moment from 'moment';

const injectQuestionActions = (jsonSchema, userType, applicationStatus, role = '') => {
	let formattedSchema = {};
	if (userType === constants.userTypes.CUSTODIAN) {
		formattedSchema = { ...jsonSchema, questionActions: constants.userQuestionActions[userType][role][applicationStatus] };
	} else {
		formattedSchema = { ...jsonSchema, questionActions: constants.userQuestionActions[userType][applicationStatus] };
	}
	return formattedSchema;
};

const getUserPermissionsForApplication = (application, userId, _id) => {
	try {
		let authorised = false, isTeamMember = false, userType = '';
		// Return default unauthorised with no user type if incorrect params passed
		if (!application || !userId || !_id) {
			return { authorised, userType };
		}
		// Check if the user is a custodian team member and assign permissions if so
		if (_.has(application.datasets[0], 'publisher.team')) {
			isTeamMember = teamController.checkTeamPermissions('', application.datasets[0].publisher.team, _id);
		}
		else if(_.has(application, 'publisherObj.team')) {
			isTeamMember = teamController.checkTeamPermissions('', application.publisherObj.team, _id);
		}
		if (isTeamMember) {
			userType = constants.userTypes.CUSTODIAN;
			authorised = true;
		}
		// If user is not authenticated as a custodian, check if they are an author or the main applicant
		if (application.applicationStatus === constants.applicationStatuses.INPROGRESS || _.isEmpty(userType)) {
			if (application.authorIds.includes(userId) || application.userId === userId) {
				userType = constants.userTypes.APPLICANT;
				authorised = true;
			}
		}
		return { authorised, userType };
	} catch (error) {
		console.error(error);
		return { authorised: false, userType: '' };
	}
};

const extractApplicantNames = questionAnswers => {
	let fullnames = [],
		autoCompleteLookups = { fullname: ['email'] };
	// spread questionAnswers to new var
	let qa = { ...questionAnswers };
	// get object keys of questionAnswers
	let keys = Object.keys(qa);
	// loop questionAnswer keys
	for (const key of keys) {
		// get value of key
		let value = qa[key];
		// split the key up for unique purposes
		let [qId] = key.split('_');
		// check if key in lookup
		let lookup = autoCompleteLookups[`${qId}`];
		// if key exists and it has an object do relevant data setting
		if (typeof lookup !== 'undefined' && typeof value === 'object') {
			switch (qId) {
				case 'fullname':
					fullnames.push(value.name);
					break;
			}
		}
	}
	return fullnames;
};

const findQuestion = (questionsArr, questionId) => {
	let child;

	if (!questionsArr) return {};

	for (const questionObj of questionsArr) {
		if (questionObj.questionId === questionId) return questionObj;

		if (typeof questionObj.input === 'object' && typeof questionObj.input.options !== 'undefined') {
			questionObj.input.options
				.filter(option => {
					return typeof option.conditionalQuestions !== 'undefined' && option.conditionalQuestions.length > 0;
				})
				.forEach(option => {
					child = findQuestion(option.conditionalQuestions, questionId);
				});
		}

		if (child) return child;
	}
};

const updateQuestion = (questionsArr, question) => {
	let { questionId } = question;
	let found = false;

	questionsArr.forEach(function iter(currentQuestion, index, currentArray) {
		if (found) {
			return;
		}
		if (currentQuestion.questionId === questionId) {
			currentArray[index] = { ...question };
			found = true;
			return;
		}
		if (_.has(currentQuestion, 'input.options')) {
			currentQuestion.input.options.forEach(option => {
				if (_.has(option, 'conditionalQuestions')) {
					Array.isArray(option.conditionalQuestions) && option.conditionalQuestions.forEach(iter);
				}
			});
		}
	});

	return questionsArr;
};

const buildQuestionAlert = (userType, iterationStatus, completed, amendment, user) => {
	try {
		const questionAlert = {
			...constants.navigationFlags[userType][iterationStatus][completed],
		};

		let { requestedBy, updatedBy, dateRequested, dateUpdated } = amendment;

		requestedBy = matchCurrentUser(user, requestedBy);
		updatedBy = matchCurrentUser(user, updatedBy);

		questionAlert.text = questionAlert.text.replace(
			'#NAME#',
			userType === constants.userTypes.APPLICANT || iterationStatus === 'submitted' ? updatedBy : requestedBy
		);
		questionAlert.text = questionAlert.text.replace(
			'#DATE#',
			userType === constants.userTypes.APPLICANT || iterationStatus === 'submitted'
				? moment(dateUpdated).format('Do MMM YYYY')
				: moment(dateRequested).format('Do MMM YYYY')
		);
		return questionAlert;
	} catch (err) {
		return {};
	}
};

const matchCurrentUser = (user, auditField) => {
	const { firstname, lastname } = user;
	if (auditField === `${firstname} ${lastname}`) {
		return 'You';
	}
	return auditField;
};

export default {
	injectQuestionActions: injectQuestionActions,
	getUserPermissionsForApplication: getUserPermissionsForApplication,
	extractApplicantNames: extractApplicantNames,
	findQuestion: findQuestion,
	updateQuestion: updateQuestion,
	buildQuestionAlert: buildQuestionAlert,
};
