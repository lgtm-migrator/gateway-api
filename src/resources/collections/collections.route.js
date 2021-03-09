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
import { getCollectionObjects } from './collections.repository';

const inputSanitizer = require('../utilities/inputSanitizer');

const urlValidator = require('../utilities/urlValidator');

const hdrukEmail = `enquiry@healthdatagateway.org`;

const router = express.Router();

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

// TODO - collection edited
router.put('/edit', passport.authenticate('jwt'), utils.checkIsInRole(ROLES.Admin, ROLES.Creator), async (req, res) => {
	const collectionCreator = req.body.collectionCreator;
	var { id, name, description, imageLink, authors, relatedObjects, publicflag, keywords } = req.body;
	imageLink = urlValidator.validateURL(imageLink);

	Collections.findOneAndUpdate(
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
});

// TODO - collection added
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

	try {
		if (collections.authors) {
			collections.authors.forEach(async authorId => {
				await createMessage(authorId, collections, collections.activeflag, collectionCreator);
			});
		}
		await createMessage(0, collections, collections.activeflag, collectionCreator);

		// Send email notifications to all admins and authors who have opted in
		await sendEmailNotifications(collections, collections.activeflag, collectionCreator);
	} catch (err) {
		console.error(err.message);
		// return res.status(500).json({ success: false, error: err });
	}

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

// TODO - In app notification
async function createMessage(authorId, collections, activeflag, collectionCreator) {
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
		message.messageDescription = `${collectionCreator.name} added a new collection: ${collections.name}.`;
		saveMessage();
	}

	for (let messageRecipient of messageRecipients) {
		if (activeflag === 'active' && authorId === messageRecipient.id && authorId === collectionCreator.id) {
			message.messageType = 'added collection';
			message.messageDescription = `Your new collection ${collections.name} has been added.`;
			saveMessage();
		} else if (activeflag === 'active' && authorId === messageRecipient.id && authorId !== collectionCreator.id) {
			message.messageType = 'added collection';
			message.messageDescription = `${collectionCreator.name} added you as a collaborator on the new collection ${collections.name}.`;
			saveMessage();
		}
	}

	//UPDATE WHEN ARCHIVE/DELETE IS AVAILABLE FOR COLLECTIONS
	// else if (activeflag === 'archive') {
	//   message.messageType = 'rejected';
	//   message.messageDescription = `Your ${toolType} ${toolName} has been rejected ${collectionLink}`
	// }
}

// TODO - Email notification
async function sendEmailNotifications(collections, activeflag, collectionCreator) {
	console.log(`in sendEmailNotifications`);
	console.log(`collections: ${collections}, activeflag: ${activeflag}, collectionCreator: ${JSON.stringify(collectionCreator, null, 2)}`);
	// let subject;
	// let html;
	// 1. Generate URL for linking collection in email
	const collectionLink = process.env.homeURL + '/collection/' + collections.id;

	// // 2. Query Db for all admins who have opted in to email updates
	// var q = UserModel.aggregate([
	// 	// Find all users who are admins
	// 	// { $match: { } },
	// 	// Reduce response payload size to required fields
	// 	{ $project: { _id: 1, firstname: 1, lastname: 1, email: 1, role: 1 } },
	// ]);

	// q.exec((err, emailRecipients) => {
	// 	console.log(`emailRecipients: ${JSON.stringify(emailRecipients, null, 2)}`);
	// 	// 2. Build email body
	// 	emailRecipients.map(emailRecipient => {
	// 		if (activeflag === 'active' && emailRecipient.role === 'Admin') {
	// 			console.log(`admin email`);
	// 			subject = `New collection ${collections.name} has been added and is now live`;
	// 			html = `New collection ${collections.name} has been added and is now live <br /><br />  ${collectionLink}`;
	// 			console.log(`admin - subject: ${subject}, html: ${html}`);
	// 		}

	// 		collections.authors.map(author => {
	// 			if (activeflag === 'active' && author === emailRecipient.id && author === collectionCreator.id) {
	// 				console.log(`author email - you added`);
	// 				subject = `Your collection ${collections.name} has been added and is now live`;
	// 				html = `Your collection ${collections.name} has been added and is now live <br /><br />  ${collectionLink}`;
	// 				console.log(`author - subject: ${subject}, html: ${html}`);
	// 			} else if (activeflag === 'active' && author === emailRecipient.id && author !== collectionCreator.id) {
	// 				console.log(`author email - other person added`);
	// 				subject = `You have been added as a collaborator on collection ${collections.name}`;
	// 				html = `${collectionCreator.name} has added you as a collaborator to the collection ${collections.name} which is now live <br /><br />  ${collectionLink}`;
	// 				console.log(`author - subject: ${subject}, html: ${html}`);
	// 			}
	// 		});
	// 	});
	// });

	// if (activeflag === 'active') {
	// 	subject = `Your collection ${collections.name} has been approved and is now live`;
	// 	html = `Your collection ${collections.name} has been approved and is now live <br /><br />  ${collectionLink}`;
	// }

	// console.log(`subject: ${subject}`);
	// console.log(`html: ${html}`);
	//UPDATE WHEN ARCHIVE/DELETE IS AVAILABLE FOR COLLECTIONS
	// else if (activeflag === 'archive') {
	//   subject = `Your collection ${collections.name} has been rejected`
	//   html = `Your collection ${collections.name} has been rejected <br /><br />  ${collectionLink}`
	// }

	// 3. Query Db for all admins or authors of the collection who have opted in to email updates
	var q = UserModel.aggregate([
		// Find all users who are admins or authors of this collection
		// TODO - comment back in with admin role after doing the checks for how authors works
		// { $match: { $or: [{ role: 'Admin' }, { id: { $in: collections.authors } }] } },
		{ $match: { $or: [{ id: { $in: collections.authors } }] } },
		// Perform lookup to check opt in/out flag in tools schema
		{ $lookup: { from: 'tools', localField: 'id', foreignField: 'id', as: 'tool' } },
		// TODO - don't think you can opt out of these...
		// Filter out any user who has opted out of email notifications
		// { $match: { 'tool.emailNotifications': true } },
		// Reduce response payload size to required fields
		{
			$project: {
				_id: 1,
				firstname: 1,
				lastname: 1,
				email: 1,
				role: 1,
				id: 1,
				// , 'tool.emailNotifications': 1
			},
		},
	]);

	// 4. Use the returned array of email recipients to generate and send emails with SendGrid
	q.exec((err, emailRecipients) => {
		if (err) {
			return new Error({ success: false, error: err });
		} else {
			let subject;
			let html;

			emailRecipients.map(emailRecipient => {
				console.log(`emailRecipient: ${JSON.stringify(emailRecipient, null, 2)}`);
				// TODO - comment admin stuff back in
				// if (activeflag === 'active' && emailRecipient.role === 'Admin') {
				// 	console.log(`admin email`);
				// 	subject = `New collection ${collections.name} has been added and is now live`;
				// 	html = `New collection ${collections.name} has been added and is now live <br /><br />  ${collectionLink}`;
				// 	// console.log(`admin - subject: ${subject}, html: ${html}`);
				// }

				collections.authors.map(author => {
					console.log(`author: ${author} - ${typeof author}`);
					console.log(`emailRecipient.id: ${emailRecipient.id} - ${typeof emailRecipient.id}`);
					console.log(`collectionCreator.id: ${collectionCreator.id} - ${typeof collectionCreator.id}`);

					if (activeflag === 'active' && author === emailRecipient.id && author === collectionCreator.id) {
						console.log(`author email - you added`);
						subject = `Your collection ${collections.name} has been added and is now live`;
						// html = `Your collection ${collections.name} has been added and is now live <br /><br />  ${collectionLink}`;

						// TODO - test out look of email from DAR...
						html = `<div style="border: 1px solid #d0d3d4; border-radius: 15px; width: 700px; margin: 0 auto;">
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

							Your ${collections.publicflag === true ? 'public' : 'private'} collection ${collections.name} has been published and is now live

							</th>
						  </tr>
						  <tr>
							<th style="border: 0; font-size: 14px; font-weight: normal; color: #333333; text-align: left;">
							 
							 Your collection ${collections.name} has been added and is now live
							 ${
									collections.publicflag === true
										? 'Your public collection has been published to the Gateway. The collection is searchable on the Gateway and can be viewed by all users. '
										: 'Your private collection has been published to the Gateway. Only those who you share the collection link with will be able to view the collection.'
								}
							 

							</th>
						  </tr>
						</thead>
						<tbody style="overflow-y: auto; overflow-x: hidden;">
						<tr style="width: 100%; text-align: left;">
						  <td bgcolor="#fff" style="padding: 0; border: 0;">
							<table border="0" border-collapse="collapse" cellpadding="0" cellspacing="0" width="100%">
							<tr>
								<td style="font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border-bottom: 1px solid #d0d3d4;">Project</td>
								<td style=" font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border-bottom: 1px solid #d0d3d4;">${collectionLink}</td>
							  </tr>
							  <tr>
							</tr>  
							<tr>
								<td style="font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border-bottom: 1px solid #d0d3d4;">Dataset(s)</td>
								<td style=" font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border-bottom: 1px solid #d0d3d4;">${collectionLink}</td>
							  </tr>
							  <tr>
								<td style="font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border-bottom: 1px solid #d0d3d4;">Date of submission</td>
								<td style=" font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border-bottom: 1px solid #d0d3d4;">${collectionLink}</td>
							  </tr>
							  <tr>
								<td style="font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border-bottom: 1px solid #d0d3d4;">Applicant</td>
								<td style=" font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border-bottom: 1px solid #d0d3d4;">${collectionLink}</td>
							  </tr>
							</table>
						  </td>
						</tr>
					   `;

						// console.log(`author - subject: ${subject}, html: ${html}`);
					} else if (activeflag === 'active' && author === emailRecipient.id && author !== collectionCreator.id) {
						console.log(`author email - other person added`);
						subject = `You have been added as a collaborator on collection ${collections.name}`;
						html = `${collectionCreator.name} has added you as a collaborator to the collection ${collections.name} which is now live <br /><br />  ${collectionLink}`;
						// console.log(`author - subject: ${subject}, html: ${html}`);
					}
				});
			});

			console.log(`send email`);
			// TODO - comment back in to send email
			emailGenerator.sendEmail(emailRecipients, `${hdrukEmail}`, subject, html, false);
		}
		// emailGenerator.sendEmail(emailRecipients, `${hdrukEmail}`, subject, html);
		// emailGenerator.sendEmail(emailRecipients, `${hdrukEmail}`, subject, html, true);
	});
}

// // 1. Generate URL for linking tool from email
// const toolLink = process.env.homeURL + '/' + data.type + '/' + data.id;

// // 2. Query Db for all admins who have opted in to email updates
// var q = UserModel.aggregate([
// 	// Find all users who are admins
// 	{ $match: { role: 'Admin' } },
// 	// Reduce response payload size to required fields
// 	{ $project: { _id: 1, firstname: 1, lastname: 1, email: 1, role: 1 } },
// ]);

// // 3. Use the returned array of email recipients to generate and send emails with SendGrid
// q.exec((err, emailRecipients) => {
// 	if (err) {
// 		return new Error({ success: false, error: err });
// 	}
// 	// TODO - how emails are sent for tools...
// 	emailGenerator.sendEmail(
// 		emailRecipients,
// 		`${hdrukEmail}`,
// 		`A new ${data.type} has been added and is ready for review`,
// 		`Approval needed: new ${data.type} ${data.name} <br /><br />  ${toolLink}`,
// 		false
// 	);
// });

// const _sendEmail = async (to, from, subject, html, allowUnsubscribe = true, attachments = []) => {

// q.exec((err, emailRecipients) => {
// 	if (err) {
// 		return new Error({ success: false, error: err });
// 	}
// 	// TODO - how emails are sent for tools...
// 	emailGenerator.sendEmail(
// 		emailRecipients,
// 		`${hdrukEmail}`,
// 		`A new ${data.type} has been added and is ready for review`,
// 		`Approval needed: new ${data.type} ${data.name} <br /><br />  ${toolLink}`,
// 		false
// 	);
// });
