import express from 'express';
import _ from 'lodash';
import { to } from 'await-to-js';
import passport from 'passport';

import { verifyPassword, getRedirectUrl, signToken } from '../auth/utils';
import { login } from '../auth/strategies/jwt';
import { getUserByEmail, getServiceAccount } from '../user/user.repository';

const router = express.Router();

// @router   POST /api/auth/login
// @desc     login user
// @access   Public
router.post('/login', async (req, res) => {
	const { email, password } = req.body;

	const [err, user] = await to(getUserByEmail(email));

	const authenticationError = () => {
		return res.status(500).json({ success: false, data: 'Authentication error!' });
	};

	if (!(await verifyPassword(password, user.password))) {
		console.error('Passwords do not match');
		return authenticationError();
	}

	const [loginErr, token] = await to(login(req, user));

	if (loginErr) {
		console.error('Log in error', loginErr);
		return authenticationError();
	}

	return res
		.status(200)
		.cookie('jwt', token, {
			httpOnly: true,
		})
		.json({
			success: true,
			data: getRedirectUrl(req.user.role),
		});
});

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
	passport.authenticate('jwt', function (err, user, info) {
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
			// 2. Return user info
			return res.json({
				success: true,
				data: [
					{
						role: req.user.role,
						id: req.user.id,
						name: req.user.firstname + ' ' + req.user.lastname,
						loggedIn: true,
						teams,
					},
				],
			});
		}
	})(req, res, next);
});

// @router   POST /api/v1/auth/token
// @desc     Issues a JWT for a valid authentication attempt using client credentials
// @access   Public
router.post('/token', async (req, res) => {
	// 1. Deconstruct grant type
	const { grant_type = '' } = req.body;
	// 2. Allow different grant types to be processed
	switch(grant_type) {
		case 'client_credentials':
			// Deconstruct request body to extract client ID, secret
			const { client_id = '', client_secret = '' } = req.body;
			// Ensure client credentials have been passed
			if (_.isEmpty(client_id) || _.isEmpty(client_secret)) {
				return res.status(400).json({
					success: false,
					message: 'Incomplete client credentials were provided for the authorisation attempt',
				});
			}
			// Find an associated service account based on the credentials passed
			const serviceAccount = await getServiceAccount(client_id, client_secret);
			if (_.isNil(serviceAccount)) {
				return res.status(400).json({
					success: false,
					message: 'Invalid client credentials were provided for the authorisation attempt',
				});
			}
			// Construct JWT for service account
			const jwt = signToken({ _id: serviceAccount._id, id: serviceAccount.id, timeStamp: Date.now() });
			const access_token = `Bearer ${jwt}`;
			const token_type = 'jwt', expires_in = 604800;
			// Return payload
			return res.status(200).json({
				access_token,
				token_type,
				expires_in,
			});
	}
	// Bad request for any other grant type passed
	return res.status(400).json({
		success: false,
		message: 'An invalid grant type has been specified',
	});
});

module.exports = router;
