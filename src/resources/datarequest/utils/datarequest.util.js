import _ from 'lodash';
import constants from '../../utilities/constants.util';
import teamController from '../../team/team.controller';

const injectQuestionActions = (jsonSchema, userType, applicationStatus, role = '') => {
    let formattedSchema = {};
    if(userType === constants.userTypes.CUSTODIAN) {
        formattedSchema = { ...jsonSchema, questionActions: constants.userQuestionActions[userType][role][applicationStatus] };
    } else {
        formattedSchema = { ...jsonSchema, questionActions: constants.userQuestionActions[userType][applicationStatus] };
    }
    return formattedSchema;
};

const getUserPermissionsForApplication = (application, userId, _id) => {
    try {
        let authorised = false,
            userType = '';
        // Return default unauthorised with no user type if incorrect params passed
        if (!application || !userId || !_id) {
            return { authorised, userType };
        }
        // Check if the user is a custodian team member and assign permissions if so
        if (_.has(application.datasets[0], 'publisher.team')) {
            let isTeamMember = teamController.checkTeamPermissions(
                '',
                application.datasets[0].publisher.team,
                _id
            );
            if (isTeamMember) {
                userType = constants.userTypes.CUSTODIAN;
                authorised = true;
            }
        }
        // If user is not authenticated as a custodian, check if they are an author or the main applicant
        if (
            application.applicationStatus ===
                constants.applicationStatuses.INPROGRESS ||
            _.isEmpty(userType)
        ) {
            if (
                application.authorIds.includes(userId) ||
                application.userId === userId
            ) {
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

const extractApplicantNames = (questionAnswers) => {
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

export default {
	injectQuestionActions: injectQuestionActions,
    getUserPermissionsForApplication: getUserPermissionsForApplication,
    extractApplicantNames: extractApplicantNames
};