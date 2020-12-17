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
		let authorised = false,
			isTeamMember = false,
			userType = '';
		// Return default unauthorised with no user type if incorrect params passed
		if (!application || !userId || !_id) {
			return { authorised, userType };
		}
		// Check if the user is a custodian team member and assign permissions if so
		if (_.has(application.datasets[0], 'publisher.team')) {
			isTeamMember = teamController.checkTeamPermissions('', application.datasets[0].publisher.team, _id);
		} else if (_.has(application, 'publisherObj.team')) {
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
	// 1. Define child object to allow recursive calls
	let child;
	// 2. Exit from function if no children are present
	if (!questionsArr) return {};
	// 3. Iterate through questions in the current level to locate question by Id
	for (const questionObj of questionsArr) {
		// 4. Return the question if it is located
		if (questionObj.questionId === questionId) return questionObj;
		// 5. Recursively call the find question function on child elements to find question Id
		if (typeof questionObj.input === 'object' && typeof questionObj.input.options !== 'undefined') {
			questionObj.input.options
				.filter(option => {
					return typeof option.conditionalQuestions !== 'undefined' && option.conditionalQuestions.length > 0;
				})
				.forEach(option => {
					child = findQuestion(option.conditionalQuestions, questionId);
				});
		}
		// 6. Return the child question
		if (child) return child;
	}
};

const updateQuestion = (questionsArr, question) => {
	// 1. Extract question Id
	let { questionId } = question;
	let found = false;
	// 2. Recursive function to iterate through each level of questions
	questionsArr.forEach(function iter(currentQuestion, index, currentArray) {
		// 3. Prevent unnecessary computation by exiting loop if question was found
		if (found) {
			return;
		}
		// 4. If the current question matches the target question, replace with updated question
		if (currentQuestion.questionId === questionId) {
			currentArray[index] = { ...question };
			found = true;
			return;
		}
		// 5. If target question has not been identified, recall function with child questions
		if (_.has(currentQuestion, 'input.options')) {
			currentQuestion.input.options.forEach(option => {
				if (_.has(option, 'conditionalQuestions')) {
					Array.isArray(option.conditionalQuestions) && option.conditionalQuestions.forEach(iter);
				}
			});
		}
	});
	// 6. Return the updated question array
	return questionsArr;
};

const setQuestionState = (question, questionAlert, readOnly) => {
	// 1. Find input object for question
	const { input = {} } = question;
	// 2. Assemble question in readOnly true/false mode
	question = {
		...question,
		input: {
			...input,
			questionAlert,
			readOnly,
		},
	};
	// 3. Recursively set readOnly mode for children
	if (_.has(question, 'input.options')) {
		question.input.options.forEach(function iter(currentQuestion) {
			// 4. If current question contains an input, set readOnly mode
			if (_.has(currentQuestion, 'input')) {
				currentQuestion.input.readOnly = readOnly;
			}
			// 5. Recall the iteration with each child question
			if (_.has(currentQuestion, 'conditionalQuestions')) {
				currentQuestion.conditionalQuestions.forEach(option => {
					if (_.has(option, 'input.options')) {
						Array.isArray(option.input.options) && option.input.options.forEach(iter);
					} else {
						option.input.readOnly = readOnly;
					}
				});
			}
		});
	}
	return question;
};

const buildQuestionAlert = (userType, iterationStatus, completed, amendment, user, publisher) => {
	// 1. Use a try catch to prevent conditions where the combination of params lead to no question alert required
	try {
		// 2. Static mapping allows us to determine correct flag to show based on scenario (params)
		const questionAlert = {
			...constants.navigationFlags[userType][iterationStatus][completed],
		};
		// 3. Extract data from amendment
		let { requestedBy, updatedBy, dateRequested, dateUpdated } = amendment;
		// 4. Update audit fields to 'you' if the action was performed by the current user
		requestedBy = matchCurrentUser(user, requestedBy);
		updatedBy = matchCurrentUser(user, updatedBy);
		// 5. Update the generic question alerts to match the scenario
		let relevantActioner = !_.isNil(updatedBy) ? updatedBy : userType === constants.userTypes.CUSTODIAN ? requestedBy : publisher;
		questionAlert.text = questionAlert.text.replace(
			'#NAME#',
			relevantActioner
		);
		questionAlert.text = questionAlert.text.replace(
			'#DATE#',
			userType === !_.isNil(dateUpdated)
				? moment(dateUpdated).format('Do MMM YYYY')
				: moment(dateRequested).format('Do MMM YYYY')
		);
		// 6. Return the built question alert
		return questionAlert;
	} catch (err) {
		return {};
	}
};

const matchCurrentUser = (user, auditField) => {
	// 1. Extract the name of the current user
	const { firstname, lastname } = user;
	// 2. Compare current user to audit field supplied e.g. 'updated by'
	if (auditField === `${firstname} ${lastname}`) {
		// 3. Update audit field value to 'you' if name matches current user
		return 'You';
	}
	// 4. Return updated audit field
	return auditField;
};

export default {
	injectQuestionActions: injectQuestionActions,
	getUserPermissionsForApplication: getUserPermissionsForApplication,
	extractApplicantNames: extractApplicantNames,
	findQuestion: findQuestion,
	updateQuestion: updateQuestion,
	buildQuestionAlert: buildQuestionAlert,
	setQuestionState: setQuestionState,
};
