import _ from 'lodash';

import { AmendmentModel } from './amendment.model';
import constants from '../../utilities/constants.util';
import helperUtil from '../../utilities/helper.util';
import datarequestUtil from '../utils/datarequest.util';
import notificationBuilder from '../../utilities/notificationBuilder';
import emailGenerator from '../../utilities/emailGenerator.util';

export default class AmendmentService {
	constructor(amendmentRepository) {
		this.amendmentRepository = amendmentRepository;
	}

	addAmendment(accessRecord, questionId, questionSetId, answer, reason, user, requested) {
		// 1. Create new amendment object with key representing the questionId
		let amendment = {
			[`${questionId}`]: new AmendmentModel({
				questionSetId,
				requested,
				reason,
				answer,
				requestedBy: requested ? `${user.firstname} ${user.lastname}` : undefined,
				requestedByUser: requested ? user._id : undefined,
				dateRequested: requested ? Date.now() : undefined,
				updatedBy: requested ? undefined : `${user.firstname} ${user.lastname}`,
				updatedByUser: requested ? undefined : user._id,
				dateUpdated: requested ? undefined : Date.now(),
			}),
		};
		// 2. Find the index of the latest amendment iteration of the DAR
		let index = this.getLatestAmendmentIterationIndex(accessRecord);
		// 3. If index is not -1, we need to append the new amendment to existing iteration object otherwise create a new one
		if (index !== -1) {
			accessRecord.amendmentIterations[index].questionAnswers = {
				...accessRecord.amendmentIterations[index].questionAnswers,
				...amendment,
			};
		} else {
			// 4. If new iteration has been trigger by applicant given requested is false, then we automatically return the iteration
			let amendmentIteration = {
				dateReturned: requested ? undefined : Date.now(),
				returnedBy: requested ? undefined : user._id,
				dateCreated: Date.now(),
				createdBy: user._id,
				questionAnswers: { ...amendment },
			};
			accessRecord.amendmentIterations = [...accessRecord.amendmentIterations, amendmentIteration];
		}
	}

	updateAmendment(accessRecord, questionId, answer, user) {
		// 1. Locate amendment in current iteration
		const currentIterationIndex = this.getLatestAmendmentIterationIndex(accessRecord);
		// 2. Return unmoodified record if invalid update
		if (currentIterationIndex === -1 || _.isNil(accessRecord.amendmentIterations[currentIterationIndex].questionAnswers[questionId])) {
			return accessRecord;
		}
		// 3. Check if the update amendment reflects a change since the last version of the answer
		if (currentIterationIndex > -1) {
			const latestAnswer = this.getLatestQuestionAnswer(accessRecord, questionId);
			const requested = accessRecord.amendmentIterations[currentIterationIndex].questionAnswers[questionId].requested || false;
			if (!_.isNil(latestAnswer)) {
				if (answer === latestAnswer || helperUtil.arraysEqual(answer, latestAnswer)) {
					if (requested) {
						// Retain the requested amendment but remove the answer
						delete accessRecord.amendmentIterations[currentIterationIndex].questionAnswers[questionId].answer;
					} else {
						this.removeAmendment(accessRecord, questionId);
					}
					return accessRecord;
				}
			} else if (_.isNil(latestAnswer) && _.isEmpty(answer) && !requested) {
				// Remove the amendment if there was no previous answer and the latest update is empty
				this.removeAmendment(accessRecord, questionId);
				return accessRecord;
			}
		}
		// 4. Find and update the question with the new answer
		accessRecord.amendmentIterations[currentIterationIndex].questionAnswers[questionId] = {
			...accessRecord.amendmentIterations[currentIterationIndex].questionAnswers[questionId],
			answer,
			updatedBy: `${user.firstname} ${user.lastname}`,
			updatedByUser: user._id,
			dateUpdated: Date.now(),
		};
		// 5. Return updated access record
		return accessRecord;
	}

	removeAmendment(accessRecord, questionId) {
		// 1. Find the index of the latest amendment amendmentIteration of the DAR
		let index = this.getLatestAmendmentIterationIndex(accessRecord);
		// 2. Remove the key and associated object from the current iteration if it exists
		if (index !== -1) {
			accessRecord.amendmentIterations[index].questionAnswers = _.omit(accessRecord.amendmentIterations[index].questionAnswers, questionId);
			// 3. If question answers is now empty, remove the iteration
			_.remove(accessRecord.amendmentIterations, amendmentIteration => {
				return _.isEmpty(amendmentIteration.questionAnswers);
			});
		}
	}

	doesAmendmentExist(accessRecord, questionId) {
		// 1. Get current amendment iteration
		const latestIteration = this.getCurrentAmendmentIteration(accessRecord.amendmentIterations);
		if (_.isNil(latestIteration) || _.isNil(latestIteration.questionAnswers)) {
			return false;
		}
		// 2. Check if questionId has been added by Custodian for amendment
		return latestIteration.questionAnswers.hasOwnProperty(questionId);
	}

	handleApplicantAmendment(accessRecord, questionId, questionSetId, answer = '', user) {
		// 1. Check if an amendment already exists for the question
		let isExisting = this.doesAmendmentExist(accessRecord, questionId);
		// 2. Update existing
		if (isExisting) {
			accessRecord = this.updateAmendment(accessRecord, questionId, answer, user);
		} else {
			// 3. Get the latest/previous answer for this question for comparison to new answer
			const latestAnswer = this.getLatestQuestionAnswer(accessRecord, questionId);
			let performAdd = false;
			// 4. Always add the new amendment if there was no original answer
			if (_.isNil(latestAnswer)) {
				performAdd = true;
				// 5. If a previous answer exists, ensure it is different to the most recent answer before adding
			} else if (answer !== latestAnswer || !helperUtil.arraysEqual(answer, latestAnswer)) {
				performAdd = true;
			}

			if (performAdd) {
				// 6. Add new amendment otherwise
				this.addAmendment(accessRecord, questionId, questionSetId, answer, '', user, false);
			}
		}
		// 7. Update the amendment count
		let { unansweredAmendments = 0, answeredAmendments = 0 } = this.countAmendments(accessRecord, constants.userTypes.APPLICANT);
		accessRecord.unansweredAmendments = unansweredAmendments;
		accessRecord.answeredAmendments = answeredAmendments;
		accessRecord.dirtySchema = true;
		// 8. Return updated access record
		return accessRecord;
	}

	getLatestAmendmentIterationIndex(accessRecord) {
		// 1. Guard for incorrect type passed
		let { amendmentIterations = [] } = accessRecord;
		if (_.isEmpty(amendmentIterations)) {
			return -1;
		}
		// 2. Find the latest unsubmitted date created in the amendment iterations array
		let mostRecentDate = new Date(
			Math.max.apply(
				null,
				amendmentIterations.map(iteration => (_.isUndefined(iteration.dateSubmitted) ? new Date(iteration.dateCreated) : ''))
			)
		);
		// 3. Pull out the related object using a filter to find the object with the latest date
		return amendmentIterations.findIndex(iteration => {
			let date = new Date(iteration.dateCreated);
			return date.getTime() == mostRecentDate.getTime();
		});
	}

	getAmendmentIterationParty(accessRecord, versionIndex) {
		if (!versionIndex) {
			// 1. Look for an amendment iteration that is in flight
			//    An empty date submitted with populated date returned indicates that the current correction iteration is now with the applicants
			let index = accessRecord.amendmentIterations.findIndex(v => _.isUndefined(v.dateSubmitted) && !_.isUndefined(v.dateReturned));
			// 2. Deduce the user type from the current iteration state
			if (index === -1 && accessRecord.applicationStatus !== constants.applicationStatuses.INPROGRESS) {
				return constants.userTypes.CUSTODIAN;
			} else {
				return constants.userTypes.APPLICANT;
			}
		} else {
			return this.getAmendmentIterationPartyByVersion(accessRecord, versionIndex);
		}
	}

	getAmendmentIterationPartyByVersion(accessRecord, versionIndex) {
		// If a specific version has been requested, determine the last party active on that version
		//	An empty submission date with a valid return date (added by Custodians returning the form) indicates applicants are active
		const requestedAmendmentIteration = accessRecord.amendmentIterations[versionIndex];
		if (requestedAmendmentIteration === _.last(accessRecord.amendmentIterations)) {
			if (!requestedAmendmentIteration || (_.isUndefined(requestedAmendmentIteration.dateSubmitted) && !_.isUndefined(requestedAmendmentIteration.dateReturned))) {
				return constants.userTypes.APPLICANT;
			} else {
				return constants.userTypes.CUSTODIAN;
			}
		} else {
			// If a previous version has been requested, there is no active party
			return;
		}
	}

	getAmendmentIterationDetailsByVersion(accessRecord, minorVersion) {
		const { amendmentIterations = [] } = accessRecord;
		// Get amendment iteration index, initial version will be offset by 1 to find array index i.e. 1.0 = -1, 1.1 = 0, 1.2 = 1 etc.
		// versions beyond 1 will have matching offset to array index as 2.0 includes amendments on first submission i.e. 2.0 = 0, 2.1 = 1, 2.2 = 2 etc.
		//const versionIndex = majorVersion === 1 ? minorVersion - 1 : minorVersion;
		// If no minor version updates are requested,
		const versionIndex = minorVersion - 1;

		// Get active party for selected index
		const activeParty = this.getAmendmentIterationParty(accessRecord, versionIndex);

		// Check if selected version is latest
		const isLatestMinorVersion = amendmentIterations[versionIndex] === _.last(amendmentIterations) || isNaN(minorVersion);

		return { versionIndex, activeParty, isLatestMinorVersion };
	}

	filterAmendments(accessRecord = {}, userType, lastIterationIndex) {
		// 1. Guard for invalid access record
		if (_.isEmpty(accessRecord)) {
			return {};
		}
		let { amendmentIterations = [] } = accessRecord;

		// 2. Slice any superfluous amendment iterations if a previous version has been explicitly requested
		if (lastIterationIndex) {
			amendmentIterations = amendmentIterations.slice(0, lastIterationIndex + 1);
		}

		// 3. Extract all relevant iteration objects and answers based on the user type
		// Applicant should only see requested amendments that have been returned by the custodian
		if (userType === constants.userTypes.APPLICANT) {
			amendmentIterations = [...amendmentIterations].filter(iteration => {
				return !_.isUndefined(iteration.dateReturned);
			});
		} else if (userType === constants.userTypes.CUSTODIAN) {
			// Custodian should only see amendment answers that have been submitted by the applicants
			amendmentIterations = [...amendmentIterations].map(iteration => {
				if (_.isUndefined(iteration.dateSubmitted) && !_.isNil(iteration.questionAnswers)) {
					iteration = this.removeIterationAnswers(accessRecord, iteration);
				}
				return iteration;
			});
		}

		// 4. Return relevant iterations
		return amendmentIterations;
	}

	injectAmendments(accessRecord, userType, user, versionIndex, includeCompleted = true) {
		let latestIteration;

		// 1. Ensure minor versions exist and requested version index is valid
		if (accessRecord.amendmentIterations.length === 0 || versionIndex < -1) {
			return accessRecord;
		}

		// 2. If a specific version has not be requested, fetch the latest (last) amendment iteration to include all changes to date
		if (!versionIndex) {
			versionIndex = _.findLastIndex(accessRecord.amendmentIterations);
			latestIteration = accessRecord.amendmentIterations[versionIndex];
		} else {
			latestIteration = accessRecord.amendmentIterations[versionIndex + 1] || accessRecord.amendmentIterations[versionIndex];
		}

		// 3. Get requested updates for next version if it exists (must be created by custodians by requesting updates)
		const { dateReturned } = latestIteration;

		// 4. Applicants should see previous amendment iteration requests until current iteration has been returned with new requests
		if (
			(versionIndex > 0 && userType === constants.userTypes.APPLICANT && _.isNil(dateReturned)) ||
			(userType === constants.userTypes.CUSTODIAN && _.isNil(latestIteration.questionAnswers))
		) {
			latestIteration = accessRecord.amendmentIterations[versionIndex - 1];
		} else if (versionIndex === 0 && userType === constants.userTypes.APPLICANT && _.isNil(dateReturned)) {
			return accessRecord;
		}

		// 5. Update schema if there is a new iteration
		const { publisher = 'Custodian' } = accessRecord;
		if (!_.isNil(latestIteration)) {
			accessRecord.jsonSchema = this.formatSchema(accessRecord.jsonSchema, latestIteration, userType, user, publisher, includeCompleted);
		}

		// 6. Filter out amendments that have not yet been exposed to the opposite party
		const amendmentIterations = this.filterAmendments(accessRecord, userType, versionIndex);

		// 7. Update the question answers to reflect all the changes that have been made in later iterations
		accessRecord.questionAnswers = this.formatQuestionAnswers(accessRecord.questionAnswers, amendmentIterations);

		// 8. Return the updated access record
		return accessRecord;
	}

	formatSchema(jsonSchema, amendmentIteration, userType, user, publisher, includeCompleted = true) {
		const { questionAnswers = {}, dateSubmitted, dateReturned } = amendmentIteration;
		if (_.isEmpty(questionAnswers)) {
			return jsonSchema;
		}
		// Loop through each amendment
		for (let questionId in questionAnswers) {
			const { questionSetId, answer } = questionAnswers[questionId];
			// 1. Update parent/child navigation with flags for amendments
			const amendmentCompleted = _.isNil(answer) || !includeCompleted ? 'incomplete' : 'completed';
			const iterationStatus =
				!_.isNil(dateSubmitted) && includeCompleted ? 'submitted' : !_.isNil(dateReturned) ? 'returned' : 'inProgress';
			jsonSchema = this.injectNavigationAmendment(jsonSchema, questionSetId, userType, amendmentCompleted, iterationStatus);
			// 2. Update questions with alerts/actions
			jsonSchema = this.injectQuestionAmendment(
				jsonSchema,
				questionId,
				questionAnswers[questionId],
				userType,
				amendmentCompleted,
				iterationStatus,
				user,
				publisher,
				includeCompleted
			);
		}
		return jsonSchema;
	}

	injectQuestionAmendment(
		jsonSchema,
		questionId,
		amendment,
		userType,
		completed,
		iterationStatus,
		user,
		publisher,
		includeCompleted = true
	) {
		const { questionSetId } = amendment;
		// 1. Find question set containing question
		const qsIndex = jsonSchema.questionSets.findIndex(qs => qs.questionSetId === questionSetId);
		if (qsIndex === -1) {
			return jsonSchema;
		}
		let { questions } = jsonSchema.questionSets[qsIndex];
		// 2. Find question object
		let question = datarequestUtil.findQuestion(questions, questionId);
		if (_.isEmpty(question) || _.isNil(question.input)) {
			return jsonSchema;
		}
		// 3. Create question alert object to highlight amendment
		const questionAlert = datarequestUtil.buildQuestionAlert(
			userType,
			iterationStatus,
			completed,
			amendment,
			user,
			publisher,
			includeCompleted
		);
		// 4. Update question to contain amendment state
		const readOnly = userType === constants.userTypes.CUSTODIAN || iterationStatus === 'submitted' || !includeCompleted;
		question = datarequestUtil.setQuestionState(question, questionAlert, readOnly);
		// 5. Update jsonSchema with updated question
		jsonSchema.questionSets[qsIndex].questions = datarequestUtil.updateQuestion(questions, question);
		// 6. Return updated schema
		return jsonSchema;
	}

	injectNavigationAmendment(jsonSchema, questionSetId, userType, completed, iterationStatus) {
		// 1. Find question in schema
		const qpIndex = jsonSchema.questionPanels.findIndex(qp => qp.panelId === questionSetId);
		if (qpIndex === -1) {
			return jsonSchema;
		}
		const pageIndex = jsonSchema.pages.findIndex(page => page.pageId === jsonSchema.questionPanels[qpIndex].pageId);
		if (pageIndex === -1) {
			return jsonSchema;
		}
		// 2. Update child navigation item (panel)
		jsonSchema.questionPanels[qpIndex].flag = constants.navigationFlags[userType][iterationStatus][completed].status;
		// 3. Update parent navigation item (page)
		const { flag: pageFlag = '' } = jsonSchema.pages[pageIndex];
		if (pageFlag !== 'DANGER' && pageFlag !== 'WARNING') {
			jsonSchema.pages[pageIndex].flag = constants.navigationFlags[userType][iterationStatus][completed].status;
		}
		// 4. Return schema
		return jsonSchema;
	}

	getLatestQuestionAnswer(accessRecord, questionId) {
		// 1. Include original submission of question answer
		let parsedQuestionAnswers = _.cloneDeep(accessRecord.questionAnswers);
		let initialSubmission = {
			questionAnswers: {
				[`${questionId}`]: {
					answer: parsedQuestionAnswers[questionId],
					dateUpdated: accessRecord.dateSubmitted,
				},
			},
		};
		let relevantVersions = [initialSubmission, ...accessRecord.amendmentIterations];
		if (relevantVersions.length > 1) {
			relevantVersions = _.slice(relevantVersions, 0, relevantVersions.length - 1);
		}
		// 2. Reduce all versions to find latest instance of question answer
		const latestAnswers = relevantVersions.reduce((arr, version) => {
			// 3. Move to next version if the question was not modified in this one
			if (_.isNil(version.questionAnswers[questionId])) {
				return arr;
			}
			let { answer, dateUpdated } = version.questionAnswers[questionId];
			let foundIndex = arr.findIndex(amendment => amendment.questionId === questionId);
			// 4. If the amendment does not exist in our array of latest answers, add it
			if (foundIndex === -1) {
				arr.push({ questionId, answer, dateUpdated });
				// 5. Otherwise update the amendment if this amendment was made more recently
			} else if (new Date(dateUpdated).getTime() > new Date(arr[foundIndex].dateUpdated).getTime()) {
				arr[foundIndex] = { questionId, answer, dateUpdated };
			}
			return arr;
		}, []);

		if (_.isEmpty(latestAnswers)) {
			return undefined;
		} else {
			return latestAnswers[0].answer;
		}
	}

	formatQuestionAnswers(questionAnswers, amendmentIterations) {
		if (_.isNil(amendmentIterations) || _.isEmpty(amendmentIterations)) {
			return questionAnswers;
		}
		// 1. Reduce all amendment iterations to find latest answers
		const latestAnswers = amendmentIterations.reduce((arr, iteration) => {
			if (_.isNil(iteration.questionAnswers)) {
				return arr;
			}
			// 2. Loop through each amendment key per iteration
			Object.keys(iteration.questionAnswers).forEach(questionId => {
				let { answer, dateUpdated } = iteration.questionAnswers[questionId];
				let foundIndex = arr.findIndex(amendment => amendment.questionId === questionId);
				// 3. If the amendment does not exist in our array of latest answers, add it
				if (foundIndex === -1) {
					arr.push({ questionId, answer, dateUpdated });
					// 4. Otherwise update the amendment if this amendment was made more recently
				} else if (new Date(dateUpdated).getTime() > new Date(arr[foundIndex].dateUpdated).getTime()) {
					arr[foundIndex] = { questionId, answer, dateUpdated };
				}
			});
			return arr;
		}, []);
		// 5. Format data correctly for question answers
		const formattedLatestAnswers = [...latestAnswers].reduce((obj, item) => {
			if (!_.isNil(item.answer)) {
				obj[item.questionId] = item.answer;
			}
			return obj;
		}, {});
		// 6. Return combined object
		return { ...questionAnswers, ...formattedLatestAnswers };
	}

	getCurrentAmendmentIteration(amendmentIterations) {
		// 1. Guard for incorrect type passed
		if (_.isEmpty(amendmentIterations) || _.isNull(amendmentIterations) || _.isUndefined(amendmentIterations)) {
			return undefined;
		}
		// 2. Find the latest unsubmitted date created in the amendment iterations array
		let mostRecentDate = new Date(
			Math.max.apply(
				null,
				amendmentIterations.map(iteration => (_.isUndefined(iteration.dateSubmitted) ? new Date(iteration.dateCreated) : ''))
			)
		);
		// 3. Pull out the related object using a filter to find the object with the latest date
		let mostRecentObject = amendmentIterations.filter(iteration => {
			let date = new Date(iteration.dateCreated);
			return date.getTime() == mostRecentDate.getTime();
		})[0];
		// 4. Return the correct object
		return mostRecentObject;
	}

	removeIterationAnswers(accessRecord = {}, iteration) {
		// 1. Guard for invalid object passed
		if (!iteration || _.isEmpty(accessRecord)) {
			return undefined;
		}
		// 2. Loop through each question answer by key (questionId)
		Object.keys(iteration.questionAnswers).forEach(key => {
			// 3. Fetch the previous answer
			iteration.questionAnswers[key]['answer'] = this.getLatestQuestionAnswer(accessRecord, key);
		});
		// 4. Return answer stripped iteration object
		return iteration;
	}

	doResubmission(accessRecord, userId) {
		// 1. Find latest iteration and if not found, return access record unmodified as no resubmission should take place
		let index = this.getLatestAmendmentIterationIndex(accessRecord);
		if (index === -1) {
			return accessRecord;
		}
		// 2. Mark submission type as a resubmission later used to determine notification generation
		accessRecord.applicationType = constants.submissionTypes.RESUBMISSION;
		accessRecord.submitAmendmentIteration(index, userId);
		// 3. Return updated access record for saving
		return accessRecord;
	}

	countAmendments(accessRecord, userType, isLatestVersion = true) {
		// 1. Find either latest iteration to count amendments from
		const index = this.getLatestAmendmentIterationIndex(accessRecord);
		let unansweredAmendments = 0;
		let answeredAmendments = 0;
		
		if (
			!isLatestVersion || index === -1 ||
			_.isNil(accessRecord.amendmentIterations[index].questionAnswers) ||
			(_.isNil(accessRecord.amendmentIterations[index].dateReturned) && userType == constants.userTypes.APPLICANT)
		) {
			return { unansweredAmendments: 0, answeredAmendments: 0 };
		}
		// 2. Count answered and unanswered amendments in unsubmitted iteration
		Object.keys(accessRecord.amendmentIterations[index].questionAnswers).forEach(questionId => {
			if (_.isNil(accessRecord.amendmentIterations[index].questionAnswers[questionId].answer)) {
				unansweredAmendments++;
			} else {
				answeredAmendments++;
			}
		});
		// 3. Return counts
		return { unansweredAmendments, answeredAmendments };
	}

	revertAmendmentAnswer(accessRecord, questionId, user) {
		// 1. Locate the latest amendment iteration
		let index = this.getLatestAmendmentIterationIndex(accessRecord);
		// 2. Verify the amendment was previously requested and a new answer exists
		let amendment = accessRecord.amendmentIterations[index].questionAnswers[questionId];
		if (_.isNil(amendment) || _.isNil(amendment.answer)) {
			return;
		} else {
			// 3. Remove the updated answer
			amendment = {
				[`${questionId}`]: new AmendmentModel({
					...amendment,
					updatedBy: undefined,
					updatedByUser: undefined,
					dateUpdated: undefined,
					answer: undefined,
				}),
			};
			accessRecord.amendmentIterations[index].questionAnswers = {
				...accessRecord.amendmentIterations[index].questionAnswers,
				...amendment,
			};
		}
	}

	calculateAmendmentStatus(accessRecord, userType) {
		let amendmentStatus = '';
		const lastAmendmentIteration = _.last(accessRecord.amendmentIterations);
		const { applicationStatus } = accessRecord;
		// 1. Amendment status is blank if no amendments have ever been created or the application has had a final decision
		if (
			_.isNil(lastAmendmentIteration) ||
			applicationStatus === constants.applicationStatuses.APPROVED ||
			applicationStatus === constants.applicationStatuses.APPROVEDWITHCONDITIONS ||
			applicationStatus === constants.applicationStatuses.REJECTED
		) {
			return '';
		}
		const { dateSubmitted = '', dateReturned = '' } = lastAmendmentIteration;
		// 2a. If the requesting user is the applicant
		if (userType === constants.userTypes.APPLICANT) {
			if (!_.isEmpty(dateSubmitted.toString())) {
				amendmentStatus = constants.amendmentStatuses.UPDATESSUBMITTED;
			} else if (!_.isEmpty(dateReturned.toString())) {
				amendmentStatus = constants.amendmentStatuses.UPDATESREQUESTED;
			}
			// 2b. If the requester user is the custodian
		} else if (userType === constants.userTypes.CUSTODIAN) {
			if (!_.isEmpty(dateSubmitted.toString())) {
				amendmentStatus = constants.amendmentStatuses.UPDATESRECEIVED;
			} else if (!_.isEmpty(dateReturned.toString())) {
				amendmentStatus = constants.amendmentStatuses.AWAITINGUPDATES;
			}
		}
		return amendmentStatus;
	}

	async createNotifications(type, accessRecord) {
		// Project details from about application
		let { aboutApplication = {}, questionAnswers } = accessRecord;
		let { projectName = 'No project name set' } = aboutApplication;
		let { dateSubmitted = '' } = accessRecord;
		// Publisher details from single dataset
		let {
			datasetfields: { publisher },
		} = accessRecord.datasets[0];
		// Dataset titles
		let datasetTitles = accessRecord.datasets.map(dataset => dataset.name).join(', ');
		// Main applicant (user obj)
		let { firstname: appFirstName, lastname: appLastName } = accessRecord.mainApplicant;
		// Instantiate default params
		let emailRecipients = [],
			options = {},
			html = '',
			authors = [];
		let applicants = datarequestUtil.extractApplicantNames(questionAnswers).join(', ');
		// Fall back for single applicant
		if (_.isEmpty(applicants)) {
			applicants = `${appFirstName} ${appLastName}`;
		}
		// Get authors/contributors (user obj)
		if (!_.isEmpty(accessRecord.authors)) {
			authors = accessRecord.authors.map(author => {
				let { firstname, lastname, email, id } = author;
				return { firstname, lastname, email, id };
			});
		}

		switch (type) {
			case constants.notificationTypes.RETURNED:
				// 1. Create notifications
				// Applicant notification
				await notificationBuilder.triggerNotificationMessage(
					[accessRecord.userId],
					`Updates have been requested by ${publisher} for your Data Access Request application`,
					'data access request',
					accessRecord._id
				);

				// Authors notification
				if (!_.isEmpty(authors)) {
					await notificationBuilder.triggerNotificationMessage(
						authors.map(author => author.id),
						`Updates have been requested by ${publisher} for a Data Access Request application you are contributing to`,
						'data access request',
						accessRecord._id
					);
				}

				// 2. Send emails to relevant users
				emailRecipients = [accessRecord.mainApplicant, ...accessRecord.authors];
				// Create object to pass through email data
				options = {
					id: accessRecord._id,
					publisher,
					projectName,
					datasetTitles,
					dateSubmitted,
					applicants,
				};
				// Create email body content
				html = emailGenerator.generateDARReturnedEmail(options);
				// Send email
				await emailGenerator.sendEmail(
					emailRecipients,
					constants.hdrukEmail,
					`Updates have been requested by ${publisher} for your Data Access Request application`,
					html,
					false
				);
				break;
		}
	}
}
