import { PublisherModel } from '../publisher/publisher.model';
import { DataRequestModel } from '../datarequest/datarequest.model';
import { WorkflowModel } from './workflow.model';
import helper from '../utilities/helper.util';

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
		// Extract deadline and reminder offset in days from step definition
		let { deadline, reminderOffset } = step;
		// Subtract SLA reminder offset
		let reminderPeriod = +deadline - +reminderOffset;
		return `P${reminderPeriod}D`;
	},

	workflowStepContainsManager: (reviewers, team) => {
		let managerExists = false;
		// 1. Extract team members
		let { members } = team;
		// 2. Iterate through each reviewer to check if they are a manager of the team
		reviewers.forEach(reviewer => {
			// 3. Find the current user
			let userMember = members.find(
				(member) => member.memberid.toString() === reviewer.toString()
			);
			// 3. If the user was found check if they are a manager
			if (userMember) {
				let { roles } = userMember;
				if (roles.includes(roleTypes.MANAGER)) {
					managerExists = true;
				}
			}
		})
		return managerExists;
	},

	buildNextStep: (userId, application, activeStepIndex, override) => {
		// Check the current position of the application within its assigned workflow
		const finalStep = activeStepIndex === application.workflow.steps.length -1;
		const requiredReviews = application.workflow.steps[activeStepIndex].reviewers.length;
		const completedReviews = application.workflow.steps[activeStepIndex].recommendations.length;
		const stepComplete = completedReviews === requiredReviews;
		// Establish base payload for Camunda
		// (1) phaseApproved is passed as true when the manager is overriding the current step/phase
		//		this short circuits the review process in the workflow and closes any remaining user tasks 
		//		i.e. reviewers within the active step OR when the last reviewer in the step submits a vote
		// (2) managerApproved is passed as true when the manager is approving the entire application 
		//		from any point within the review process
		// (3) finalPhaseApproved is passed as true when the final step is completed naturally through all
		//		reviewers casting their votes
		let bpmContext = { 
			businessKey: application._id,
			dataRequestUserId: userId.toString(),
			managerApproved: override,
			phaseApproved: (override && !finalStep) || stepComplete,
			finalPhaseApproved: finalStep,
			stepComplete
		}
		if(!finalStep) {
			// Extract the information for the next step defintion
			let { name: dataRequestPublisher } = application.publisherObj;
			let nextStep = application.workflow.steps[activeStepIndex+1];
			let reviewerList = nextStep.reviewers.map((reviewer) => reviewer._id.toString());
			let { stepName: dataRequestStepName } = nextStep;
			// Update Camunda payload with the next step information
			bpmContext = { 
				...bpmContext,
				dataRequestPublisher,
				dataRequestStepName,
				notifyReviewerSLA: module.exports.calculateStepDeadlineReminderDate(
					nextStep
				),
				reviewerList
			};
		}
		return bpmContext;
	}
};
