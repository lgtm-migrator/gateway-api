import { Data } from '../../../database/schema'
import { UserModel } from './user.model'

export async function createUser({
    firstname,
    lastname,
    email,
    password,
    providerId,
    provider,
    role
}) {
    return new Promise(async (resolve, reject) => {
        const user = await UserModel.findOne({ email })

        if (user) {
            return reject('Email is already in use')
        }

        var id = parseInt(Math.random().toString().replace('0.', ''));
        var type = "person";
        var activeflag = "active";
        return resolve(
            await UserModel.create({
                id,
                providerId,
                provider,
                firstname,
                lastname,
                email,
                password,
                role
            }),
            await Data.create({
                id,
                type,
                firstname,
                lastname,
                activeflag
            })
        )
    })
}