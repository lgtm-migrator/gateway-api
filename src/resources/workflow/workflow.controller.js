import { PublisherModel } from '../publisher/publisher.model';
import { DataRequestModel } from '../datarequest/datarequest.model';
import { WorkflowModel } from './workflow.model';

import helper from '../utilities/helper.util';

import _ from 'lodash';
import mongoose from 'mongoose';

const teamRoles = {
	MANAGER: 'manager',
	REVIEWER: 'reviewer',
};

module.exports = {
	// GET api/v1/workflows/:id
	getWorkflowById: async (req, res) => {
		try {
			// 1. Get the workflow from the database including the team members to check authorisation
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
			// 2. Check the requesting user is a member of the team
			let { _id: userId } = req.user;
			let members = [],
				authorised = false;
			if (_.has(workflow.toObject(), 'publisher.team')) {
				({
					publisher: {
						team: { members },
					},
				} = workflow);
			}
			if (!_.isEmpty(members)) {
				authorised = members.some(
					(el) => el.memberid.toString() === userId.toString()
				);
			}
			// 3. If not return unauthorised
			if (!authorised) {
				return res.status(401).json({ success: false });
			}
			// 4. Return workflow
			let {
				active,
				_id,
				id,
				workflowName,
				version,
				steps,
			} = workflow.toObject();
			return res.status(200).json({
				success: true,
				workflow: { active, _id, id, workflowName, version, steps },
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
			let authorised = module.exports.checkWorkflowPermissions(
				teamRoles.MANAGER,
				publisherObj.toObject(),
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
			let authorised = module.exports.checkWorkflowPermissions(
				teamRoles.MANAGER,
				workflow.publisher.toObject(),
				userId
			);
			// 3. Refuse access if not authorised
			if (!authorised) {
				return res
					.status(401)
					.json({ status: 'failure', message: 'Unauthorised' });
			}
			// 4. Ensure there are no in-review DARs with this workflow
			const applications = await DataRequestModel.countDocuments({ workflowId, 'applicationStatus':'inReview' });
			if(applications > 0) {
				return res.status(400).json({
					success: false,
					message: 'A workflow which is attached to applications currently in review cannot be edited',
				});
			}
			// 5. Edit workflow
			const { workflowName = '', steps = [] } = req.body;
			let isDirty = false;
			// Check if workflow name updated
			if(!_.isEmpty(workflowName)) {
				workflow.workflowName = workflowName;
				isDirty = true;
			} // Check if steps updated
			if(!_.isEmpty(steps)) {
				workflow.steps = steps;
				isDirty = true;
			} // Perform save if 
			if(isDirty) {
				WorkflowModel.deleteOne({ _id: workflowId }, function (err) {
					if (err) {
						console.error(err);
						return res.status(400).json({
							success: false,
							message: 'An error occurred editing the workflow',
						});
					} else {
						// 7. Return workflow payload
						return res.status(204).json({
							success: true
						});
					}
				});
			} else {
				return res.status(200).json({
					success: true,
					workflow
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
			let authorised = module.exports.checkWorkflowPermissions(
				teamRoles.MANAGER,
				workflow.publisher.toObject(),
				userId
			);
			// 3. Refuse access if not authorised
			if (!authorised) {
				return res
					.status(401)
					.json({ status: 'failure', message: 'Unauthorised' });
			}
			// 4. Ensure there are no in-review DARs with this workflow
			const applications = await DataRequestModel.countDocuments({ workflowId, 'applicationStatus':'inReview' });
			if(applications > 0) {
				return res.status(400).json({
					success: false,
					message: 'A workflow which is attached to applications currently in review cannot be deleted',
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
						success: true
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

	/**
	 * Check a users CRUD permissions for workflows
	 *
	 * @param {enum} role The role required for the action
	 * @param {object} publisher The publisher object containing the team and its members
	 * @param {objectId} userId The userId to check the permissions for
	 */
	checkWorkflowPermissions: (role, publisher, userId) => {
		// 1. Ensure the publisher has a team and associated members defined
		if (_.has(publisher, 'team.members')) {
			// 2. Extract team members
			let { members } = publisher.team;
			// 3. Find the current user
			let userMember = members.find(
				(el) => el.memberid.toString() === userId.toString()
			);
			// 4. If the user was found check they hold the minimum required role
			if (userMember) {
				let { roles } = userMember;
				if (roles.includes(role) || roles.includes(roleTypes.MANAGER)) {
					return true;
				}
			}
		}
		return false;
	},
};
