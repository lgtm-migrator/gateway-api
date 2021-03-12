import express from 'express';
import { ROLES } from '../user/user.roles';
import passport from 'passport';
import { utils } from '../auth';
// import { UserModel } from '../user/user.model'
import { Collections } from '../collections/collections.model';
import { Data } from '../tool/data.model';
import { MessagesModel } from '../message/message.model';
import { UserModel } from '../user/user.model';
import emailGenerator from '../utilities/emailGenerator.util';
import helper from '../utilities/helper.util';
import _ from 'lodash';
import escape from 'escape-html';
import { getCollectionObjects, getCollectionsAdmin, getCollections } from './collections.repository';

const inputSanitizer = require('../utilities/inputSanitizer');

const urlValidator = require('../utilities/urlValidator');

const hdrukEmail = `enquiry@healthdatagateway.org`;

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
	const collectionCreator = req.body.collectionCreator;
	let { id, name, description, imageLink, authors, relatedObjects, publicflag, keywords, previousPublicFlag } = req.body;
	imageLink = urlValidator.validateURL(imageLink);

	await Collections.findOneAndUpdate(
		{ id: id },
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

	await Collections.find({ id: id }, { publicflag: 1, id: 1, activeflag: 1, authors: 1, name: 1 }).then(async res => {
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

async function sendEmailNotifications(collections, activeflag, collectionCreator, isEdit) {
	// Generate URL for linking collection in email
	const collectionLink = process.env.homeURL + '/collection/' + collections.id;

	// Query Db for all admins or authors of the collection
	var q = UserModel.aggregate([
		{ $match: { $or: [{ role: 'Admin' }, { id: { $in: collections.authors } }] } },
		{ $lookup: { from: 'tools', localField: 'id', foreignField: 'id', as: 'tool' } },
		{
			$project: {
				_id: 1,
				firstname: 1,
				lastname: 1,
				email: 1,
				role: 1,
				id: 1,
			},
		},
	]);

	// Use the returned array of email recipients to generate and send emails with SendGrid
	q.exec((err, emailRecipients) => {
		if (err) {
			return new Error({ success: false, error: err });
		} else {
			let subject;
			let html;

			emailRecipients.map(emailRecipient => {
				if (collections.authors.includes(emailRecipient.id)) {
					collections.authors.map(author => {
						if (activeflag === 'active' && author === emailRecipient.id) {
							subject = generateCollectionEmailSubject(
								'Creator',
								collections.publicflag,
								collections.name,
								author === collectionCreator.id ? true : false,
								isEdit
							);
							html = generateCollectionEmailContent(
								'Creator',
								collections.publicflag,
								collections.name,
								collectionLink,
								author === collectionCreator.id ? true : false,
								isEdit
							);
						}
					});
				} else if (activeflag === 'active' && emailRecipient.role === 'Admin') {
					subject = generateCollectionEmailSubject('Admin', collections.publicflag, collections.name, false, isEdit);
					html = generateCollectionEmailContent('Admin', collections.publicflag, collections.name, collectionLink, false, isEdit);
				}

				emailGenerator.sendEmail([emailRecipient], `${hdrukEmail}`, subject, html, false);
			});
		}
	});
}

function generateCollectionEmailSubject(role, publicflag, collectionName, isCreator, isEdit) {
	let emailSubject;

	if (role !== 'Admin' && isCreator !== true) {
		if (isEdit === true) {
			emailSubject = `The ${
				publicflag === true ? 'public' : 'private'
			} collection ${collectionName} that you are a collaborator on has been edited`;
		} else {
			emailSubject = `You have been added as a collaborator on the ${
				publicflag === true ? 'public' : 'private'
			} collection ${collectionName}`;
		}
	} else {
		emailSubject = `${role === 'Admin' ? 'A' : 'Your'} ${
			publicflag === true ? 'public' : 'private'
		} collection ${collectionName} has been ${isEdit === true ? 'edited' : 'published'} and is now live`;
	}

	return emailSubject;
}

function generateCollectionEmailContent(role, publicflag, collectionName, collectionLink, isCreator, isEdit) {
	return `<div>
				<div style="border: 1px solid #d0d3d4; border-radius: 15px; width: 700px; margin: 0 auto;">
					<table
					align="center"
					border="0"
					cellpadding="0"
					cellspacing="40"
					width="700"
					word-break="break-all"
					style="font-family: Arial, sans-serif">
						<thead>
							<tr>
								<th style="border: 0; color: #29235c; font-size: 22px; text-align: left;">
									${generateCollectionEmailSubject(role, publicflag, collectionName, isCreator, isEdit)}
								</th>
								</tr>
								<tr>
								<th style="border: 0; font-size: 14px; font-weight: normal; color: #333333; text-align: left;">
									${
										publicflag === true
											? `${role === 'Admin' ? 'A' : 'Your'} public collection has been ${
													isEdit === true ? 'edited on' : 'published to'
											  } the Gateway. The collection is searchable on the Gateway and can be viewed by all users.`
											: `${role === 'Admin' ? 'A' : 'Your'} private collection has been ${
													isEdit === true ? 'edited on' : 'published to'
											  } the Gateway. Only those who you share the collection link with will be able to view the collection.`
									}
								</th>
							</tr>
						</thead>
						<tbody style="overflow-y: auto; overflow-x: hidden;">
							<tr style="width: 100%; text-align: left;">
								<td style=" font-size: 14px; color: #3c3c3b; padding: 5px 5px; width: 50%; text-align: left; vertical-align: top;">
									<a href=${collectionLink}>View Collection</a>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>`;
}
