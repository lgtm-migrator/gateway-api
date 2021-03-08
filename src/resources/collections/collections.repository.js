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
		if (objectType !== 'dataset' && objectType !== 'course') {
			data = await Data.find(
				{ id: parseInt(id) },
				{
					id: 1,
					type: 1,
					activeflag: 1,
					tags: 1,
					description: 1,
					name: 1,
					persons: 1,
					categories: 1,
					programmingLanguage: 1,
					firstname: 1,
					lastname: 1,
					bio: 1,
					authors: 1,
				}
			).populate([{ path: 'persons', options: { select: { id: 1, firstname: 1, lastname: 1 } } }]);
		} else if (!isNaN(id) && objectType === 'course') {
			data = await Course.find(
				{ id: parseInt(id) },
				{ id: 1, type: 1, activeflag: 1, title: 1, provider: 1, courseOptions: 1, award: 1, domains: 1, tags: 1, description: 1 }
			);
		} else {
			// 1. Search for a dataset based on pid
			data = await Data.find(
				{ pid: id, activeflag: 'active' },
				{ id: 1, datasetid: 1, pid: 1, type: 1, activeflag: 1, name: 1, datasetv2: 1, datasetfields: 1, tags: 1, description: 1 }
			);
			// 2. If dataset not found search for a dataset based on datasetID
			if (!data || data.length <= 0) {
				data = await Data.find({ datasetid: objectId }, { datasetid: 1, pid: 1 });
				// 3. Use retrieved dataset's pid to search by pid again
				data = await Data.find(
					{ pid: data[0].pid, activeflag: 'active' },
					{ id: 1, datasetid: 1, pid: 1, type: 1, activeflag: 1, name: 1, datasetv2: 1, datasetfields: 1, tags: 1, description: 1 }
				);
			}
			// 4. If dataset still not found search for deleted dataset by pid
			if (!data || data.length <= 0) {
				data = await Data.find(
					{ pid: id, activeflag: 'archive' },
					{ id: 1, datasetid: 1, pid: 1, type: 1, activeflag: 1, name: 1, datasetv2: 1, datasetfields: 1, tags: 1, description: 1 }
				).lean();
			}
		}
		resolve(data[0]);
	});
}

export { getCollectionObjects };
