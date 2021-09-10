import constants from '../../utilities/constants.util';

module.exports = {
	partyTimeRanges: [
		[
			{ from: '2021-08-09T12:00:00.000+0000', to: '2021-08-09T13:00:00.000+0000', party: constants.userTypes.CUSTODIAN },
			{ from: '2021-08-09T13:00:00.000+0000', to: '2021-08-09T14:00:00.000+0000', party: constants.userTypes.CUSTODIAN },
		],
		[
			{ from: '2021-08-09T12:00:00.000+0000', to: '2021-08-09T16:00:00.000+0000', party: constants.userTypes.APPLICANT },
			{ from: '2021-08-09T16:00:00.000+0000', to: '2021-08-10T04:00:00.000+0000', party: constants.userTypes.CUSTODIAN },
		],
		[
			{ from: '2021-08-09T12:00:00.000+0000', to: '2021-08-09T16:00:00.000+0000', party: constants.userTypes.APPLICANT },
			{ from: '2021-08-09T16:00:00.000+0000', to: '2021-08-10T04:00:00.000+0000', party: constants.userTypes.CUSTODIAN },
			{ from: '2021-08-09T04:00:00.000+0000', to: '2021-08-09T16:00:00.000+0000', party: constants.userTypes.APPLICANT },
			{ from: '2021-08-09T16:00:00.000+0000', to: '2021-08-09T20:00:00.000+0000', party: constants.userTypes.CUSTODIAN },
		],
		[
			{ from: '2021-08-10T12:00:00.000+0000', to: '2021-08-16T12:00:00.000+0000', party: constants.userTypes.APPLICANT },
			{ from: '2021-08-16T12:00:00.000+0000', to: '2021-08-18T12:00:00.000+0000', party: constants.userTypes.CUSTODIAN },
		],
		[
			{ from: '2021-08-10T12:00:00.000+0000', to: '2021-08-16T12:00:00.000+0000', party: constants.userTypes.APPLICANT },
			{ from: '2021-08-16T12:00:00.000+0000', to: '2021-08-18T12:00:00.000+0000', party: constants.userTypes.APPLICANT },
		],
		[
			{ from: '2021-08-10T13:11:12.000+0000', to: '2021-08-12T12:18:23.000+0000', party: constants.userTypes.APPLICANT },
			{ from: '2021-08-12T12:18:23.000+0000', to: '2021-08-15T17:27:10.000+0000', party: constants.userTypes.CUSTODIAN },
			{ from: '2021-08-15T17:27:10.000+0000', to: '2021-08-20T08:57:45.000+0000', party: constants.userTypes.APPLICANT },
			{ from: '2021-08-20T08:57:45.000+0000', to: '2021-08-28T10:42:36.000+0000', party: constants.userTypes.CUSTODIAN },
		],
	],
};
