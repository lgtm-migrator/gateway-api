import { Data } from '../tool/data.model';
import { Course } from '../course/course.model';
import { Collections } from './collections.model';
import { UserModel } from '../user/user.model';
import emailGenerator from '../utilities/emailGenerator.util';
import _ from 'lodash';

const hdrukEmail = `enquiry@healthdatagateway.org`;

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
			} collection ${collectionName} that you are a collaborator on has been edited and is now live`;
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

export { getCollectionObjects, sendEmailNotifications, generateCollectionEmailSubject };
