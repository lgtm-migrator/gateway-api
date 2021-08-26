import Hubspot from '@hubspot/api-client';
import * as Sentry from '@sentry/node';
import constants from '../../resources/utilities/constants.util';
import { UserModel } from '../../resources/user/user.model';

// See Hubspot API documentation for supporting info https://developers.hubspot.com/docs/api/crm

// Default service params
const apiKey = process.env.HUBSPOT_API_KEY;
let hubspotClient;
if (apiKey) hubspotClient = new Hubspot.Client({ apiKey });

/**
 * Sync A Single Gateway User With Hubspot
 *
 * @desc    Adds a Gateway user to the Hubspot CMS
 * @param 	{Object} 	        gatewayUser 				User object containing bio details and contact subscription preferences
 */
const syncContact = async gatewayUser => {
	if (apiKey) {
		// GET contact using email from Hubspot in case they already exist as we need to merge subscription preferences rather than replace
		// If contact found, merge subscription preferences and perform PUT operation
		// If contact not found, perform POST operation
	}
};

/**
 * Update A Hubspot Contact With Gateway User Details
 *
 * @desc    Updates a Hubspot contact record with corresponding Gateway user data using email address for unique match
 * @param 	{Object} 	        hubspotContact 				Contact object from Hubspot to be updated
 * @param 	{Object} 	        gatewayUser 				User object containing bio details and contact subscription preferences from Gateway
 */
const updateContact = async (hubspotContact, gatewayUser) => {
	if (apiKey) {
		// Extract and split hubspotContact communication preference
		// Modify comms preferences to match gatewayUser settings
		// Ensure Gateway Registered User is true
		// PUT operation to update contact in Hubspot
	}
};

/**
 * Create A Hubspot Contact With Gateway User Details
 *
 * @desc    Creates a new Hubspot contact record with corresponding Gateway user data using email address for unique match
 * @param 	{Object} 	        gatewayUser 				User object containing bio details and contact subscription preferences from Gateway
 */
const createContact = async gatewayUser => {
	if (apiKey) {
		// Build hubspotContact communication preferences
		// Ensure Gateway Registered User is true
		// POST operation to create contact in Hubspot
	}
};

/**
 * Sync Gateway Users With Hubspot
 *
 * @desc    Synchronises Gateway users with any changes reflected in Hubspot via external subscribe or unsubscribe methods e.g. mail link or sign up form sent via campaign
 */
 const syncAllContacts = async => {
	if (apiKey) {
		// 1. Track attempted sync in Sentry using log
		Sentry.addBreadcrumb({
			category: 'Hubspot',
			message: `Syncing Gateway users with Hubspot contacts`,
			level: Sentry.Severity.Log,
		});

		// Batch GET contacts from Hubspot
		await batchImportFromHubspot();

		// Batch POST update contacts to Hubspot
		await batchExportToHubspot();
	}
};


/**
 * Trigger Hubspot Import To Update Changes Made Externally From Gateway
 *
 * @desc    Triggers an import of all contacts found to match a user record in the Gateway, updating where changes have been made
 */
const batchImportFromHubspot = async () => {
	if (apiKey) {
		// 1. Get corresponding Gateway subscription variable e.g. feedback, news
		const subscriptionBoolKey = getSubscriptionBoolKey(subscriptionId);
		let processedCount = 0;
		// 2. Iterate bulk update process until all contacts have been processed from MailChimp
		while (processedCount < memberCount) {
			const { members = [] } = await mailchimp.get(`lists/${subscriptionId}/members?count=100&offset=${processedCount}`);
			let ops = [];
			// 3. For each member returned by MailChimp, create a bulk update operation to update the corresponding Gateway user if they exist
			members.forEach(member => {
				const subscribedBoolValue = member.status === 'subscribed' ? true : false;
				const { email_address: email } = member;
				ops.push({
					updateMany: {
						filter: { email },
						update: {
							[subscriptionBoolKey]: subscribedBoolValue,
						},
						upsert: false,
					},
				});
			});
			// 4. Run bulk update
			await UserModel.bulkWrite(ops);
			// 5. Increment counter to move onto next chunk of members
			processedCount = processedCount + members.length;
		}
	}
};

/**
 * Sync Hubspot Contact Details With User Profile Data From Gateway
 *
 * @desc    Updates Contact Details In Hubspot
 */
const batchExportToHubspot = async => {
	if (apiKey) {
		const subscriptionBoolKey = getSubscriptionBoolKey(subscriptionId);
		// 1. Get all users from db
		const users = await UserModel.find().select('id email firstname lastname news feedback').lean();
		// 2. Build members array providing required metadata for MailChimp
		const members = users.reduce((arr, user) => {
			// Get subscription status from user profile
			const status = user[subscriptionBoolKey]
				? constants.mailchimpSubscriptionStatuses.SUBSCRIBED
				: constants.mailchimpSubscriptionStatuses.UNSUBSCRIBED;
			// Check if the same email address has already been processed (email address can be attached to multiple user accounts)
			const memberIdx = arr.findIndex(member => member.email_address === user.email);
			if (status === constants.mailchimpSubscriptionStatuses.SUBSCRIBED) {
				if (memberIdx === -1) {
					// If email address has not be processed, return updated membership object
					return [
						...arr,
						{
							userId: user.id,
							email_address: user.email,
							status,
							tags,
							merge_fields: {
								FNAME: user.firstname,
								LNAME: user.lastname,
							},
						},
					];
				} else {
					// If email address has been processed, and the current status is unsubscribed, override membership status
					if (status === constants.mailchimpSubscriptionStatuses.UNSUBSCRIBED) {
						arr[memberIdx].status = constants.mailchimpSubscriptionStatuses.UNSUBSCRIBED;
					}
					return arr;
				}
			}
			return arr;
		}, []);
		// 3. Update subscription members in MailChimp
		await updateSubscriptionMembers(subscriptionId, members);
	}
};

const hubspotConnector = {
	syncContact,
	syncAllContacts,
};

export default hubspotConnector;
