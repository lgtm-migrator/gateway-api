import express from 'express';
import { Data } from '../tool/data.model';
import { utils } from '../auth';
import passport from 'passport';
import { ROLES } from '../user/user.roles';
import { getAllTools } from '../tool/data.repository';
import { UserModel } from '../user/user.model';
import mailchimpConnector from '../../services/mailchimp/mailchimp';
import constants from '../utilities/constants.util';
import helper from '../utilities/helper.util';
import { isEmpty, isNil } from 'lodash';
const urlValidator = require('../utilities/urlValidator');
const inputSanitizer = require('../utilities/inputSanitizer');

const router = express.Router();

router.post('/', passport.authenticate('jwt'), utils.checkIsInRole(ROLES.Admin, ROLES.Creator), async (req, res) => {
	const { firstname, lastname, bio, terms, sector, organisation, showOrganisation, tags } = req.body;
	let link = urlValidator.validateURL(inputSanitizer.removeNonBreakingSpaces(req.body.link));
	let orcid = req.body.orcid !== '' ? urlValidator.validateOrcidURL(inputSanitizer.removeNonBreakingSpaces(req.body.orcid)) : '';
	let data = Data();
	data.id = parseInt(Math.random().toString().replace('0.', ''));
	(data.firstname = inputSanitizer.removeNonBreakingSpaces(firstname)),
		(data.lastname = inputSanitizer.removeNonBreakingSpaces(lastname)),
		(data.type = 'person');
	data.bio = inputSanitizer.removeNonBreakingSpaces(bio);
	data.link = link;
	data.orcid = orcid;
	data.terms = terms;
	data.sector = inputSanitizer.removeNonBreakingSpaces(sector);
	data.organisation = inputSanitizer.removeNonBreakingSpaces(organisation);
	data.showOrganisation = showOrganisation;
	data.tags = inputSanitizer.removeNonBreakingSpaces(tags);
	let newPersonObj = await data.save();
	if (!newPersonObj) return res.json({ success: false, error: "Can't persist data to DB" });

	return res.json({ success: true, data: newPersonObj });
});

router.put('/', passport.authenticate('jwt'), utils.checkIsInRole(ROLES.Admin, ROLES.Creator), async (req, res) => {
	let {
		id,
		firstname,
		lastname,
		email,
		bio,
		showBio,
		showLink,
		showOrcid,
		feedback,
		news,
		terms,
		sector,
		showSector,
		organisation,
		showOrganisation,
		tags,
		showDomain,
		profileComplete,
	} = req.body;
	const type = 'person';
	let link = urlValidator.validateURL(inputSanitizer.removeNonBreakingSpaces(req.body.link));
	let orcid = req.body.orcid !== '' ? urlValidator.validateOrcidURL(inputSanitizer.removeNonBreakingSpaces(req.body.orcid)) : '';
	(firstname = inputSanitizer.removeNonBreakingSpaces(firstname)),
		(lastname = inputSanitizer.removeNonBreakingSpaces(lastname)),
		(bio = inputSanitizer.removeNonBreakingSpaces(bio));
	sector = inputSanitizer.removeNonBreakingSpaces(sector);
	organisation = inputSanitizer.removeNonBreakingSpaces(organisation);
	tags.topics = inputSanitizer.removeNonBreakingSpaces(tags.topics);

	const userId = parseInt(id);
	const { news: newsOriginalValue, feedback: feedbackOriginalValue } = await UserModel.findOne({ id: userId }, 'news feedback').lean();
	const newsDirty = newsOriginalValue !== news && !isNil(news);
	const feedbackDirty = feedbackOriginalValue !== feedback && !isNil(feedback);

	await Data.findOneAndUpdate(
		{ id: userId },
		{
			firstname,
			lastname,
			type,
			bio,
			showBio,
			link,
			showLink,
			orcid,
			showOrcid,
			terms,
			sector,
			showSector,
			organisation,
			showOrganisation,
			tags,
			showDomain,
			profileComplete,
		}
	);

	if (newsDirty) {
		const newsSubscriptionId = process.env.MAILCHIMP_NEWS_AUDIENCE_ID;
		const newsStatus = news ? constants.mailchimpSubscriptionStatuses.SUBSCRIBED : constants.mailchimpSubscriptionStatuses.UNSUBSCRIBED;
		await mailchimpConnector.updateSubscriptionUsers(newsSubscriptionId, [req.user], newsStatus);
	}
	if (feedbackDirty) {
		const feedbackSubscriptionId = process.env.MAILCHIMP_FEEDBACK_AUDIENCE_ID;
		const feedbackStatus = feedback
			? constants.mailchimpSubscriptionStatuses.SUBSCRIBED
			: constants.mailchimpSubscriptionStatuses.UNSUBSCRIBED;
		await mailchimpConnector.updateSubscriptionUsers(feedbackSubscriptionId, [req.user], feedbackStatus);
	}

	await UserModel.findOneAndUpdate({ id: userId }, { $set: { firstname, lastname, email, feedback, news } })
		.then(person => {
			return res.json({ success: true, data: person });
		})
		.catch(err => {
			return res.json({ success: false, error: err });
		});
});

// @router   GET /api/v1/person/unsubscribe/:userObjectId
// @desc     Unsubscribe a single user from email notifications without challenging authentication
// @access   Public
// router.put('/unsubscribe/:userObjectId', async (req, res) => {
// 	const userId = req.params.userObjectId;
// 	// 1. Use _id param issued by MongoDb as unique reference to find user entry
// 	await UserModel.findOne({ _id: userId })
// 		.then(async user => {
// 			// 2. Find person entry using numeric id and update email notifications to false
// 			await Data.findOneAndUpdate(
// 				{ id: user.id },
// 				{
// 					emailNotifications: false,
// 				}
// 			).then(() => {
// 				// 3a. Return success message
// 				return res.json({
// 					success: true,
// 					msg: "You've been successfully unsubscribed from all emails. You can change this setting via your account.",
// 				});
// 			});
// 		})
// 		.catch(() => {
// 			// 3b. Return generic failure message in all cases without disclosing reason or data structure
// 			return res.status(500).send({ success: false, msg: 'A problem occurred unsubscribing from email notifications.' });
// 		});
// });

// @router   PATCH /api/v1/person/profileComplete/:id
// @desc     Set profileComplete to true
// @access   Private
router.patch('/profileComplete/:id', passport.authenticate('jwt'), async (req, res) => {
	const id = req.params.id;
	await Data.findOneAndUpdate({ id }, { profileComplete: true })
		.then(response => {
			return res.json({ success: true, response });
		})
		.catch(err => {
			return res.json({ success: false, error: err.message });
		});
});

// @router   GET /api/v1/person/:id
// @desc     Get person info based on personID
router.get('/:id', async (req, res) => {
	if (req.params.id === 'null') {
		return res.json({ data: null });
	}
	let person = await Data.findOne({ id: parseInt(req.params.id) })
		.populate([{ path: 'tools' }, { path: 'reviews' }])
		.catch(err => {
			return res.json({ success: false, error: err });
		});

	if (isEmpty(person)) {
		return res.status(404).send(`Person not found for Id: ${escape(req.params.id)}`);
	} else {
		person = helper.hidePrivateProfileDetails([person])[0];
		return res.json({ person });
	}
});

// @router   GET /api/v1/person/profile/:id
// @desc     Get person info for their account
router.get('/profile/:id', async (req, res) => {
	try {
		let person = await Data.findOne({ id: parseInt(req.params.id) })
			.populate([{ path: 'tools' }, { path: 'reviews' }, { path: 'user', select: 'feedback news' }])
			.lean();
		const { feedback, news } = person.user;
		person = { ...person, feedback, news };
		let data = [person];
		return res.json({ success: true, data: data });
	} catch (err) {
		console.error(err.message);
		return res.json({ success: false, error: err.message });
	}
});

// @router   GET /api/v1/person
// @desc     Get paper for an author
// @access   Private
router.get('/', async (req, res) => {
	let personArray = [];
	req.params.type = 'person';
	await getAllTools(req)
		.then(data => {
			data.map(personObj => {
				personArray.push({
					id: personObj.id,
					type: personObj.type,
					firstname: personObj.firstname,
					lastname: personObj.lastname,
					bio: personObj.bio,
					sociallinks: personObj.sociallinks,
					company: personObj.company,
					link: personObj.link,
					orcid: personObj.orcid,
					activeflag: personObj.activeflag,
					createdAt: personObj.createdAt,
					updatedAt: personObj.updatedAt,
					__v: personObj.__v,
					emailNotifications: personObj.emailNotifications,
					terms: personObj.terms,
					counter: personObj.counter,
					sector: personObj.sector,
					organisation: personObj.organisation,
					showOrganisation: personObj.showOrganisation,
				});
			});
			return res.json({ success: true, data: personArray });
		})
		.catch(err => {
			return res.json({ success: false, err });
		});
});

module.exports = router;
