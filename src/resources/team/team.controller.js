import { TeamModel } from './team.model';
import _ from 'lodash';

export const roleTypes = {
	MANAGER: 'manager',
	REVIEWER: 'reviewer',
}

module.exports = {
	
	// GET api/v1/teams/:id
	getTeamById: async (req, res) => {
		try {
			// 1. Get the team from the database
			const team = await TeamModel.findOne({ _id: req.params.id });
			if (!team) {
				return res.status(404).json({ success: false });
			}
			// 2. Check the current user is a member of the team
			let { _id } = req.user;
			let { members } = team;
			let authorised = false;
			if (members) {
				authorised = members.some(
					(el) => el.memberid.toString() === _id.toString()
				);
			}
			// 3. If not return unauthorised
			if (!authorised) {
				return res.status(401).json({ success: false });
			}
			// 4. Return team
			return res.status(200).json({ success: true, team });
		} catch (err) {
			console.error(err.message);
			return res.status(500).json(err);
		}
	},

	// GET api/v1/teams/:id/members
	getTeamMembers: async (req, res) => {
		try {
			// 1. Get the team from the database
			const team = await TeamModel.findOne({ _id: req.params.id }).populate(
				'users'
			);
			if (!team) {
				return res.status(404).json({ success: false });
			}
			// 2. Check the current user is a member of the team
			let { _id } = req.user;
			let { members, users } = team;
			let authorised = false;
			if (members) {
				authorised = members.some(
					(el) => el.memberid.toString() === _id.toString()
				);
			}
			// 3. If not return unauthorised
			if (!authorised) {
				return res.status(401).json({ success: false });
			}
			// 4. Format response to include user info
			users = users.map((user) => {
				let { firstname, lastname, id, _id, email } = user;
				let userMember = members.find(
					(el) => el.memberid.toString() === user._id.toString()
				);
				let { roles = [] } = userMember;
				return { firstname, lastname, id, _id, email, roles };
			});
			// 5. Return team members
			return res.status(200).json({ success: true, members: users });
		} catch (err) {
			console.error(err.message);
			return res.status(500).json(err);
		}
	},

	/**
	 * Check a users CRUD permissions for workflows
	 *
	 * @param {enum} role The role required for the action
	 * @param {object} team The team object containing its members
	 * @param {objectId} userId The userId to check the permissions for
	 */
	checkTeamPermissions: (role, team, userId) => {
		// 1. Ensure the team has associated members defined
		if (_.has(team, 'members')) {
			// 2. Extract team members
			let { members } = team;
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

	getTeamManagers: (team) => {
		// Destructure members array and populated users array (populate 'users' must be included in the original Mongo query)
		let { members = [], users = [] } = team;
		// Get all userIds for managers within team
		let managerIds = members.filter(mem => mem.roles.includes('manager')).map(mem => mem.memberid.toString());
		// return all user records for managers
		return users.filter(user => managerIds.includes(user._id.toString()));
	}
};
