import { Data } from '../tool/data.model'

export async function createPerson({
    id,
    firstname,
    lastname,
    bio,
    link,
    orcid
}) {
    var type = "person";
    var activeflag = "active";
    return new Promise(async (resolve, reject) => {
        return resolve(
            await Data.create({
                id,
                type,
                firstname,
                lastname,
                bio,
                link,
                orcid,
                activeflag
            })
        )
    })
};