import { DataRequestModel } from '../datarequest.model';
import { AmendmentModel } from './amendment.model';
import constants from '../../utilities/constants.util';
import _ from 'lodash';
import { json } from 'body-parser';

const teamController = require('../../team/team.controller');

//POST api/v1/data-access-request/:id/amendments
const setAmendment = async (req, res) => {
	try {
		// 1. Get the required request params
		const {
			params: { id },
		} = req;
		let { _id: userId } = req.user;
		let { questionId = '', questionSetId = '', mode = '', reason = '' } = req.body;
		if (_.isEmpty(questionId) || _.isEmpty(questionSetId)) {
			return res.status(400).json({
				success: false,
				message:
					'You must supply the unique identifiers for the question requiring amendment',
			});
		}
		// 2. Retrieve DAR from database
		let accessRecord = await DataRequestModel.findOne({ _id: id })
			.select('publisher amendmentIterations')
			.populate({
				path: 'publisherObj',
				select: '_id',
				populate: {
					path: 'team',
				},
			});
		if (!accessRecord) {
			return res
				.status(404)
				.json({ status: 'error', message: 'Application not found.' });
		}
		// 3. Check permissions of user is manager of associated team
		let authorised = false;
		let {
			publisherObj: { team },
		} = accessRecord;
		authorised = teamController.checkTeamPermissions(
			constants.roleTypes.REVIEWER,
			team.toObject(),
			userId
		);

		// 4. Refuse access if not authorised
		if (!authorised) {
			return res
				.status(401)
				.json({ status: 'failure', message: 'Unauthorised' });
		}
		// 5. Ensure the current iteration is not being modified by applicants
		if (
			getAmendmentIterationParty(accessRecord) ===
			constants.userTypes.APPLICANT
		) {
			return res
				.status(400)
				.json({
					status: 'failure',
					message:
						'You cannot request amendments to this application as it has already been returned for correction.',
				});
		}

		// 6. Add or remove amendment depending on mode
		switch (mode) {
			case constants.amendmentModes.ADDED:
				addAmendment(accessRecord, questionId, questionSetId, reason, req.user);
				break;
			case constants.amendmentModes.REMOVED:
				removeAmendment(accessRecord, questionId);
				break;
		}
		// 7. Save changes to database
		await accessRecord.save(async (err) => {
			if (err) {
				console.error(err);
				res.status(500).json({ status: 'error', message: err });
			} else {
				return res.status(200).json({
					success: true,
				});
			}
		});
	} catch (err) {
		console.error(err.message);
		return res.status(500).json({
			success: false,
			message: 'An error occurred updating the application amendment',
		});
	}
};

const addAmendment = (accessRecord, questionId, questionSetId, reason, user) => {
	// 1. Create new amendment object with key representing the questionId
	let amendment = {
		[`${questionId}`]: new AmendmentModel({
			questionSetId,
			requested: true,
			reason,
			requestedBy: `${user.firstname} ${user.lastname}`,
			requestedByUser: user._id,
			dateRequested: Date.now(),
		}),
	};
	// 2. Find the index of the latest amendment iteration of the DAR
	let index = getLatestAmendmentIteration(accessRecord);
	// 3. If index is not -1, we need to append the new amendment to existing iteration object otherwise create a new one
	if (index !== -1) {
		accessRecord.amendmentIterations[index].questionAnswers = {
			...accessRecord.amendmentIterations[index].questionAnswers,
			...amendment,
		};
	} else {
		let amendmentIteration = {
			dateCreated: Date.now(),
			createdBy: user._id,
			questionAnswers: { ...amendment },
		};
		accessRecord.amendmentIterations = [
			...accessRecord.amendmentIterations,
			amendmentIteration,
		];
	}
};

const removeAmendment = (accessRecord, questionId) => {
	// 1. Find the index of the latest amendment amendmentIteration of the DAR
	let index = getLatestAmendmentIteration(accessRecord);
	// 2. Remove the key and associated object from the current iteration if it exists
	if (index !== -1) {
		accessRecord.amendmentIterations[index].questionAnswers = _.omit(
			accessRecord.amendmentIterations[index].questionAnswers,
			questionId
		);
	}
};

const getLatestAmendmentIteration = (accessRecord) => {
	// 1. Find and return index of latest amendment amendmentIteration that has not been returned to applicants
	let index = -1;
	if (!_.isUndefined(accessRecord.amendmentIterations)) {
		index = accessRecord.amendmentIterations.findIndex((v) =>
			_.isUndefined(v.dateReturned)
		);
	}
	return index;
};

const getAmendmentIterationParty = (accessRecord) => {
	// 1. Look for an amendment iteration that is in flight
	//    An empty date submitted with populated date returned indicates that the current correction iteration is now with the applicants
	let index = accessRecord.amendmentIterations.findIndex(
		(v) => _.isUndefined(v.dateSubmitted) && !_.isUndefined(v.dateReturned)
	);
	// 2. Deduce the user type from the current iteration state
	if (index === -1) {
		return constants.userTypes.CUSTODIAN;
	} else {
		return constants.userTypes.APPLICANT;
	}
};

const injectAmendments = (accessRecord, userType) => {
	// 1. Extract all revelant iteration objects and answers based on the user type
	let amendmentIterations = [...accessRecord.amendmentIterations];
	// Applicant should only see requested amendments that have been returned by the custodian
	if(userType = constants.userTypes.APPLICANT) {
		amendmentIterations = amendmentIterations.filter((iteration) => {
			return !_.isUndefined(iteration.dateReturned);
		});
	} else if (userType = constants.userTypes.CUSTODIAN) {
		// Custodian should only see amendment answers that have been submitted by the applicants
		amendmentIterations = amendmentIterations.map((iteration) => {
			if(_.isUndefined(iteration.dateSubmitted)) {
				iteration = removeAmendmentAnswers(iteration);
			}
			return iteration;
		});
	}
	// 2. Update the question answers to reflect all the changes that have been made in later iterations
	accessRecord.questionAnswers = formatQuestionAnswers(JSON.parse(accessRecord.questionAnswers), amendmentIterations);
	// 3. Add amendment requests from latest iteration and append historic responses
	accessRecord.jsonSchema = formatSchema(JSON.parse(accessRecord.jsonSchema), amendmentIterations);
	// 4. Return the updated access record
	return accessRecord;
};



const formatSchema = (jsonSchema, amendmentIterations) => {
	// 1. Add history for all questions in previous iterations
	// TODO for versioning
	// 2. Get latest iteration to add amendment requests
	const latestIteration = getLatestAmendmentIteration(amendmentIterations);
	// 3. Loop through each key in the iteration to append review indicator
	


	return jsonSchema;
};

const formatQuestionAnswers = (questionAnswers, amendmentIterations) => {

	return questionAnswers;
};

const getLatestAmendmentIteration = (amendmentIterations) => {
	// 1. Find the latest date created in the amendment iterations array
	let mostRecentDate = new Date(Math.max.apply(null, amendmentIterations.map(iteration => {
		return new Date(iteration.dateCreated);
	 })));
	 // 2. Pull out the related object using a filter to find the object with the latest date
	 let mostRecentObject = amendmentIterations.filter(iteration => { 
		 let date = new Date(iteration.dateCreated); 
		 return date.getTime() == mostRecentDate.getTime();
	 })[0];
	 // 3. Return the correct object
	return mostRecentObject;
}

const removeAmendmentAnswers = (iteration) => {
	// 1. Loop through each question answer by key (questionId)
	Object.keys(iteration.questionAnswers).forEach((key) => {
		// 2. If the key has an answer, remove it
		if(key.includes(answer)) {
			delete iteration.questionAnswers[key].answer;
		}
	});
	// 3. Return answer stripped iteration object
	return iteration;
};

export default {
	setAmendment: setAmendment,
	addAmendment: addAmendment,
	removeAmendment: removeAmendment,
	getLatestAmendmentIteration: getLatestAmendmentIteration,
	getAmendmentIterationParty: getAmendmentIterationParty,
	injectAmendments: injectAmendments
};
