import { Data } from './data.model';

export async function getObjectById(id) {
    return await Data.findOne({ id }).exec()
}