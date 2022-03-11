import emailGeneratorUtil from '../utilities/emailGenerator.util';
import { UserModel } from './user.model';

export async function createUser({ firstname, lastname, email, providerId, provider, role }) {
	return new Promise(async resolve => {
		const id = parseInt(Math.random().toString().replace('0.', ''));
		// create new user from details from provider
		const user = await UserModel.create({
			id,
			providerId,
			provider,
			firstname,
			lastname,
			email,
			role,
		});
		// if a user has been created send new introduction email
		if (user) {
			const msg = {
				to: email,
				from: 'gateway@hdruk.ac.uk',
				templateId: process.env.SENDGRID_INTRO_EMAIL,
			};
			emailGeneratorUtil.sendIntroEmail(msg);
		}
		// return user via promise
		return resolve(user);
	});
}

export async function updateUser({ id, firstname, lastname, email, discourseKey, discourseUsername, feedback, news }) {
	return new Promise(async resolve => {
		return resolve(
			await UserModel.findOneAndUpdate(
				{ id: id },
				{
					firstname: firstname,
					lastname: lastname,
					email: email,
					discourseKey: discourseKey,
					discourseUsername: discourseUsername,
					feedback: feedback,
					news: news,
				},
				{ new: true }
			)
		);
	});
}

export async function updateRedirectURL({ id, redirectURL }) {
	return new Promise(async resolve => {
		return resolve(
			await UserModel.findOneAndUpdate(
				{ id: id },
				{
					redirectURL: redirectURL,
				}
			)
		);
	});
}

export async function setCohortDiscoveryAccess(id, roles) {
	return new Promise(async (resolve, reject) => {
		const user = await UserModel.findOne({ id }, { advancedSearchRoles: 1 }).lean();
		if (!user) return reject({ statusCode: 400, message: 'No user exists for id provided.' });

		if (user.advancedSearchRoles && user.advancedSearchRoles.includes('BANNED')) {
			return reject({ statusCode: 403, message: 'User is banned.  No update applied.' });
		}

		const rolesCleansed = roles.map(role => role.toString());
		const updatedUser = await UserModel.findOneAndUpdate({ id }, { advancedSearchRoles: rolesCleansed }, { new: true }, err => {
			if (err) return reject({ statusCode: 500, message: err });
		}).lean();
		return resolve(updatedUser);
	});
}

export async function getAccessRequestsUserDetails(id ) {
	return new Promise(async resolve => {
		return resolve(
                 await UserModel.find({id: id}).lean()
                )

	});
}
