import { DataRequestModel } from '../datarequest.model';
import constants from '../../utilities/constants.util';
import datarequestUtil from '../utils/datarequest.util';
import teamController from '../../team/team.controller';
import Controller from '../../base/controller';

import _ from 'lodash';

import { logger } from '../../utilities/logger';
const logCategory = 'Data Access Request';

export default class AmendmentController extends Controller {
	constructor(amendmentService) {
		super(amendmentService);
		this.amendmentService = amendmentService;
	}

	async setAmendment(req, res) {
		try {
			// 1. Get the required request params
			const {
				params: { id },
			} = req;
			let { questionId, questionSetId, mode, reason, answer } = req.body;
			if (_.isEmpty(questionId) || _.isEmpty(questionSetId)) {
				return res.status(400).json({
					success: false,
					message: 'You must supply the unique identifiers for the question requiring amendment',
				});
			}
			// 2. Retrieve DAR from database
			let accessRecord = await DataRequestModel.findOne({ _id: id }).populate([
				{
					path: 'datasets dataset',
				},
				{
					path: 'publisherObj',
					populate: {
						path: 'team',
						populate: {
							path: 'users',
						},
					},
				},
			]);
			if (!accessRecord) {
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}
			// 3. If application is not in review or submitted, amendments cannot be made
			if (
				accessRecord.applicationStatus !== constants.applicationStatuses.SUBMITTED &&
				accessRecord.applicationStatus !== constants.applicationStatuses.INREVIEW
			) {
				return res.status(400).json({
					success: false,
					message: 'This application is not within a reviewable state and amendments cannot be made or requested at this time.',
				});
			}
			// 4. Get the requesting users permission levels
			let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(accessRecord.toObject(), req.user.id, req.user._id);
			// 5. Get the current iteration amendment party
			let validParty = false;
			let activeParty = this.amendmentService.getAmendmentIterationParty(accessRecord);
			// 6. Add/remove/revert amendment depending on mode
			if (authorised) {
				switch (mode) {
					case constants.amendmentModes.ADDED:
						authorised = userType === constants.userTypes.CUSTODIAN;
						validParty = activeParty === constants.userTypes.CUSTODIAN;
						if (!authorised || !validParty) {
							break;
						}
						this.amendmentService.addAmendment(accessRecord, questionId, questionSetId, answer, reason, req.user, true);
						break;
					case constants.amendmentModes.REMOVED:
						authorised = userType === constants.userTypes.CUSTODIAN;
						validParty = activeParty === constants.userTypes.CUSTODIAN;
						if (!authorised || !validParty) {
							break;
						}
						this.amendmentService.removeAmendment(accessRecord, questionId);
						break;
					case constants.amendmentModes.REVERTED:
						authorised = userType === constants.userTypes.APPLICANT;
						validParty = activeParty === constants.userTypes.APPLICANT;
						if (!authorised || !validParty) {
							break;
						}
						this.amendmentService.revertAmendmentAnswer(accessRecord, questionId, req.user);
						break;
				}
			}
			// 7. Return unauthorised message if the user did not have sufficient access for action requested
			if (!authorised) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}
			// 8. Return bad request if the opposite party is editing the application
			if (!validParty) {
				return res.status(400).json({
					status: 'failure',
					message: 'You cannot make or request amendments to this application as the opposite party are currently responsible for it.',
				});
			}
			// 9. Save changes to database
			await accessRecord.save(async err => {
				if (err) {
					console.error(err.message);
					return res.status(500).json({ status: 'error', message: err.message });
				} else {
					// 10. Update json schema and question answers with modifications since original submission
					let accessRecordObj = accessRecord.toObject();
					accessRecordObj = this.amendmentService.injectAmendments(accessRecordObj, userType, req.user);
					// 11. Append question actions depending on user type and application status
					let userRole = activeParty === constants.userTypes.CUSTODIAN ? constants.roleTypes.MANAGER : '';
					accessRecordObj.jsonSchema = datarequestUtil.injectQuestionActions(
						accessRecordObj.jsonSchema,
						userType,
						accessRecordObj.applicationStatus,
						userRole,
						activeParty
					);
					// 12. Count the number of answered/unanswered amendments
					const { answeredAmendments = 0, unansweredAmendments = 0 } = this.amendmentService.countUnsubmittedAmendments(accessRecord, userType);
					return res.status(200).json({
						success: true,
						accessRecord: {
							amendmentIterations: accessRecordObj.amendmentIterations,
							questionAnswers: accessRecordObj.questionAnswers,
							jsonSchema: accessRecordObj.jsonSchema,
							answeredAmendments,
							unansweredAmendments,
						},
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
	}

	async requestAmendments(req, res) {
		try {
			// 1. Get the required request params
			const {
				params: { id },
			} = req;
			// 2. Retrieve DAR from database
			let accessRecord = await DataRequestModel.findOne({ _id: id })
				.select({
					_id: 1,
					publisher: 1,
					amendmentIterations: 1,
					datasetIds: 1,
					dataSetId: 1,
					userId: 1,
					authorIds: 1,
					applicationStatus: 1,
					aboutApplication: 1,
					dateSubmitted: 1,
				})
				.populate([
					{
						path: 'datasets dataset mainApplicant authors',
					},
					{
						path: 'publisherObj',
						select: '_id',
						populate: {
							path: 'team',
							populate: {
								path: 'users',
							},
						},
					},
				]);
			if (!accessRecord) {
				return res.status(404).json({ status: 'error', message: 'Application not found.' });
			}
			// 3. Check permissions of user is manager of associated team
			let authorised = false;
			if (_.has(accessRecord.toObject(), 'publisherObj.team')) {
				const { team } = accessRecord.publisherObj;
				authorised = teamController.checkTeamPermissions(constants.roleTypes.MANAGER, team.toObject(), req.user._id);
			}
			if (!authorised) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}
			// 4. Ensure single datasets are mapped correctly into array (backward compatibility for single dataset applications)
			if (_.isEmpty(accessRecord.datasets)) {
				accessRecord.datasets = [accessRecord.dataset];
			}
			// 5. Get the current iteration amendment party and return bad request if the opposite party is editing the application
			const activeParty = this.amendmentService.getAmendmentIterationParty(accessRecord);
			if (activeParty !== constants.userTypes.CUSTODIAN) {
				return res.status(400).json({
					status: 'failure',
					message: 'You cannot make or request amendments to this application as the applicant(s) are amending the current version.',
				});
			}
			// 6. Check some amendments exist to be submitted to the applicant(s)
			const { unansweredAmendments } = this.amendmentService.countUnsubmittedAmendments(accessRecord, constants.userTypes.CUSTODIAN);
			if (unansweredAmendments === 0) {
				return res.status(400).json({
					status: 'failure',
					message: 'You cannot submit requested amendments as none have been requested in the current version',
				});
			}
			// 7. Find current amendment iteration index
			const index = this.amendmentService.getLatestAmendmentIterationIndex(accessRecord);
			// 8. Update amendment iteration status to returned, handing responsibility over to the applicant(s)
			accessRecord.amendmentIterations[index].dateReturned = new Date();
			accessRecord.amendmentIterations[index].returnedBy = req.user._id;
			// 9. Save changes to database
			await accessRecord.save(async err => {
				if (err) {
					console.error(err.message);
					return res.status(500).json({ status: 'error', message: err.message });
				} else {
					// 10. Send update request notifications
					createNotifications(constants.notificationTypes.RETURNED, accessRecord);
					return res.status(200).json({
						success: true,
					});
				}
			});
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: 'An error occurred attempting to submit the requested updates',
			});
		}
	}
}
