import * as Sentry from '@sentry/node';
import constants from './constants.util';

const logRequestMiddleware = options => {
	return (req, res, next) => {
		const { logCategory, action } = options;
		logger.logUserActivity(req.user, logCategory, constants.logTypes.USER, { action });
		next();
	};
};

const logSystemActivity = options => {
	const { category = 'Action not categorised', action = 'Action not described' } = options;
	Sentry.addBreadcrumb({
		category,
		message: action,
		level: Sentry.Severity.Info,
	});
	// Save to database
};

const logUserActivity = (user, category, type, context) => {
	const { action } = context;
	Sentry.addBreadcrumb({
		category,
		message: action,
		level: Sentry.Severity.Info,
	});
	console.log(`${action}`);
	// Log date/time
	// Log action
	// Log if user was logged in
	// Log userId and _id
	// Save to database
};

const logError = (err, category) => {
	Sentry.captureException(err, {
		tags: {
			area: category,
		},
	});
	console.error(`The following error occurred: ${err.message}`);
};

export const logger = {
	logRequestMiddleware,
	logSystemActivity,
	logUserActivity,
	logError,
};
