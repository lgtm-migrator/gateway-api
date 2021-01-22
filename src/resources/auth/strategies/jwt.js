import passport from 'passport';
import passportJWT from 'passport-jwt';
import { to } from 'await-to-js';
import { getUserById } from '../../user/user.repository';
import { signToken } from '../utils';

const JWTStrategy = passportJWT.Strategy;

const strategy = () => {
	const extractJWT = (req) => {
		// 1. Default extract jwt from request cookie
		let { cookies: { jwt = '' }} = req;
		if(!_.isEmpty(jwt)) {
			// 2. Return jwt if found in cookie
			return jwt;
		}
		// 2. Fallback/external integration extracts jwt from authorization header
		let { headers: { authorization = '' }} = req;
		// If token contains a type, strip it and return jwt
		jwt = authorization;
		return jwt;
	}

	const strategyOptions = {
		jwtFromRequest: extractJWT,
		secretOrKey: process.env.JWTSecret,
		passReqToCallback: true,
	};

	const verifyCallback = async (req, jwtPayload, cb) => {
		if (typeof jwtPayload.data === 'string') {
			jwtPayload.data = JSON.parse(jwtPayload.data);
		}
		const [err, user] = await to(getUserById(jwtPayload.data._id));

		if (err) {
			return cb(err);
		}
		req.user = user;
		return cb(null, user);
	};

	passport.use(new JWTStrategy(strategyOptions, verifyCallback));
};

const login = (req, user) => {
	return new Promise((resolve, reject) => {
		req.login(user, { session: false }, err => {
			if (err) {
				return reject(err);
			}

			return resolve(signToken(user));
		});
	});
};

export { strategy, login };
