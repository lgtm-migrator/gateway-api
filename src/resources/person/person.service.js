import { Data } from '../tool/data.model'

export async function createPerson({
    id,
    firstname,
    lastname,
    bio,
    link,
    orcid,
    emailNotifications,
    terms,
    sector,
    organisation,
    showMyOrganisation,
    tags,
    showSector,
    showOrganisation,
    showBio,
    showLink,
    showOrcid,
    showDomain 
}){
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
                activeflag,
                emailNotifications,
                terms,
                sector,
                organisation,
                showMyOrganisation,
                tags,
                showSector,
                showOrganisation,
                showBio,
                showLink,
                showOrcid,
                showDomain
            })
        )
    })
};