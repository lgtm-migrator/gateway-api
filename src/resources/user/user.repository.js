import { UserModel } from './user.model';

export async function getUserById(id) {
	const user = await UserModel.findById(id).populate({
		path: 'teams',
		select: 'publisher type members -_id',
		populate: {
			path: 'publisher',
			select: 'name',
		},
	});
	return user;
}

export async function getUserByEmail(email) {
	return await UserModel.findOne({ email }).exec();
}

export async function getUserByProviderId(providerId) {
	return await UserModel.findOne({ providerId }).exec();
}

export async function getUserByUserId(id) {
	return await UserModel.findOne({ id }).exec();
}
