import { Data } from '../schema'

async function createPerson({
    id: String,
    firstname: String,
    surname: String
}) {
    return new Promise(async (resolve, reject) => {
        return resolve(
            await Data.create({
                id,
                firstname,
                surame
            })
        )
    })
}

export { createPerson }