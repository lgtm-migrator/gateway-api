import express from 'express';
import _ from 'lodash';
import { Data } from '../tool/data.model';
import { Course } from '../course/course.model';
import { Cohort } from '../cohort/cohort.model';

const router = express.Router();

router.get('/linkeddatasets/:datasetName', async (req, res) => {
	let { datasetName } = req.params;

	let data = {
		datasetFound: false,
		pid: null,
		name: '',
		publisher: '',
	};

	try {
		if (_.isNil(datasetName)) {
			return res.json({ success: false, error: 'No dataset name supplied' });
		}
		await Data.findOne({ name: datasetName }).then(async dataset => {
			if (dataset) {
				data.datasetFound = true;
				data.pid = dataset.pid;
				data.name = dataset.name;
				data.publisher = dataset.datasetfields.publisher;
			}
			return res.json({ success: true, ...data });
		});
	} catch (err) {
		return res.json({ success: false, error: err });
	}
});
/**
 * {get} /relatedobjects/:id
 *
 * Return the details on the relatedobject based on the ID.
 */
router.get('/:id', async (req, res) => {
	let id = req.params.id;
	if (!isNaN(id)) {
		let q = Data.aggregate([
			{ $match: { $and: [{ id: parseInt(id) }] } },
			{ $lookup: { from: 'tools', localField: 'authors', foreignField: 'id', as: 'persons' } },
		]);
		q.exec((err, data) => {
			if (err) return res.json({ success: false, error: err });
			return res.json({ success: true, data: data });
		});
	} else {
		try {
			// Get related dataset
			let dataVersion = await Data.findOne({ datasetid: id });

			if (!_.isNil(dataVersion)) {
				id = dataVersion.pid;
			}

			let data = await Data.findOne({ pid: id, activeflag: 'active' });

			if (_.isNil(data)) {
				data = await Data.findOne({ pid: id, activeflag: 'archive' }).sort({ createdAt: -1 });
				if (_.isNil(data)) {
					data = dataVersion;
				}
			}

			return res.json({ success: true, data: [data] });
		} catch (err) {
			return res.json({ success: false, error: err });
		}
	}
});

router.get('/course/:id', async (req, res) => {
	var id = req.params.id;

	var q = Course.aggregate([
		{ $match: { $and: [{ id: parseInt(id) }] } },
		// { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
	]);
	q.exec((err, data) => {
		if (err) return res.json({ success: false, error: err });
		return res.json({ success: true, data: data });
	});
});

router.get('/cohort/:id', async (req, res) => {
	let id = req.params.id;

	let q = Cohort.aggregate([
		{ $match: { $and: [{ id: parseInt(id) }] } },
		{ $lookup: { from: 'tools', localField: 'uploaders', foreignField: 'id', as: 'persons' } },
	]);
	q.exec((err, data) => {
		if (err) return res.json({ success: false, error: err });
		return res.json({ success: true, data: data });
	});
});

module.exports = router;
