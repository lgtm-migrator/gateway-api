import { MessagesModel } from './message.model';
import _ from 'lodash';
import { TopicModel } from '../topic/topic.model';
import mongoose from 'mongoose';
import { UserModel } from '../user/user.model';
import emailGenerator from '../utilities/emailGenerator.util';
import teamController from '../team/team.controller';

import { Data as ToolModel } from '../tool/data.model';
import constants from '../utilities/constants.util';

const topicController = require('../topic/topic.controller');

module.exports = {
	// POST /api/v1/messages
	createMessage: async (req, res) => {
		try {
			const { _id: createdBy, firstname, lastname } = req.user;
			let { messageType = 'message', topic = '', messageDescription, relatedObjectIds } = req.body;
			let topicObj = {};
			let team;

			// 1. If the message type is 'message' and topic id is empty
			if (messageType === 'message') {
				// 2. Find the related object(s) in MongoDb and include team data to update topic recipients in case teams have changed
				const tools = await ToolModel.find()
					.where('_id')
					.in(relatedObjectIds)
					.populate({ path: 'publisher', populate: { path: 'team' } });
				// 3. Return undefined if no object(s) exists
				if (_.isEmpty(tools)) return undefined;

				// 4. Get recipients for new message
				let { publisher = '' } = tools[0];
				
				if (_.isEmpty(publisher)) {
					console.error(`No publisher associated to this dataset`);
					return res.status(500).json({ success: false, message: 'No publisher associated to this dataset' });
				}
				// 5. get team
				({ team = [] } = publisher);
				if (_.isEmpty(team)) {
					console.error(`No team associated to publisher, cannot message`);
					return res.status(500).json({ success: false, message: 'No team associated to publisher, cannot message' });
				}

				if (_.isEmpty(topic)) {
					// 6. Create new topic
					topicObj = await topicController.buildTopic({ createdBy, relatedObjectIds });
					// 7. If topic was not successfully created, throw error response
					if (!topicObj) return res.status(500).json({ success: false, message: 'Could not save topic to database.' });
					// 8. Pass new topic Id
					topic = topicObj._id;
				} else {
					// 9. Find the existing topic
					topicObj = await topicController.findTopic(topic, createdBy);
					// 10. Return not found if it was not found
					if (!topicObj) {
						return res.status(404).json({ success: false, message: 'The topic specified could not be found' });
					}
					topicObj.recipients = await topicController.buildRecipients(team, topicObj.createdBy);
					await topicObj.save();
				}
			}
			// 11. Create new message
			const message = await MessagesModel.create({
				messageID: parseInt(Math.random().toString().replace('0.', '')),
				messageObjectID: parseInt(Math.random().toString().replace('0.', '')),
				messageDescription,
				topic,
				createdBy,
				messageType,
				readBy: [new mongoose.Types.ObjectId(createdBy)],
			});
			// 12. Return 500 error if message was not successfully created
			if (!message) return res.status(500).json({ success: false, message: 'Could not save message to database.' });

			// 13. Prepare to send email if a new message has been created
			if (messageType === 'message') {
				let optIn, subscribedEmails;
				// 14. Find recipients who have opted in to email updates and exclude the requesting user
				let messageRecipients = await UserModel.find({ _id: { $in: topicObj.recipients } }).populate('additionalInfo');
				let optedInEmailRecipients = [...messageRecipients].filter(function (user) {
					let {
						additionalInfo: { emailNotifications },
						_id,
					} = user;
					return emailNotifications === true && _id.toString() !== createdBy.toString();
				});

				if (!_.isEmpty(team) || !_.isNil(team)) {
					// 15. team all users for notificationType + generic email
					// Retrieve notifications for the team based on type return {notificationType, subscribedEmails, optIn}
					let teamNotifications = teamController.getTeamNotificationByType(team, constants.teamNotificationTypes.DATAACCESSREQUEST);
					// only deconstruct if team notifications object returns - safeguard code
					if (!_.isEmpty(teamNotifications)) {
						// Get teamNotification emails if optIn true
						({ optIn = false, subscribedEmails = [] } = teamNotifications);
						// check subscribedEmails and optIn send back emails or blank []
						let teamNotificationEmails = teamController.getTeamNotificationEmails(optIn, subscribedEmails);
						// get users from team.members with notification type and optedIn only
						const subscribedMembersByType = teamController.filterMembersByNoticationTypesOptIn(
							[...team.members],
							[constants.teamNotificationTypes.DATAACCESSREQUEST]
						);
						if (!_.isEmpty(subscribedMembersByType)) {
							// build cleaner array of memberIds from subscribedMembersByType
							const memberIds = [...subscribedMembersByType].map(m => m.memberid);
							// returns array of objects [{email: 'email@email.com '}] for members in subscribed emails users is list of full user object
							const { memberEmails } = teamController.getMemberDetails([...memberIds], [...messageRecipients]);
							optedInEmailRecipients = [...teamNotificationEmails, ...memberEmails];
						} else {
							// only if not membersByType but has a team email setup
							optedInEmailRecipients = [...optedInEmailRecipients, ...teamNotificationEmails];
						}
					}
				}

				// 16. Send email
				emailGenerator.sendEmail(
					optedInEmailRecipients,
					constants.hdrukEmail,
					`You have received a new message on the HDR UK Innovation Gateway`,
					`You have received a new message on the HDR UK Innovation Gateway. <br> Log in to view your messages here : <a href='${process.env.homeURL}'>HDR UK Innovation Gateway</a>`,
					false
				);
			}
			// 17. Return successful response with message data
			message.createdByName = { firstname, lastname };
			return res.status(201).json({ success: true, message });
		} catch (err) {
			console.error(err.message);
			return res.status(500).json(err.message);
		}
	},
	// DELETE /api/v1/messages/:id
	deleteMessage: async (req, res) => {
		try {
			const { id } = req.params;
			const { _id: userId } = req.user;
			// 1. Return not found error if id not passed
			if (!id) return res.status(404).json({ success: false, message: 'Message Id not found.' });
			// 2. Get message by Id from MongoDb
			const message = await MessagesModel.findOne({ _id: id });
			// 3. Return not found if message not found
			if (!message) {
				return res.status(404).json({ success: false, message: 'Message not found.' });
			}
			// 4. Check that the message was created by requesting user otherwise return unathorised
			if (message.createdBy.toString() !== userId.toString()) {
				return res.status(401).json({ success: false, message: 'Not authorised to delete this message' });
			}
			// 5. Delete message by id
			await MessagesModel.remove({ _id: id });
			// 6. Check attached topic for other messages to avoid orphaning topic documents
			const messagesCount = await MessagesModel.count({ topic: message.topic });
			// 7. If no other messages remain then delete the topic
			if (!messagesCount) {
				await TopicModel.remove({ _id: new mongoose.Types.ObjectId(message.topic) });
			}
			// 8. Return successful response
			return res.status(204).json({ success: true });
		} catch (err) {
			console.error(err.message);
			return res.status(500).json(err.message);
		}
	},
	// PUT /api/v1/messages
	updateMessage: async (req, res) => {
		try {
			let { _id: userId } = req.user;
			let { messageId, isRead, messageDescription = '', messageType = '' } = req.body;
			// 1. Return not found error if id not passed
			if (!messageId) return res.status(404).json({ success: false, message: 'Message Id not found.' });
			// 2. Get message by object id
			const message = await MessagesModel.findOne({ _id: messageId });
			// 3. Return not found if message not found
			if (!message) {
				return res.status(404).json({ success: false, message: 'Message not found.' });
			}
			// 4. Update message params - readBy is an array of users who have read the message
			if (isRead && !message.readBy.includes(userId.toString())) {
				message.readBy.push(userId);
			}
			if (isRead) {
				message.isRead = isRead;
			}
			if (!_.isEmpty(messageDescription)) {
				message.messageDescription = messageDescription;
			}
			if (!_.isEmpty(messageType)) {
				message.messageType = messageType;
			}
			// 5. Save message to Mongo
			await message.save();
			// 6. Return success no content
			return res.status(204).json({ success: true });
		} catch (err) {
			console.error(err.message);
			return res.status(500).json(err.message);
		}
	},
	// GET api/v1/messages/unread/count
	getUnreadMessageCount: async (req, res) => {
		try {
			let { _id: userId } = req.user;
			let unreadMessageCount = 0;

			// 1. Find all active topics the user is a member of
			const topics = await TopicModel.find({
				recipients: { $elemMatch: { $eq: userId } },
				status: 'active',
			});
			// 2. Iterate through each topic and aggregate unread messages
			topics.forEach(topic => {
				topic.topicMessages.forEach(message => {
					if (!message.readBy.includes(userId)) {
						unreadMessageCount++;
					}
				});
			});
			// 3. Return the number of unread messages
			return res.status(200).json({ success: true, count: unreadMessageCount });
		} catch (err) {
			console.error(err.message);
			return res.status(500).json(err.message);
		}
	},
};
