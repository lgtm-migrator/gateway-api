/* eslint-disable no-undef */
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { ROLES } from '../user/user.roles';
import { UserModel } from '../user/user.model';
import { Course } from '../course/course.model';
import { Collections } from '../collections/collections.model';
import { Data } from '../tool/data.model';
import { isEmpty } from 'lodash';

const setup = () => {
	passport.serializeUser((user, done) => done(null, user._id));

	passport.deserializeUser(async (id, done) => {
		try {
			const user = await UserModel.findById(id);
			return done(null, user);
		} catch (err) {
			return done(err, null);
		}
	});
};

const signToken = (user, expiresIn = 604800) => {
	return jwt.sign({ data: user }, process.env.JWTSecret, {
		//Here change it so only id
		algorithm: 'HS256',
		expiresIn,
	});
};

const camundaToken = () => {
	return jwt.sign(
		// This structure must not change or the authenication between camunda and the gateway will fail
		// username: An admin user the exists within the camunda-admin group
		// groupIds: The admin group that has been configured on the camunda portal.
		{ username: process.env.BPMN_ADMIN_USER, groupIds: ['camunda-admin'], tenantIds: [] },
		process.env.JWTSecret || 'local',
		{
			//Here change it so only id
			algorithm: 'HS256',
			expiresIn: 604800,
		}
	);
};

const checkIsInRole = (...roles) => (req, res, next) => {
	if (!req.user) {
		return res.redirect('/login');
	}

	const hasRole = roles.find(role => req.user.role === role);
	if (!hasRole) {
		return res.redirect('/login');
	}

	return next();
};

const whatIsRole = req => {
	if (!req.user) {
		return 'Reader';
	} else {
		return req.user.role;
	}
};

const checkIsUser = () => (req, res, next) => {
	if (req.user) {
		if (req.params.userID && req.params.userID === req.user.id.toString()) return next();
		else if (req.params.id && req.params.id === req.user.id.toString()) return next();
		else if (req.body.id && req.body.id.toString() === req.user.id.toString()) return next();
	}

	return res.status(401).json({
		status: 'error',
		message: 'Unauthorised to perform this action.',
	});
};

const checkAllowedToAccess = type => async (req, res, next) => {
	const { user, params } = req;
	if (!isEmpty(user)) {
		if (user.role === ROLES.Admin) return next();
		else if (!isEmpty(params.id)) {
			let data = {};
			if (type === 'course') {
				data = await Course.findOne({ id: params.id }, { creator: 1 }).lean();
				if (!isEmpty(data) && [data.creator].includes(user.id)) return next();
			} else if (type === 'collection') {
				data = await Collections.findOne({ id: params.id }, { authors: 1 }).lean();
				if (!isEmpty(data) && [data.authors].includes(user.id)) return next();
			} else {
				data = await Data.findOne({ id: params.id }, { authors: 1, uploader: 1 }).lean();
				if (!isEmpty(data) && [data.authors, data.uploader].includes(user.id)) return next();
			}
		}
	}

	return res.status(401).json({
		status: 'error',
		message: 'Unauthorised to perform this action.',
	});
};

export { setup, signToken, camundaToken, checkIsInRole, whatIsRole, checkIsUser, checkAllowedToAccess };
