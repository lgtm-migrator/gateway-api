import { UserModel } from './user.model'

export async function createUser({
    firstname,
    lastname,
    email,
    providerId,
    provider,
    role
}) {
    return new Promise(async (resolve, reject) => {
        var id = parseInt(Math.random().toString().replace('0.', ''));

        return resolve(
            await UserModel.create({
                id,
                providerId,
                provider,
                firstname,
                lastname,
                email,
                role
            })
        )
    })
}

export async function updateUser({
    id,
    firstname,
    lastname,
    email
}) {
    return new Promise(async (resolve, reject) => {
        return resolve(
            await UserModel.findOneAndUpdate({ id: id },
            {
                firstname: firstname,
                lastname: lastname,
                email: email
            })
        )
    })
}

export async function updateRedirectURL({
    id,
    redirectURL
}) {
    return new Promise(async (resolve, reject) => {
        return resolve(
            await UserModel.findOneAndUpdate({ id: id },
            {
                redirectURL: redirectURL,
            })
        )
    })
}