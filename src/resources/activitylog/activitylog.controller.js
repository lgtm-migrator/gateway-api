import Controller from '../base/controller';
import { logger } from '../utilities/logger';
import constants from '../utilities/constants.util';
import teamController from '../team/team.controller';
import notificationBuilder from '../utilities/notificationBuilder';
import emailGenerator from '../utilities/emailGenerator.util';

const logCategory = 'Activity Log';

export default class ActivityLogController extends Controller {
	constructor(activityLogService) {
		super(activityLogService);
		this.activityLogService = activityLogService;
	}

	async searchLogs(req, res) {
		try {
			// Extract required log params
			const { versionIds = [], type = '', userType, accessRecords } = req.body;

			// Find the logs
			const logs = await this.activityLogService.searchLogs(versionIds, type, userType, accessRecords);

			// Return the logs
			return res.status(200).json({
				success: true,
				logs,
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'A server error occurred, please try again',
			});
		}
	}

	async createLog(req, res) {
		try {
			// Extract required event log params
			const { versionId, description, timestamp, type, userType, accessRecord, versionTitle } = req.body;

			// Create new event log
			await this.activityLogService.logActivity(constants.activityLogEvents.MANUAL_EVENT, {
				versionId,
				versionTitle,
				description,
				timestamp,
				type,
				user: req.user,
			});

			// Send notifications
			await this.createNotifications(constants.activityLogNotifications.MANUALEVENTADDED, { description, timestamp }, accessRecord, req.user);

			// Get logs for version that was updated
			const [affectedVersion] = await this.activityLogService.searchLogs([versionId], type, userType, [accessRecord], false);

			// Return the logs
			return res.status(200).json({
				success: true,
				affectedVersion,
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'A server error occurred, please try again',
			});
		}
	}

	async deleteLog(req, res) {
		try {
			// Extract required event params
			const { id } = req.params;
			const { versionId, type, userType, accessRecord } = req.body;

			// Get log to be deleted required for email content
			const log = await this.activityLogService.getLog(id, type);

			// Delete event log
			await this.activityLogService.deleteLog(id);

			// Send notifications
			await this.createNotifications(constants.activityLogNotifications.MANUALEVENTREMOVED, { description: log.plainText, timestamp: log.timestamp }, accessRecord, req.user);

			// Get logs for version that was updated
			const [affectedVersion] = await this.activityLogService.searchLogs([versionId], type, userType, [accessRecord], false);

			// Return the logs
			return res.status(200).json({
				success: true,
				affectedVersion,
			});
		} catch (err) {
			// Return error response if something goes wrong
			logger.logError(err, logCategory);
			return res.status(500).json({
				success: false,
				message: 'A server error occurred, please try again',
			});
		}
	}

	async createNotifications(type, context, accessRecord, user) {
		let teamMembers, teamMembersIds, emailRecipients, html, options;
		const { description, timestamp } = context;
		const { publisherObj: { name: publisher } = {}, _id, aboutApplication: { projectName = 'No project name set' } = {} } = accessRecord;

		switch (type) {
			case constants.activityLogNotifications.MANUALEVENTADDED:
				// 1. Create notifications
				// Retrieve all custodian team members
				teamMembers = teamController.getTeamMembersByRole(accessRecord.publisherObj.team, 'All');
				teamMembersIds = teamMembers.map(user => user.id);
				// Create in-app notifications
				await notificationBuilder.triggerNotificationMessage(
					teamMembersIds,
					`${user.firstname} ${user.lastname} (${publisher}) has added an event to the activity log of '${projectName || `No project name set`}' data access request application`,
					'data access request log updated',
					_id,
					publisher
				);

				// 2. Send emails to all custodian team members
				emailRecipients = [...teamMembers];

				// Create object to pass through email data
				options = {
					id: _id,
					userName: `${user.firstname} ${user.lastname}`,
					publisher,
					description,
					timestamp,
					projectName,
				};
				// Create email body content
				html = emailGenerator.generateActivityLogManualEventCreated(options);
				// Send email
				await emailGenerator.sendEmail(emailRecipients, constants.hdrukEmail, `A new event has been added to an activity log`, html, false);
				break;
			case constants.activityLogNotifications.MANUALEVENTREMOVED:
				// 1. Create notifications
				// Retrieve all custodian team members
				teamMembers = teamController.getTeamMembersByRole(accessRecord.publisherObj.team, 'All');
				teamMembersIds = teamMembers.map(user => user.id);
				// Create in-app notifications
				await notificationBuilder.triggerNotificationMessage(
					teamMembersIds,
					`${user.firstname} ${user.lastname} (${publisher}) has deleted an event from the activity log of '${projectName || `No project name set`}' data access request application`,
					'data access request log updated',
					_id,
					publisher
				);

				// 2. Send emails to all custodian team members
				emailRecipients = [...teamMembers];

				// Create object to pass through email data
				options = {
					id: _id,
					userName: `${user.firstname} ${user.lastname}`,
					publisher,
					description,
					timestamp,
					projectName,
				};
				// Create email body content
				html = emailGenerator.generateActivityLogManualEventDeleted(options);
				// Send email
				await emailGenerator.sendEmail(
					emailRecipients,
					constants.hdrukEmail,
					`An event has been deleted from an activity log`,
					html,
					false
				);
				break;
		}
	}
}
