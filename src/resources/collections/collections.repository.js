import { Data } from '../tool/data.model';
import { Course } from '../course/course.model';
import { Collections } from './collections.model';
import _ from 'lodash';

const getCollectionObjects = async (req, res) => {
	let relatedObjects = [];
	await Collections.find(
		{ id: parseInt(req.params.collectionID) },
		{ 'relatedObjects._id': 1, 'relatedObjects.objectId': 1, 'relatedObjects.objectType': 1, 'relatedObjects.pid': 1 }
	).then(async res => {
		await new Promise(async (resolve, reject) => {
			if (_.isEmpty(res)) {
				reject(`Collection not found for Id: ${req.params.collectionID}.`);
			} else {
				for (let object of res[0].relatedObjects) {
					let relatedObject = await getCollectionObject(object.objectId, object.objectType, object.pid);
					if (!_.isUndefined(relatedObject)) {
						relatedObjects.push(relatedObject);
					} else {
						await Collections.findOneAndUpdate(
							{ id: parseInt(req.params.collectionID) },
							{ $pull: { relatedObjects: { _id: object._id } } }
						);
					}
				}
				resolve(relatedObjects);
			}
		});
	});
	return relatedObjects;
};

function getCollectionObject(objectId, objectType, pid) {
	let id = pid && pid.length > 0 ? pid : objectId;

	return new Promise(async (resolve, reject) => {
		let data;
		if (!isNaN(id) && objectType !== 'course') {
			data = await Data.find({ id: parseInt(id) });
		} else if (!isNaN(id) && objectType === 'course') {
			data = await Course.find({ id: parseInt(id) });
		} else {
			// 1. Search for a dataset based on pid
			data = await Data.find({ pid: id, activeflag: 'active' });
			// 2. If dataset not found search for a dataset based on datasetID
			if (!data || data.length <= 0) {
				data = await Data.find({ datasetid: id }, { datasetid: 1, pid: 1 });
				// 3. Use retrieved dataset's pid to search by pid again
				data = await Data.find({ pid: data[0].pid, activeflag: 'active' });
			}
		}
		resolve(data[0]);
	});
}

export { getCollectionObjects };
