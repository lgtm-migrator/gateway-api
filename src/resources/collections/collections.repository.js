import { Data } from '../tool/data.model';
import { Course } from '../course/course.model';
import { Collections } from './collections.model';
import _ from 'lodash';
import helper from '../utilities/helper.util';

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
		}
		resolve(data[0]);
	});
}

const getCollectionsAdmin = async (req, res) => {
	return new Promise(async (resolve, reject) => {
		let startIndex = 0;
		let limit = 40;
		let searchString = '';
		let status = 'all';

		if (req.query.offset) {
			startIndex = req.query.offset;
		}
		if (req.query.limit) {
			limit = req.query.limit;
		}
		if (req.query.q) {
			searchString = req.query.q || '';
		}
		if (req.query.status) {
			status = req.query.status;
		}

		let searchQuery;
		if (status === 'all') {
			searchQuery = {};
		} else {
			searchQuery = { $and: [{ activeflag: status }] };
		}

		let searchAll = false;

		if (searchString.length > 0) {
			searchQuery['$and'].push({ $text: { $search: searchString } });
		} else {
			searchAll = true;
		}

		await Promise.all([getObjectResult(searchAll, searchQuery, startIndex, limit), getCountsByStatus()]).then(values => {
			resolve(values);
		});
	});
};

const getCollections = async (req, res) => {
	return new Promise(async (resolve, reject) => {
		let startIndex = 0;
		let limit = 40;
		let idString = req.user.id;
		let status = 'all';

		if (req.query.offset) {
			startIndex = req.query.offset;
		}
		if (req.query.limit) {
			limit = req.query.limit;
		}
		if (req.query.id) {
			idString = req.query.id;
		}
		if (req.query.status) {
			status = req.query.status;
		}

		let searchQuery;
		if (status === 'all') {
			searchQuery = [{ authors: parseInt(idString) }];
		} else {
			searchQuery = [{ authors: parseInt(idString) }, { activeflag: status }];
		}

		let query = Collections.aggregate([
			{ $match: { $and: searchQuery } },
			{ $lookup: { from: 'tools', localField: 'authors', foreignField: 'id', as: 'persons' } },
			{ $sort: { updatedAt: -1, _id: 1 } },
		])
			.skip(parseInt(startIndex))
			.limit(parseInt(limit));

		await Promise.all([getUserCollections(query), getCountsByStatus(idString)]).then(values => {
			resolve(values);
		});

		function getUserCollections(query) {
			return new Promise((resolve, reject) => {
				query.exec((err, data) => {
					data &&
						data.map(dat => {
							dat.persons = helper.hidePrivateProfileDetails(dat.persons);
						});
					if (typeof data === 'undefined') resolve([]);
					else resolve(data);
				});
			});
		}
	});
};

function getObjectResult(searchAll, searchQuery, startIndex, limit) {
	let newSearchQuery = JSON.parse(JSON.stringify(searchQuery));
	let q = '';

	if (searchAll) {
		q = Collections.aggregate([
			{ $match: newSearchQuery },
			{ $lookup: { from: 'tools', localField: 'authors', foreignField: 'id', as: 'persons' } },
		])
			.sort({ updatedAt: -1, _id: 1 })
			.skip(parseInt(startIndex))
			.limit(parseInt(limit));
	} else {
		q = Collections.aggregate([
			{ $match: newSearchQuery },
			{ $lookup: { from: 'tools', localField: 'authors', foreignField: 'id', as: 'persons' } },
		])
			.sort({ score: { $meta: 'textScore' } })
			.skip(parseInt(startIndex))
			.limit(parseInt(limit));
	}
	return new Promise((resolve, reject) => {
		q.exec((err, data) => {
			if (typeof data === 'undefined') {
				resolve([]);
			} else {
				data.map(dat => {
					dat.persons = helper.hidePrivateProfileDetails(dat.persons);
				});
				resolve(data);
			}
		});
	});
}

function getCountsByStatus(idString) {
	let q;

	if (_.isUndefined(idString)) {
		q = Collections.find({}, { id: 1, name: 1, activeflag: 1 });
	} else {
		q = Collections.find({ authors: parseInt(idString) }, { id: 1, name: 1, activeflag: 1 });
	}

	return new Promise((resolve, reject) => {
		q.exec((err, data) => {
			const activeCount = data.filter(dat => dat.activeflag === 'active').length;
			const archiveCount = data.filter(dat => dat.activeflag === 'archive').length;

			let countSummary = { activeCount: activeCount, archiveCount: archiveCount };

			resolve(countSummary);
		});
	});
}

export { getCollectionObjects, getCollectionsAdmin, getCollections };
