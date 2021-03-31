import { signToken } from '../auth/utils';
import { DataRequestModel } from '../datarequest/datarequest.model';

const _buildGa4ghVisas = async user => {
	let passportDecoded = [],
		passportEncoded = [];
	let defaultAccountCreationDate = 1599177600; // 04/09/2020 UNIX Epoch time
	console.log(user);

	//AffiliationAndRole
	if (user.provider === 'oidc') {
		passportDecoded.push({
			iss: 'https://www.healthdatagateway.org',
			sub: user.id,
			ga4gh_visa_v1: {
				type: 'AffiliationAndRole',
				asserted: user.createdAt.getTime() || defaultAccountCreationDate,
				value: user.affiliation || 'no.organization', //open athens EDUPersonRole
				source: 'https://www.healthdatagateway.org',
			},
		});
	}

	//AcceptTermsAndPolicies
	passportDecoded.push({
		iss: 'https://www.healthdatagateway.org',
		sub: user.id,
		ga4gh_visa_v1: {
			type: 'AcceptTermsAndPolicies',
			asserted: user.createdAt.getTime() || defaultAccountCreationDate,
			value: 'https://www.hdruk.ac.uk/infrastructure/gateway/terms-and-conditions/',
			source: 'https://www.healthdatagateway.org',
		},
	});

	if (user.acceptedAdvancedSearchTerms) {
		passportDecoded.push({
			iss: 'https://www.healthdatagateway.org',
			sub: user.id,
			ga4gh_visa_v1: {
				type: 'AcceptTermsAndPolicies',
				asserted: user.createdAt.getTime() || defaultAccountCreationDate,
				value: 'https://www.hdruk.ac.uk/infrastructure/gateway/advanced-search-terms-and-conditions/',
				source: 'https://www.healthdatagateway.org',
			},
		});
	}

	//ResearcherStatus
	passportDecoded.push({
		iss: 'https://www.healthdatagateway.org',
		sub: user.id,
		ga4gh_visa_v1: {
			type: 'ResearcherStatus',
			asserted: user.createdAt.getTime() || defaultAccountCreationDate,
			value: 'https://web.www.healthdatagateway.org/person/' + user.id, //User profile maybe?
			source: 'https://www.healthdatagateway.org',
		},
	});

	//ControlledAccessGrants
	let approvedDARApplications = await getApprovedDARApplications(user);
	approvedDARApplications.forEach(dar => {
		passportDecoded.push({
			iss: 'https://www.healthdatagateway.org',
			sub: user.id,
			ga4gh_visa_v1: {
				type: 'ControlledAccessGrants',
				asserted: dar.dateFinalStatus, //date DAR was approved
				value: dar.datasetIds.map(datasetId => {
					return 'https://web.www.healthdatagateway.org/dataset/' + datasetId;
				}), //URL to each dataset that they have been approved for
				source: 'https://www.healthdatagateway.org',
			},
		});
	});

	passportDecoded.forEach(visa => {
		const expires_in = 900;
		const jwt = signToken(visa, expires_in);
		passportEncoded.push(jwt);
	});

	return passportEncoded;
};

const getApprovedDARApplications = async user => {
	let foundApplications = await DataRequestModel.find(
		{ $and: [{ userId: user.id }, { applicationStatus: { $in: ['approved', 'approved with conditions'] } }] },
		{ datasetIds: 1, dateFinalStatus: 1 }
	).lean();

	return foundApplications;
};

export default {
	buildGa4ghVisas: _buildGa4ghVisas,
};
