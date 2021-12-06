import emailGeneratorUtil from '../utilities/emailGenerator.util';
import { UserModel } from './user.model';
import { Data } from '../tool/data.model';
import helper from '../utilities/helper.util';
import { Cohort } from '../cohort/cohort.model';
import { Collections } from '../collections/collections.model';
import { DataRequestModel } from '../datarequest/datarequest.model';

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

// Gets all of the logged in users collaborators
export async function getUsersCollaborators(currentUserId) {
	let collaborators = [];

	// Get all collaborators from collections
	let collaboratorsCollections = await Collections.find({ authors: currentUserId }, { _id: 0, authors: 1 });
	await populateCollaborators(collaboratorsCollections, 'authors', collaborators, currentUserId);

	// Get all collaborators from cohorts
	let collaboratorsCohorts = await Cohort.find({ uploaders: currentUserId }, { _id: 0, uploaders: 1 });
	await populateCollaborators(collaboratorsCohorts, 'uploaders', collaborators, currentUserId);

	// Get all collaborators from tools and papers (data collection)
	let collaboratorsTools = await Data.find({ authors: currentUserId }, { _id: 0, authors: 1 });
	await populateCollaborators(collaboratorsTools, 'authors', collaborators, currentUserId);

	// Get all collaborators from DARs
	let collaboratorsDARs = await DataRequestModel.find(
		{ $or: [{ userId: currentUserId }, { authorIds: currentUserId }] },
		{ _id: 0, authorIds: 1, userId: 1 }
	);
	await populateCollaborators(collaboratorsDARs, 'authorIds', collaborators, currentUserId);

	// Strip out duplicate collaborators, add a count
	let uniqueCollaborators = new Map();

	for (const collaborator of collaborators) {
		if (uniqueCollaborators.has(collaborator)) {
			let incrementedValue = uniqueCollaborators.get(collaborator) + 1;
			uniqueCollaborators.set(collaborator, incrementedValue);
		} else {
			uniqueCollaborators.set(collaborator, 1);
		}
	}

	return uniqueCollaborators;
}

async function populateCollaborators(collaboratorsEntity, items, collaborators, currentUserId) {
	for (const collaborator of collaboratorsEntity) {
		if (items === 'authorIds' && collaborator.userId !== currentUserId) {
			collaborators.push(collaborator.userId);
		}

		for (const item of collaborator[items]) {
			if (item !== currentUserId) {
				collaborators.push(item);
			}
		}
	}

	return collaborators;
}

export async function getUsers(currentUserId) {
	// Get the users collaborators
	let usersCollaborators = await getUsersCollaborators(currentUserId);

	// Get the whole list of users
	var q = Data.aggregate([
		// Find all tools with type of person
		{ $match: { type: 'person' } },
		// Perform lookup to users
		{
			$lookup: {
				from: 'users',
				localField: 'id',
				foreignField: 'id',
				as: 'user',
			},
		},
		// select fields to use
		{
			$project: {
				_id: '$user._id',
				id: 1,
				firstname: 1,
				lastname: 1,
				orcid: {
					$cond: [
						{
							$eq: [true, '$showOrcid'],
						},
						'$orcid',
						'$$REMOVE',
					],
				},
				bio: {
					$cond: [
						{
							$eq: [true, '$showBio'],
						},
						'$bio',
						'$$REMOVE',
					],
				},
				email: '$user.email',
			},
		},
	]);

	return new Promise((resolve, reject) => {
		q.exec((err, data) => {
			if (err) {
				return err;
			}

			const users = [];
			data.map(dat => {
				let { _id, id, firstname, lastname, orcid = '', bio = '', email = '' } = dat;
				if (email.length !== 0) email = helper.censorEmail(email[0]);
				users.push({ _id, id, orcid, name: `${firstname} ${lastname}`, bio, email });
			});

			let collaborators = [];
			let nonCollaboratorUsers = [];

			// Pull all non collaborators from users
			nonCollaboratorUsers = users.filter(user => !usersCollaborators.has(user.id));

			// Pull all collaborators from users, add count to sort by
			for (const user of users) {
				usersCollaborators.forEach((count, collaboratorId) => {
					if (user.id === collaboratorId) {
						collaborators.push({ user: user, count: count });
					}
				});
			}

			collaborators.sort((a, b) => b.count - a.count);

			// Remove count after collaborators are sorted
			let collaboratorUsers = collaborators.map(collaborator => {
				return collaborator.user;
			});

			resolve([...collaboratorUsers, ...nonCollaboratorUsers]);
		});
	});
}
