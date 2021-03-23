import { signToken } from '../auth/utils';

const _buildGa4ghVisas = user => {
	let passportDecoded = [],
		passportEncoded = [];

	//AffiliationAndRole
	passportDecoded.push({
		iss: 'https://www.healthdatagateway.org',
		sub: user.id,
		ga4gh_visa_v1: {
			type: 'AffiliationAndRole',
			asserted: Date.now(), //date account was created
			value: 'faculty@med.stanford.edu', //open athens EDUPersonRole
			source: 'https://www.healthdatagateway.org',
		},
	});

	//AcceptTermsAndPolicies
	passportDecoded.push({
		iss: 'https://www.healthdatagateway.org',
		sub: user.id,
		ga4gh_visa_v1: {
			type: 'AcceptTermsAndPolicies',
			asserted: Date.now(), //date account was created
			value: 'https://www.hdruk.ac.uk/infrastructure/gateway/terms-and-conditions/',
			source: 'https://www.healthdatagateway.org',
		},
	});

	//ResearcherStatus
	passportDecoded.push({
		iss: 'https://www.healthdatagateway.org',
		sub: user.id,
		ga4gh_visa_v1: {
			type: 'ResearcherStatus',
			asserted: Date.now(),
			value: 'https://web.www.healthdatagateway.org/person/2569817002606598', //User profile maybe?
			source: 'https://www.healthdatagateway.org',
		},
	});

	//ControlledAccessGrants
	passportDecoded.push({
		iss: 'https://www.healthdatagateway.org',
		sub: user.id,
		ga4gh_visa_v1: {
			type: 'ControlledAccessGrants',
			asserted: Date.now(), //date DAR was approved
			value: 'https://web.www.healthdatagateway.org/dataset/a05aef07-c3fa-4331-905a-6b6f58eac3d5', //URL to each dataset that they have been approved for
			source: 'https://www.healthdatagateway.org',
		},
	});

	passportDecoded.forEach(visa => {
		const expires_in = 900;
		const jwt = signToken(visa, expires_in);
		passportEncoded.push(jwt);
	});

	return passportEncoded;
};

export default {
	buildGa4ghVisas: _buildGa4ghVisas,
};
