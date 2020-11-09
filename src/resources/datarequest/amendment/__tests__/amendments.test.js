import constants from '../../../utilities/constants.util';
import datarequest from '../../__mocks__/datarequest';

const amendmentController = require('../amendment.controller');
const dataRequest = require('../../__mocks__/datarequest');

describe('getLatestAmendmentIteration', () => {
    test('extracts most recent iteration object by created date', () => {
        const result = amendmentController.getLatestAmendmentIteration(dataRequest.amendmentIterations);
        const expected = {
			dateCreated: '2020-11-03T11:14:01.843+00:00',
			createdBy: '5f03530178e28143d7af2eb1',
			questionAnswers: {
				lastName: {
					questionSetId: 'applicant',
					requested: true,
					reason: 'test reason',
					requestedBy: 'Robin Kavanagh',
					requestedByUser: '5f03530178e28143d7af2eb1',
					dateRequested: '2020-11-03T11:14:01.840+00:00',
				},
			},
		};
		expect(result).toEqual(expected);
	});
	test('extracts most recent iteration object index by created date', () => {
        expect(amendmentController.getLatestAmendmentIterationIndex(dataRequest)).toEqual(1);
    });
});

describe('getAmendmentIterationParty', () => {
    test('custodian is current responsible party until application is returned', () => {
		expect(amendmentController.getAmendmentIterationParty(dataRequest)).toEqual(constants.userTypes.CUSTODIAN);
	});
	test('applicant is current responsible party when application is returned', () => {
		dataRequest.amendmentIterations[1].dateReturned = new Date();
		expect(amendmentController.getAmendmentIterationParty(dataRequest)).toEqual(constants.userTypes.APPLICANT);
	});
});

describe('removeAmendmentAnswers', () => {
    test('strips amendment answers from a passed iteration', () => {
		let result = amendmentController.removeAmendmentAnswers(dataRequest.amendmentIterations[0]);
		const expected = {
			dateCreated: '2020-10-03T11:14:01.843+00:00',
			createdBy: '5f03530178e28143d7af2eb1',
			dateReturned: '2020-10-04T11:14:01.843+00:00',
			returnedBy: '5f03530178e28143d7af2eb1',
			dateSubmitted: '2020-10-05T11:14:01.843+00:00',
			submittedBy: '5f03530178e28143d7af2eb1',
			questionAnswers: {
				firstName: {
					questionSetId: 'applicant',
					requested: true,
					reason: 'test reason',
					requestedBy: 'Robin Kavanagh',
					requestedByUser: '5f03530178e28143d7af2eb1',
					dateRequested: '2020-11-03T11:14:01.840+00:00'
				},
				lastName: {
					questionSetId: 'applicant',
					requested: true,
					reason: 'test reason',
					requestedBy: 'Robin Kavanagh',
					requestedByUser: '5f03530178e28143d7af2eb1',
					dateRequested: '2020-11-03T11:14:01.840+00:00'
				},
			},
		};
		expect(result).toEqual(expected);
	});
});

