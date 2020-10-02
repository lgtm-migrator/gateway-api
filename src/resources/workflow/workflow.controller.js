import { WorkflowModel } from './workflow.model';
import _ from 'lodash';

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
			return res
				.status(200)
				.json({
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
};
