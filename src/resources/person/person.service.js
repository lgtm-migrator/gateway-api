import { Data } from '../tool/data.model'

export async function createPerson({
    id: String,
    firstname: String,
    lastname: String
}) {
    return new Promise(async (resolve, reject) => {
        return resolve(
            await Data.create({
                id,
                firstname,
                lastname
            })
        )
    })
};