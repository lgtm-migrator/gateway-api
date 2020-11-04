const amendments = require('./reduce');
const data = require('./data');

const testData = data.accessRecord;

describe('getLatestAmendmentIteration', () => {
    it('extracts most recent iteration object by created date', () => {
        const data = amendments.getLatestAmendmentIteration(testData.amendmentIterations);
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
        
        expect(data).toEqual(expected);
    });
});