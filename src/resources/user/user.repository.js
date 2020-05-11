import { UserModel } from './user.model';

export async function getUserById(id) {
    return await UserModel.findById(id).exec()
}

export async function getUserByEmail(email) {
    return await UserModel.findOne({ email }).exec()
}

export async function getUserByProviderId(providerId) {
    return await UserModel.findOne({ providerId }).exec()
}

export async function getUserByUserId(id) {
    return await UserModel.findOne({ id }).exec()
}