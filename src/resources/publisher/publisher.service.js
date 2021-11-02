import _ from 'lodash';
import { PublisherModel } from './publisher.model';
import teamController from '../team/team.controller';
import constants from '../utilities/constants.util';
import { Data } from '../tool/data.model';
import { DataRequestModel } from '../datarequest/datarequest.model';
const datarequestController = require('../datarequest/datarequest.controller');

export class PublisherService {

    /**
     *
     *
     * @param {*} publisherId 
     * @param {*} user 
     * @returns 
     */
    getDataRequestsByPublisherId = async (publisherId, user, res) => {
        try {
			// 1. Deconstruct the request
			let { _id } = user;

			// 2. Lookup publisher team
			const publisher = await PublisherModel.findOne({ name: publisherId }).populate('team', 'members').lean();
			if (!publisher) {
				return res.status(404).json({ success: false });
			}
			// 3. Check the requesting user is a member of the custodian team
			let found = false;
			if (_.has(publisher, 'team.members')) {
				let { members } = publisher.team;
				found = members.some(el => el.memberid.toString() === _id.toString());
			}

			if (!found) return res.status(401).json({ status: 'failure', message: 'Unauthorised' });

			//Check if current use is a manager
			let isManager = teamController.checkTeamPermissions(constants.roleTypes.MANAGER, publisher.team, _id);

			let applicationStatus = ['inProgress'];
			//If the current user is not a manager then push 'Submitted' into the applicationStatus array
			if (!isManager) {
				applicationStatus.push('submitted');
			}
			// 4. Find all datasets owned by the publisher (no linkage between DAR and publisher in historic data)
			let datasetIds = await Data.find({
				type: 'dataset',
				'datasetfields.publisher': publisherId,
			}).distinct('datasetid');
			// 5. Find all applications where any datasetId exists
			let applications = await DataRequestModel.find({
				$and: [
					{
						$or: [{ dataSetId: { $in: datasetIds } }, { datasetIds: { $elemMatch: { $in: datasetIds } } }],
					},
					{ applicationStatus: { $nin: applicationStatus } },
				],
			})
				.select('-jsonSchema -files')
				.sort({ updatedAt: -1 })
				.populate([
					{
						path: 'datasets dataset mainApplicant',
					},
					{
						path: 'publisherObj',
						populate: {
							path: 'team',
							populate: {
								path: 'users',
								select: 'firstname lastname',
							},
						},
					},
					{
						path: 'workflow.steps.reviewers',
						select: 'firstname lastname',
					},
				])
				.lean();

			if (!isManager) {
				applications = applications.filter(app => {
					let { workflow = {} } = app;
					if (_.isEmpty(workflow)) {
						return app;
					}

					let { steps = [] } = workflow;
					if (_.isEmpty(steps)) {
						return app;
					}

					let activeStepIndex = _.findIndex(steps, function (step) {
						return step.active === true;
					});

					let elapsedSteps = [...steps].slice(0, activeStepIndex + 1);
					let found = elapsedSteps.some(step => step.reviewers.some(reviewer => reviewer._id.equals(_id)));

					if (found) {
						return app;
					}
				});
			}

			// 6. Append projectName and applicants
			let modifiedApplications = [...applications]
				.map(app => {
					return datarequestController.createApplicationDTO(app, constants.userTypes.CUSTODIAN, _id.toString());
				})
				.sort((a, b) => b.updatedAt - a.updatedAt);

			let avgDecisionTime = datarequestController.calculateAvgDecisionTime(applications);
			// 7. Return all applications
			return res.status(200).json({ success: true, data: modifiedApplications, avgDecisionTime, canViewSubmitted: isManager });
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: 'An error occurred searching for custodian applications',
			});
		}
    }        
 }