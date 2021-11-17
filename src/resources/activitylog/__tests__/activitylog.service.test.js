import { cloneDeep } from 'lodash';
import sinon from 'sinon';

import { activityLogService, activityLogRepository } from '../dependency';
import { partyTimeRanges } from '../__mocks__/activitylogs.dar';
import { datasetActivityLogMocks, formattedJSONResponseMock, datasetVersionsMock } from '../__mocks__/activitylogs.dataset';
import constants from '../../utilities/constants.util';

afterEach(function () {
	sinon.restore();
});

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
	describe('logActivity', () => {
		it('Should invoke the logDatasetActivity function when eventype is "dataset', async () => {
			let serviceStub = sinon.stub(activityLogService, 'logDatasetActivity');

			await activityLogService.logActivity('mockEventType', { type: constants.activityLogTypes.DATASET });

			expect(serviceStub.calledOnce).toBe(true);
		});
	});

	describe('logDatasetActivity', () => {
		const datasetLoggingActivities = Object.keys(constants.activityLogEvents.dataset);
		const context = {
			updatedDataset: { datasetVersion: '1.0.0', _id: '618a72fd5ec8f54772b7a17a', applicationStatusDesc: 'Some admin comment!' },
			user: {
				firstname: 'John',
				lastname: 'Smith',
				_id: '618a72fd5ec8f54772b7a17b',
				teams: [
					{
						publisher: { _id: 'fakeTeam', name: 'fakeTeam' },
						type: 'admin',
						members: [{ memberid: '618a72fd5ec8f54772b7a17b', roles: ['admin_dataset'] }],
					},
				],
			},
			differences: [{ 'summary/title': 'VERSION 2' }],
		};

		test.each(datasetLoggingActivities)('Each event type creates a valid log', async event => {
			let createActivityStub = sinon.stub(activityLogRepository, 'createActivityLog');
			sinon.stub(Date, 'now').returns('123456');

			let log = {
				eventType: constants.activityLogEvents.dataset[event],
				logType: constants.activityLogTypes.DATASET,
				timestamp: '123456',
				user: context.user._id,
				userDetails: { firstName: context.user.firstname, lastName: context.user.lastname, role: 'admin' },
				version: context.updatedDataset.datasetVersion,
				versionId: context.updatedDataset._id,
				userTypes: [constants.userTypes.ADMIN, constants.userTypes.CUSTODIAN],
			};

			await activityLogService.logDatasetActivity(constants.activityLogEvents.dataset[event], context);

			expect(createActivityStub.calledOnce).toBe(true);
			if (event === 'DATASET_VERSION_SUBMITTED' || event === 'DATASET_VERSION_ARCHIVED' || event === 'DATASET_VERSION_UNARCHIVED') {
				expect(createActivityStub.calledWith(log)).toBe(true);
			}
			if (event === 'DATASET_VERSION_APPROVED' || event === 'DATASET_VERSION_REJECTED') {
				log.adminComment = 'Some admin comment!';
				expect(createActivityStub.calledWith(log)).toBe(true);
			}
			if (event === 'DATASET_UPDATES_SUBMITTED') {
				log.datasetUpdates = [{ 'summary/title': 'VERSION 2' }];
				expect(createActivityStub.calledWith(log)).toBe(true);
			}
		});
	});
	describe('searchLogs and formatLogs', () => {
		it('Should returned correctly formatted logs', async () => {
			const formatLogsStub = sinon.stub(activityLogRepository, 'searchLogs').returns(datasetActivityLogMocks);
			const versionIds = [datasetVersionsMock[0]._id, datasetVersionsMock[1]._id];
			const type = 'dataset';
			const userType = 'admin';
			const versions = datasetVersionsMock;

			const formattedResponse = await activityLogService.searchLogs(versionIds, type, userType, versions);

			expect(formatLogsStub.calledOnce).toBe(true);
			expect(formattedResponse).toStrictEqual(formattedJSONResponseMock);
		});
	});
});
