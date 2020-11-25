import constants from '../../utilities/constants.util';
import _ from 'lodash';

const datarequestController = require('../datarequest.controller');
const dataRequest = require('../__mocks__/datarequest');

describe('injectQuestionActions', () => {
	// Arrange
    const data = _.cloneDeep(dataRequest);
    const guidance = { key: 'guidance', icon: 'far fa-question-circle', color:'#475da7', toolTip: 'Guidance', order: 1 };
    const requestAmendment = { key: 'requestAmendment', icon: 'fas fa-exclamation-circle', color: '#F0BB24', toolTip: 'Request applicant updates answer', order: 2 };
    const cases =  [[data[0].jsonSchema, constants.userTypes.APPLICANT, constants.applicationStatuses.INPROGRESS, [guidance]], 
                    [data[0].jsonSchema, constants.userTypes.APPLICANT, constants.applicationStatuses.APPROVED, [guidance]],
                    [data[0].jsonSchema, constants.userTypes.APPLICANT, constants.applicationStatuses.APPROVEDWITHCONDITIONS, [guidance]],
                    [data[0].jsonSchema, constants.userTypes.APPLICANT, constants.applicationStatuses.INREVIEW, [guidance]],
                    [data[0].jsonSchema, constants.userTypes.APPLICANT, constants.applicationStatuses.WITHDRAWN, [guidance]],
                    [data[0].jsonSchema, constants.userTypes.APPLICANT, constants.applicationStatuses.SUBMITTED, [guidance]],
                    [data[0].jsonSchema, constants.userTypes.CUSTODIAN, constants.applicationStatuses.APPROVED, [guidance]],
                    [data[0].jsonSchema, constants.userTypes.CUSTODIAN, constants.applicationStatuses.APPROVEDWITHCONDITIONS, [guidance]],
                    [data[0].jsonSchema, constants.userTypes.CUSTODIAN, constants.applicationStatuses.INREVIEW, [guidance, requestAmendment]],
                    [data[0].jsonSchema, constants.userTypes.CUSTODIAN, constants.applicationStatuses.WITHDRAWN, [guidance]],
                    [data[0].jsonSchema, constants.userTypes.CUSTODIAN, constants.applicationStatuses.SUBMITTED, [guidance, requestAmendment]],
                ];
	test.each(cases)(
		"given a jsonSchema object %p and the user is a/an %p, and the application status is %p, it returns the correct question actions",
		(data, userType, applicationStatus, expectedResults) => {
			// Act
            const result = datarequestController.injectQuestionActions(data, userType, applicationStatus);
            // Assert
            expectedResults.forEach((expectedResult) => {
                expect(result.questionActions).toContainEqual(expectedResult);
            });
		}
	);
});