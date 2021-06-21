import express from 'express';
import passport from 'passport';

const router = express.Router();

// @router   POST /api/auth/logout
// @desc     logout user
// @access   Private
router.get('/logout', function (req, res) {
	req.logout();
	for (var prop in req.cookies) {
		res.clearCookie(prop);
	}
	return res.json({ success: true });
});

// @router   GET /api/auth/status
// @desc     Return the logged in status of the user and their role.
// @access   Private
router.get('/status', function (req, res, next) {
	passport.authenticate('jwt', function (err, user) {
		if (err || !user) {
			return res.json({
				success: true,
				data: [{ role: 'Reader', id: null, name: null, loggedIn: false }],
			});
		} else {
			// 1. Reformat teams array for frontend
			let { teams } = req.user.toObject();
			if (teams) {
				teams = teams.map(team => {
					let { publisher, type, members } = team;
					let member = members.find(member => {
						return member.memberid.toString() === req.user._id.toString();
					});
					let { roles } = member;
					return { ...publisher, type, roles };
				});
			}

			let adminArray = teams.filter(team => team.type === 'admin');
			let teamArray = teams
				.filter(team => team.type !== 'admin')
				.sort(function (a, b) {
					return a.name.toUpperCase() < b.name.toUpperCase() ? -1 : a.name.toUpperCase() > b.name.toUpperCase() ? 1 : 0;
				});

			// 2. Return user info
			return res.json({
				success: true,
				data: [
					{
						role: req.user.role,
						id: req.user.id,
						name: req.user.firstname + ' ' + req.user.lastname,
						loggedIn: true,
						email: req.user.email,
						teams: [...adminArray, ...teamArray],
						provider: req.user.provider,
						advancedSearchRoles: req.user.advancedSearchRoles,
						acceptedAdvancedSearchTerms: req.user.acceptedAdvancedSearchTerms,
					},
				],
			});
		}
	})(req, res, next);
});

module.exports = router;
