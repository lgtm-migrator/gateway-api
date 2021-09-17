require('dotenv').config();

const { google } = require('googleapis');

const scopes = 'https://www.googleapis.com/auth/analytics.readonly';
const jwt = new google.auth.JWT(process.env.GA_CLIENT_EMAIL, null, process.env.GA_PRIVATE_KEY, scopes);

const view_id = process.env.GA_VIEW_ID;

//unique users in the last month
module.exports.getUsersGA = async function (startDate, endDate) {
	await jwt.authorize();
	const result = await google.analytics('v3').data.ga.get({
		auth: jwt,
		ids: 'ga:' + view_id,
		'start-date': startDate,
		'end-date': endDate,
		metrics: 'ga:users',
	});

	return result;
};

//unique users total
module.exports.getTotalUsersGA = async function () {
	await jwt.authorize();
	const result = await google.analytics('v3').data.ga.get({
		auth: jwt,
		ids: 'ga:' + view_id,
		'start-date': '2020-05-01',
		'end-date': 'today',
		metrics: 'ga:users',
	});

	return result;
};
