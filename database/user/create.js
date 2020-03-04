import { UserModel, Data } from '../schema'


async function createUser({
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

        var id = Math.random().toString().replace('0.', '');
        var type = "person";
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
                lastname
            })
        )
    })
}

export { createUser }