import constants from '../../../utilities/constants.util';
import _ from 'lodash';

import datarequestUtil from '../datarequest.util';
const dataRequest = require('../../__mocks__/datarequest');

describe('injectQuestionActions', () => {
	// Arrange
	const data = _.cloneDeep(dataRequest);
	const guidance = { key: 'guidance', icon: 'far fa-question-circle', color: '#475da7', toolTip: 'Guidance', order: 1 };
	const requestAmendment = {
		key: 'requestAmendment',
		icon: 'fas fa-exclamation-circle',
		color: '#F0BB24',
		toolTip: 'Request applicant updates answer',
		order: 2,
	};
	const cases = [
		[
			data[0].jsonSchema,
			constants.userTypes.APPLICANT,
			constants.applicationStatuses.INPROGRESS,
			'',
			constants.userTypes.APPLICANT,
			[guidance],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.APPLICANT,
			constants.applicationStatuses.APPROVED,
			'',
			constants.userTypes.CUSTODIAN,
			[guidance],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.APPLICANT,
			constants.applicationStatuses.APPROVEDWITHCONDITIONS,
			'',
			constants.userTypes.CUSTODIAN,
			[guidance],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.APPLICANT,
			constants.applicationStatuses.INREVIEW,
			'',
			constants.userTypes.CUSTODIAN,
			[guidance],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.APPLICANT,
			constants.applicationStatuses.WITHDRAWN,
			'',
			constants.userTypes.CUSTODIAN,
			[guidance],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.APPLICANT,
			constants.applicationStatuses.SUBMITTED,
			'',
			constants.userTypes.CUSTODIAN,
			[guidance],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.CUSTODIAN,
			constants.applicationStatuses.APPROVED,
			constants.roleTypes.MANAGER,
			constants.userTypes.CUSTODIAN,
			[guidance],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.CUSTODIAN,
			constants.applicationStatuses.APPROVEDWITHCONDITIONS,
			constants.roleTypes.MANAGER,
			constants.userTypes.CUSTODIAN,
			[guidance],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.CUSTODIAN,
			constants.applicationStatuses.INREVIEW,
			constants.roleTypes.MANAGER,
			constants.userTypes.CUSTODIAN,
			[guidance, requestAmendment],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.CUSTODIAN,
			constants.applicationStatuses.INREVIEW,
			constants.roleTypes.MANAGER,
			constants.userTypes.APPLICANT,
			[guidance],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.CUSTODIAN,
			constants.applicationStatuses.WITHDRAWN,
			constants.roleTypes.MANAGER,
			constants.userTypes.CUSTODIAN,
			[guidance],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.CUSTODIAN,
			constants.applicationStatuses.SUBMITTED,
			constants.roleTypes.MANAGER,
			constants.userTypes.CUSTODIAN,
			[guidance],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.CUSTODIAN,
			constants.applicationStatuses.APPROVED,
			constants.roleTypes.REVIEWER,
			constants.userTypes.CUSTODIAN,
			[guidance],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.CUSTODIAN,
			constants.applicationStatuses.APPROVEDWITHCONDITIONS,
			constants.roleTypes.REVIEWER,
			constants.userTypes.CUSTODIAN,
			[guidance],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.CUSTODIAN,
			constants.applicationStatuses.INREVIEW,
			constants.roleTypes.REVIEWER,
			constants.userTypes.CUSTODIAN,
			[guidance],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.CUSTODIAN,
			constants.applicationStatuses.WITHDRAWN,
			constants.roleTypes.REVIEWER,
			constants.userTypes.CUSTODIAN,
			[guidance],
		],
		[
			data[0].jsonSchema,
			constants.userTypes.CUSTODIAN,
			constants.applicationStatuses.SUBMITTED,
			constants.roleTypes.REVIEWER,
			constants.userTypes.CUSTODIAN,
			[guidance],
		],
	];
	test.each(cases)(
		'given a jsonSchema object %p and the user is a/an %p, and the application status is %p, it returns the correct question actions',
		(data, userType, applicationStatus, role, activeParty, expectedResults) => {
			// Act
			const result = datarequestUtil.injectQuestionActions(data, userType, applicationStatus, role, activeParty);
			// Assert
			expectedResults.forEach(expectedResult => {
				expect(result.questionActions).toContainEqual(expectedResult);
			});
		}
	);
});
