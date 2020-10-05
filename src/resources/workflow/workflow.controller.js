import { PublisherModel } from '../publisher/publisher.model';
import { DataRequestModel } from '../datarequest/datarequest.model';
import { WorkflowModel } from './workflow.model';
import helper from '../utilities/helper.util';
import moment from 'moment';

import _ from 'lodash';
import mongoose from 'mongoose';

const teamController = require('../team/team.controller');

module.exports = {
	// GET api/v1/workflows/:id
	getWorkflowById: async (req, res) => {
		try {
			// 1. Get the workflow from the database including the team members to check authorisation and the number of in-flight applications
			const workflow = await WorkflowModel.findOne({
				_id: req.params.id,
			}).populate([
				{
					path: 'publisher',
					select: 'team',
					populate: {
						path: 'team',
						select: 'members -_id',
					},
				},
				{
					path: 'steps.reviewers',
					model: 'User',
					select: '_id id firstname lastname',
				},
				{
					path: 'applications',
					select: 'aboutApplication',
					match: { applicationStatus: 'inReview' },
				},
			]);
			if (!workflow) {
				return res.status(404).json({ success: false });
			}
			// 2. Check the requesting user is a manager of the custodian team
			let { _id: userId } = req.user;
			let authorised = teamController.checkTeamPermissions(
				teamController.roleTypes.MANAGER,
				workflow.publisher.team.toObject(),
				userId
			);
			// 3. If not return unauthorised
			if (!authorised) {
				return res.status(401).json({ success: false });
			}
			// 4. Build workflow response
			let {
				active,
				_id,
				id,
				workflowName,
				version,
				steps,
				applications = [],
			} = workflow.toObject();
			applications = applications.map((app) => {
				const { aboutApplication, _id } = app;
				const aboutApplicationObj = JSON.parse(aboutApplication) || {};
				let { projectName = 'No project name' } = aboutApplicationObj;
				return { projectName, _id };
			});
			// Set operation permissions
			let canDelete = applications.length === 0,
				canEdit = applications.length === 0;
			// 5. Return payload
			return res.status(200).json({
				success: true,
				workflow: {
					active,
					_id,
					id,
					workflowName,
					version,
					steps,
					applications,
					appCount: applications.length,
					canDelete,
					canEdit,
				},
			});
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: 'An error occurred searching for the specified workflow',
			});
		}
	},

	// POST api/v1/workflows
	createWorkflow: async (req, res) => {
		try {
			const { _id: userId } = req.user;
			// 1. Look at the payload for the publisher passed
			const { workflowName = '', publisher = '', steps = [] } = req.body;
			if (
				_.isEmpty(workflowName.trim()) ||
				_.isEmpty(publisher.trim()) ||
				_.isEmpty(steps)
			) {
				return res.status(400).json({
					success: false,
					message:
						'You must supply a workflow name, publisher, and at least one step definition to create a workflow',
				});
			}
			// 2. Look up publisher and team
			const publisherObj = await PublisherModel.findOne({
				_id: publisher,
			}).populate('team', 'members');
			if (!publisherObj) {
				return res.status(400).json({
					success: false,
					message:
						'You must supply a valid publisher to create the workflow against',
				});
			}
			// 3. Check the requesting user is a manager of the custodian team
			let authorised = teamController.checkTeamPermissions(
				teamController.roleTypes.MANAGER,
				publisherObj.team.toObject(),
				userId
			);

			// 4. Refuse access if not authorised
			if (!authorised) {
				return res
					.status(401)
					.json({ status: 'failure', message: 'Unauthorised' });
			}
			// 5. Create new workflow model
			const id = helper.generatedNumericId();
			let workflow = new WorkflowModel({
				id,
				workflowName,
				publisher,
				steps,
				createdBy: new mongoose.Types.ObjectId(userId),
			});
			// 6. Submit save
			workflow.save(function (err) {
				if (err) {
					console.error(err);
					return res.status(400).json({
						success: false,
						message: err.message,
					});
				} else {
					// 7. Return workflow payload
					return res.status(201).json({
						success: true,
						workflow,
					});
				}
			});
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: 'An error occurred creating the workflow',
			});
		}
	},

	// PUT api/v1/workflows/:id
	updateWorkflow: async (req, res) => {
		try {
			const { _id: userId } = req.user;
			const { id: workflowId } = req.params;
			// 1. Look up workflow
			let workflow = await WorkflowModel.findOne({
				_id: req.params.id,
			}).populate({
				path: 'publisher steps.reviewers',
				select: 'team',
				populate: {
					path: 'team',
					select: 'members -_id',
				},
			});
			if (!workflow) {
				return res.status(404).json({ success: false });
			}
			// 2. Check the requesting user is a manager of the custodian team
			let authorised = teamController.checkTeamPermissions(
				teamController.roleTypes.MANAGER,
				workflow.publisher.team.toObject(),
				userId
			);
			// 3. Refuse access if not authorised
			if (!authorised) {
				return res
					.status(401)
					.json({ status: 'failure', message: 'Unauthorised' });
			}
			// 4. Ensure there are no in-review DARs with this workflow
			const applications = await DataRequestModel.countDocuments({
				workflowId,
				applicationStatus: 'inReview',
			});
			if (applications > 0) {
				return res.status(400).json({
					success: false,
					message:
						'A workflow which is attached to applications currently in review cannot be edited',
				});
			}
			// 5. Edit workflow
			const { workflowName = '', steps = [] } = req.body;
			let isDirty = false;
			// Check if workflow name updated
			if (!_.isEmpty(workflowName)) {
				workflow.workflowName = workflowName;
				isDirty = true;
			} // Check if steps updated
			if (!_.isEmpty(steps)) {
				workflow.steps = steps;
				isDirty = true;
			} // Perform save if changes have been made
			if (isDirty) {
				workflow.save(async (err) => {
					if (err) {
						console.error(err);
						return res.status(400).json({
							success: false,
							message: err.message,
						});
					} else {
						// 7. Return workflow payload
						return res.status(204).json({
							success: true,
							workflow
						});
					}
				});
			} else {
				return res.status(200).json({
					success: true
				});
			}
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: 'An error occurred editing the workflow',
			});
		}
	},

	// DELETE api/v1/workflows/:id
	deleteWorkflow: async (req, res) => {
		try {
			const { _id: userId } = req.user;
			const { id: workflowId } = req.params;
			// 1. Look up workflow
			const workflow = await WorkflowModel.findOne({
				_id: req.params.id,
			}).populate({
				path: 'publisher steps.reviewers',
				select: 'team',
				populate: {
					path: 'team',
					select: 'members -_id',
				},
			});
			if (!workflow) {
				return res.status(404).json({ success: false });
			}
			// 2. Check the requesting user is a manager of the custodian team
			let authorised = teamController.checkTeamPermissions(
				teamController.roleTypes.MANAGER,
				workflow.publisher.team.toObject(),
				userId
			);
			// 3. Refuse access if not authorised
			if (!authorised) {
				return res
					.status(401)
					.json({ status: 'failure', message: 'Unauthorised' });
			}
			// 4. Ensure there are no in-review DARs with this workflow
			const applications = await DataRequestModel.countDocuments({
				workflowId,
				applicationStatus: 'inReview',
			});
			if (applications > 0) {
				return res.status(400).json({
					success: false,
					message:
						'A workflow which is attached to applications currently in review cannot be deleted',
				});
			}
			// 5. Delete workflow
			WorkflowModel.deleteOne({ _id: workflowId }, function (err) {
				if (err) {
					console.error(err);
					return res.status(400).json({
						success: false,
						message: 'An error occurred deleting the workflow',
					});
				} else {
					// 7. Return workflow payload
					return res.status(204).json({
						success: true,
					});
				}
			});
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: 'An error occurred deleting the workflow',
			});
		}
	},

	calculateStepDeadlineReminderDate: (step) => {
		// Extract deadline in days from step definition
		let { deadline, reminderOffset } = step;
		// Add step duration to current date
		let deadlineDate = moment().add(deadline, 'days');
		// Subtract SLA reminder offset
		let reminderDate = moment(deadlineDate).subtract(reminderOffset, 'days');
		return reminderDate.format("YYYY-MM-DDTHH:mm:ss");
	}
};
