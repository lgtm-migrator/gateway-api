import { activityLogService } from '../dependency';
import { partyTimeRanges } from '../__mocks__/activitylogs';
import { cloneDeep } from 'lodash';
import constants from '../../utilities/constants.util';

describe('ActivityLogService', function () {
	describe('calculateTimeWithParty', function () {
		// Arrange
		let data = cloneDeep(partyTimeRanges);
		const cases = [
			[data[0], constants.userTypes.APPLICANT, '0%'],
			[data[0], constants.userTypes.CUSTODIAN, '100%'],

			[data[1], constants.userTypes.APPLICANT, '25%'],
			[data[1], constants.userTypes.CUSTODIAN, '75%'],

			[data[2], constants.userTypes.APPLICANT, '50%'],
			[data[2], constants.userTypes.CUSTODIAN, '50%'],

			[data[3], constants.userTypes.APPLICANT, '75%'],
			[data[3], constants.userTypes.CUSTODIAN, '25%'],

			[data[4], constants.userTypes.APPLICANT, '100%'],
			[data[4], constants.userTypes.CUSTODIAN, '0%'],

			[data[5], constants.userTypes.APPLICANT, '37%'],
			[data[5], constants.userTypes.CUSTODIAN, '63%'],
		];
		test.each(cases)(
			'given an array of time ranges for each party and a chosen party type, the correct percentage spent with the party type is returned',
			(partyDurations, partyType, expectedResult) => {
				// Act
				const result = activityLogService.calculateTimeWithParty(partyDurations, partyType);
				// Assert
				expect(result).toBe(expectedResult);
			}
		);
	});
});
