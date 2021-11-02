import _ from 'lodash';
import { PublisherModel } from './publisher.model';
import { Data } from '../tool/data.model';
import { DataRequestModel } from '../datarequest/datarequest.model';
import { WorkflowModel } from '../workflow/workflow.model';
import constants from '../utilities/constants.util';
import teamController from '../team/team.controller';
import { PublisherService } from './publisher.service';
const datarequestController = require('../datarequest/datarequest.controller');

const getDataRequestsById = async (id) => { 

};

module.exports = {
	// GET api/v1/publishers/:id
	getPublisherById: async (req, res) => {
		try {
			// 1. Get the publisher from the database
			const publisher = await PublisherModel.findOne({ name: req.params.id });
			if (!publisher) {
				return res.status(200).json({
					success: true,
					publisher: { dataRequestModalContent: {}, allowsMessaging: false },
				});
			}
			// 2. Return publisher
			return res.status(200).json({ success: true, publisher });
		} catch (err) {
			console.error(err.message);
			return res.status(500).json(err.message);
		}
	},

	// GET api/v1/publishers/:id/datasets
	getPublisherDatasets: async (req, res) => {
		try {
			// 1. Get the datasets for the publisher from the database
			let datasets = await Data.find({
				type: 'dataset',
				activeflag: 'active',
				'datasetfields.publisher': req.params.id,
			})
				.populate('publisher')
				.select('datasetid name description datasetfields.abstract _id datasetfields.publisher datasetfields.contactPoint publisher');
			if (!datasets) {
				return res.status(404).json({ success: false });
			}
			// 2. Map datasets to flatten datasetfields nested object
			datasets = datasets.map(dataset => {
				let {
					_id,
					datasetid: datasetId,
					name,
					description,
					publisher: publisherObj,
					datasetfields: { abstract, publisher, contactPoint },
				} = dataset;
				return {
					_id,
					datasetId,
					name,
					description,
					abstract,
					publisher,
					publisherObj,
					contactPoint,
				};
			});
			// 3. Return publisher datasets
			return res.status(200).json({ success: true, datasets });
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: 'An error occurred searching for custodian datasets',
			});
		}
	},

	// GET api/v1/publishers/team/:team/dataaccessrequests
	getDataAccessRequestsByPublisherName: async (req, res) => {
		const publisher = getPublisherById(req.params.publisher); // change the name
		
		const publisherService = new PublisherService();
		return publisherService.getDataRequestsByPublisherId(publisher._id, req.user, res);
	},

	// GET api/v1/publishers/:id/dataaccessrequests
	getDataAccessRequestsByPublisherId: async (req, res) => {
		const publisherService = new PublisherService();
		return publisherService.getDataRequestsByPublisherId(req.params.id, req.user, res);
	},

	// GET api/v1/publishers/:id/workflows
	getPublisherWorkflows: async (req, res) => {
		try {
			// 1. Get the workflow from the database including the team members to check authorisation
			let workflows = await WorkflowModel.find({
				publisher: req.params.id,
			}).populate([
				{
					path: 'publisher',
					select: 'team',
					populate: {
						path: 'team',
						select: 'members -_id',
					},
				},
				{
					path: 'steps.reviewers',
					model: 'User',
					select: '_id id firstname lastname',
				},
				{
					path: 'applications',
					select: 'aboutApplication',
					match: { applicationStatus: 'inReview' },
				},
			]);
			if (_.isEmpty(workflows)) {
				return res.status(200).json({ success: true, workflows: [] });
			}
			// 2. Check the requesting user is a member of the team
			let { _id: userId } = req.user;
			let authorised = teamController.checkTeamPermissions(constants.roleTypes.MANAGER, workflows[0].publisher.team.toObject(), userId);
			// 3. If not return unauthorised
			if (!authorised) {
				return res.status(401).json({ success: false });
			}
			// 4. Build workflows
			workflows = workflows.map(workflow => {
				let { active, _id, id, workflowName, version, steps, applications = [] } = workflow.toObject();

				let formattedSteps = [...steps].reduce((arr, item) => {
					let step = {
						...item,
						displaySections: [...item.sections].map(section => constants.darPanelMapper[section]),
					};
					arr.push(step);
					return arr;
				}, []);

				applications = applications.map(app => {
					let { aboutApplication = {}, _id } = app;
					let { projectName = 'No project name' } = aboutApplication;
					return { projectName, _id };
				});
				let canDelete = applications.length === 0,
					canEdit = applications.length === 0;
				return {
					active,
					_id,
					id,
					workflowName,
					version,
					steps: formattedSteps,
					applications,
					appCount: applications.length,
					canDelete,
					canEdit,
				};
			});
			// 5. Return payload
			return res.status(200).json({ success: true, workflows });
		} catch (err) {
			console.error(err.message);
			return res.status(500).json({
				success: false,
				message: 'An error occurred searching for custodian workflows',
			});
		}
	},
};
