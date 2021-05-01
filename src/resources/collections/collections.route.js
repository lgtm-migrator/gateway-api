import express from 'express';
import { ROLES } from '../user/user.roles';
import passport from 'passport';
import { utils } from '../auth';
import { Collections } from '../collections/collections.model';
import { Data } from '../tool/data.model';
import { MessagesModel } from '../message/message.model';
import { UserModel } from '../user/user.model';
import helper from '../utilities/helper.util';
import _ from 'lodash';
import escape from 'escape-html';
import {
	getCollectionObjects,
	getCollectionsAdmin,
	getCollections,
	sendEmailNotifications,
	generateCollectionEmailSubject,
} from './collections.repository';

const inputSanitizer = require('../utilities/inputSanitizer');

const urlValidator = require('../utilities/urlValidator');

const router = express.Router();

// @router   GET /api/v1/collections/getList
// @desc     Returns List of Collections
// @access   Private
router.get('/getList', passport.authenticate('jwt'), utils.checkIsInRole(ROLES.Admin, ROLES.Creator), async (req, res) => {
	let role = req.user.role;

	if (role === ROLES.Admin) {
		await getCollectionsAdmin(req)
			.then(data => {
				return res.json({ success: true, data });
			})
			.catch(err => {
				return res.json({ success: false, err });
			});
	} else if (role === ROLES.Creator) {
		await getCollections(req)
			.then(data => {
				return res.json({ success: true, data });
			})
			.catch(err => {
				return res.json({ success: false, err });
			});
	}
});

router.get('/:collectionID', async (req, res) => {
	var q = Collections.aggregate([
		{ $match: { $and: [{ id: parseInt(req.params.collectionID) }] } },

		{ $lookup: { from: 'tools', localField: 'authors', foreignField: 'id', as: 'persons' } },
	]);
	q.exec((err, data) => {
		if (err) return res.json({ success: false, error: err });

		if (_.isEmpty(data)) return res.status(404).send(`Collection not found for Id: ${escape(req.params.collectionID)}`);

		data[0].persons = helper.hidePrivateProfileDetails(data[0].persons);
		return res.json({ success: true, data: data });
	});
});

router.get('/relatedobjects/:collectionID', async (req, res) => {
	await getCollectionObjects(req)
		.then(data => {
			return res.json({ success: true, data });
		})
		.catch(err => {
			return res.json({ success: false, err });
		});
});

router.get('/entityid/:entityID', async (req, res) => {
	let entityID = req.params.entityID;
	let dataVersions = await Data.find({ pid: entityID }, { _id: 0, datasetid: 1 });
	let dataVersionsArray = dataVersions.map(a => a.datasetid);
	dataVersionsArray.push(entityID);

	var q = Collections.aggregate([
		{
			$match: {
				$and: [
					{
						relatedObjects: {
							$elemMatch: {
								$or: [
									{
										objectId: { $in: dataVersionsArray },
									},
									{
										pid: entityID,
									},
								],
							},
						},
					},
					{ publicflag: true },
					{ activeflag: 'active' },
				],
			},
		},
		{ $lookup: { from: 'tools', localField: 'authors', foreignField: 'id', as: 'persons' } },
		{
			$project: { _id: 1, id: 1, name: 1, description: 1, imageLink: 1, relatedObjects: 1, 'persons.firstname': 1, 'persons.lastname': 1 },
		},
	]);

	q.exec((err, data) => {
		if (err) return res.json({ success: false, error: err });
		return res.json({ success: true, data: data });
	});
});

router.put('/edit', passport.authenticate('jwt'), utils.checkIsInRole(ROLES.Admin, ROLES.Creator), async (req, res) => {
	let { id, name, description, imageLink, authors, relatedObjects, publicflag, keywords, previousPublicFlag, collectionCreator } = req.body;
	imageLink = urlValidator.validateURL(imageLink);

	let collectionId = parseInt(id);

	await Collections.findOneAndUpdate(
		{ id: collectionId },
		{
			name: inputSanitizer.removeNonBreakingSpaces(name),
			description: inputSanitizer.removeNonBreakingSpaces(description),
			imageLink: imageLink,
			authors: authors,
			relatedObjects: relatedObjects,
			publicflag: publicflag,
			keywords: keywords,
		},
		err => {
			if (err) {
				return res.json({ success: false, error: err });
			}
		}
	).then(() => {
		return res.json({ success: true });
	});

	await Collections.find({ id: collectionId }, { publicflag: 1, id: 1, activeflag: 1, authors: 1, name: 1 }).then(async res => {
		if (previousPublicFlag === false && publicflag === true) {
			await sendEmailNotifications(res[0], res[0].activeflag, collectionCreator, true);

			if (res[0].authors) {
				res[0].authors.forEach(async authorId => {
					await createMessage(authorId, res[0], res[0].activeflag, collectionCreator, true);
				});
			}

			await createMessage(0, res[0], res[0].activeflag, collectionCreator, true);
		}
	});
});

router.post('/add', passport.authenticate('jwt'), utils.checkIsInRole(ROLES.Admin, ROLES.Creator), async (req, res) => {
	let collections = new Collections();

	const collectionCreator = req.body.collectionCreator;

	const { name, description, imageLink, authors, relatedObjects, publicflag, keywords } = req.body;

	collections.id = parseInt(Math.random().toString().replace('0.', ''));
	collections.name = inputSanitizer.removeNonBreakingSpaces(name);
	collections.description = inputSanitizer.removeNonBreakingSpaces(description);
	collections.imageLink = imageLink;
	collections.authors = authors;
	collections.relatedObjects = relatedObjects;
	collections.activeflag = 'active';
	collections.publicflag = publicflag;
	collections.keywords = keywords;

	if (collections.authors) {
		collections.authors.forEach(async authorId => {
			await createMessage(authorId, collections, collections.activeflag, collectionCreator);
		});
	}

	await createMessage(0, collections, collections.activeflag, collectionCreator);

	await sendEmailNotifications(collections, collections.activeflag, collectionCreator);

	collections.save(err => {
		if (err) {
			return res.json({ success: false, error: err });
		} else {
			return res.json({ success: true, id: collections.id });
		}
	});
});

router.put('/status', passport.authenticate('jwt'), utils.checkIsInRole(ROLES.Admin, ROLES.Creator), async (req, res) => {
	var { id, activeflag } = req.body;
	var isAuthorAdmin = false;

	var q = Collections.aggregate([{ $match: { $and: [{ id: parseInt(req.body.id) }, { authors: req.user.id }] } }]);
	q.exec((err, data) => {
		if (data.length === 1) {
			isAuthorAdmin = true;
		}

		if (req.user.role === 'Admin') {
			isAuthorAdmin = true;
		}

		if (isAuthorAdmin) {
			Collections.findOneAndUpdate(
				{ id: id },
				{
					activeflag: activeflag,
				},
				err => {
					if (err) {
						return res.json({ success: false, error: err });
					}
				}
			).then(() => {
				return res.json({ success: true });
			});
		} else {
			return res.json({ success: false, error: 'Not authorised' });
		}
	});
});

router.delete('/delete/:id', passport.authenticate('jwt'), utils.checkIsInRole(ROLES.Admin, ROLES.Creator), async (req, res) => {
	var isAuthorAdmin = false;

	var q = Collections.aggregate([{ $match: { $and: [{ id: parseInt(req.params.id) }, { authors: req.user.id }] } }]);
	q.exec((err, data) => {
		if (data.length === 1) {
			isAuthorAdmin = true;
		}

		if (req.user.role === 'Admin') {
			isAuthorAdmin = true;
		}

		if (isAuthorAdmin) {
			Collections.findOneAndRemove({ id: req.params.id }, err => {
				if (err) return res.send(err);
				return res.json({ success: true });
			});
		} else {
			return res.json({ success: false, error: 'Not authorised' });
		}
	});
});

module.exports = router;

async function createMessage(authorId, collections, activeflag, collectionCreator, isEdit) {
	let message = new MessagesModel();

	const collectionLink = process.env.homeURL + '/collection/' + collections.id;
	const messageRecipients = await UserModel.find({ $or: [{ role: 'Admin' }, { id: { $in: collections.authors } }] });
	async function saveMessage() {
		message.messageID = parseInt(Math.random().toString().replace('0.', ''));
		message.messageTo = authorId;
		message.messageObjectID = collections.id;
		message.messageSent = Date.now();
		message.isRead = false;
		await message.save();
	}

	if (authorId === 0) {
		message.messageType = 'added collection';
		message.messageDescription = generateCollectionEmailSubject('Admin', collections.publicflag, collections.name, false, isEdit);
		saveMessage();
	}

	for (let messageRecipient of messageRecipients) {
		if (activeflag === 'active' && authorId === messageRecipient.id) {
			message.messageType = 'added collection';
			message.messageDescription = generateCollectionEmailSubject(
				'Creator',
				collections.publicflag,
				collections.name,
				authorId === collectionCreator.id ? true : false,
				isEdit
			);
			saveMessage();
		}
	}
}
