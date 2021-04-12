import { Data } from '../tool/data.model';
import { PublisherModel } from '../publisher/publisher.model';
import { filtersService } from '../filters/dependency';
import notificationBuilder from '../utilities/notificationBuilder';
import emailGenerator from '../utilities/emailGenerator.util';
import { v4 as uuidv4 } from 'uuid';
import _, { forEach } from 'lodash';
import axios from 'axios';
import FormData from 'form-data';
import Ajv from 'ajv';
import moment from 'moment';
var fs = require('fs');

import constants from '../utilities/constants.util';

module.exports = {
	//GET api/v1/dataset-onboarding
	getDatasetsByPublisher: async (req, res) => {
		try {
			let {
				params: { publisherID },
			} = req;

			if (!publisherID) return res.status(404).json({ status: 'error', message: 'Publisher ID could not be found.' });

			let datasetIds = [];

			if (publisherID === 'admin') {
				// get all datasets in review for admin
				datasetIds = await Data.find({ activeflag: 'inReview' }).sort({ 'timestamps.submitted': -1 });
			} else {
				// get all pids for publisherID
				datasetIds = await Data.find({
					$and: [
						{ 'datasetv2.summary.publisher.identifier': publisherID },
						{
							$or: [{ activeflag: 'active' }, { activeflag: 'inReview' }, { activeflag: 'draft' }, { activeflag: 'rejected' }],
						},
					],
				})
					.sort({ 'timestamps.updated': -1 })
					.distinct('pid');
			}

			let listOfDatasets = [];
			for (const datasetId of datasetIds) {
				let datasetDetails = await Data.findOne({
					pid: datasetId,
				})
					.sort({ 'timestamps.updated': -1 })
					.lean();

				let datasetVersions = await Data.find(
					{
						pid: datasetId,
					},
					{
						_id: 1,
						datasetVersion: 1,
						activeflag: 1,
					}
				)
					.sort({ 'timestamps.created': -1 })
					.lean();

				datasetDetails.listOfVersions = datasetVersions;
				listOfDatasets.push(datasetDetails);
			}

			return res.status(200).json({
				success: true,
				data: { listOfDatasets },
			});
		} catch (err) {
			console.log(err.message);
			res.status(500).json({ status: 'error', message: err.message });
		}
	},

	//GET api/v1/dataset-onboarding/:id
	getDatasetVersion: async (req, res) => {
		try {
			const id = req.params.id || null;

			if (!id) return res.status(404).json({ status: 'error', message: 'Dataset pid could not be found.' });

			let dataset = await Data.findOne({ _id: id });
			if (dataset.questionAnswers) {
				dataset.questionAnswers = JSON.parse(dataset.questionAnswers);
			} else {
				//if no questionAnswers then populate from MDC
				dataset.questionAnswers = module.exports.populateQuestionAnswers(dataset);
				await Data.findOneAndUpdate({ _id: id }, { questionAnswers: JSON.stringify(dataset.questionAnswers) });
			}

			if (!dataset.structuralMetadata) {
				//if no structuralMetadata then populate from MDC
				dataset.structuralMetadata = module.exports.populateStructuralMetadata(dataset);
				await Data.findOneAndUpdate({ _id: id }, { structuralMetadata: dataset.structuralMetadata });
			}

			let listOfDatasets = await Data.find({ pid: dataset.pid }, { _id: 1, datasetVersion: 1, activeflag: 1 }).sort({
				'timestamps.created': -1,
			});

			return res.status(200).json({
				success: true,
				data: { dataset },
				listOfDatasets,
			});
		} catch (err) {
			console.log(err.message);
			res.status(500).json({ status: 'error', message: err.message });
		}
	},

	populateQuestionAnswers: dataset => {
		let questionAnswers = {};

		//Summary
		if (!_.isNil(dataset.datasetv2.summary.title) && !_.isEmpty(dataset.datasetv2.summary.title))
			questionAnswers['summary/title'] = dataset.datasetv2.summary.title;
		if (_.isNil(questionAnswers['summary/title'])) questionAnswers['summary/title'] = dataset.name;
		if (!_.isNil(dataset.datasetv2.summary.abstract) && !_.isEmpty(dataset.datasetv2.summary.abstract))
			questionAnswers['summary/abstract'] = dataset.datasetv2.summary.abstract;
		if (!_.isNil(dataset.datasetv2.summary.contactPoint) && !_.isEmpty(dataset.datasetv2.summary.contactPoint))
			questionAnswers['summary/contactPoint'] = dataset.datasetv2.summary.contactPoint;
		if (!_.isNil(dataset.datasetv2.summary.keywords) && !_.isEmpty(dataset.datasetv2.summary.keywords))
			questionAnswers['summary/keywords'] = module.exports.returnAsArray(dataset.datasetv2.summary.keywords);
		if (!_.isNil(dataset.datasetv2.summary.alternateIdentifiers) && !_.isEmpty(dataset.datasetv2.summary.alternateIdentifiers))
			questionAnswers['summary/alternateIdentifiers'] = dataset.datasetv2.summary.alternateIdentifiers;
		if (!_.isNil(dataset.datasetv2.summary.doiName) && !_.isEmpty(dataset.datasetv2.summary.doiName))
			questionAnswers['summary/doiName'] = dataset.datasetv2.summary.doiName;
		//Documentation
		if (!_.isNil(dataset.datasetv2.documentation.description) && !_.isEmpty(dataset.datasetv2.documentation.description))
			questionAnswers['properties/documentation/description'] = dataset.datasetv2.documentation.description;
		if (!_.isNil(dataset.datasetv2.documentation.associatedMedia) && !_.isEmpty(dataset.datasetv2.documentation.associatedMedia))
			questionAnswers['properties/documentation/associatedMedia'] = module.exports.returnAsArray(
				dataset.datasetv2.documentation.associatedMedia
			);
		if (!_.isNil(dataset.datasetv2.documentation.isPartOf) && !_.isEmpty(dataset.datasetv2.documentation.isPartOf))
			questionAnswers['properties/documentation/isPartOf'] = dataset.datasetv2.documentation.isPartOf;
		//Coverage
		if (!_.isNil(dataset.datasetv2.coverage.spatial) && !_.isEmpty(dataset.datasetv2.coverage.spatial))
			questionAnswers['properties/coverage/spatial'] = dataset.datasetv2.coverage.spatial;
		if (!_.isNil(dataset.datasetv2.coverage.typicalAgeRange) && !_.isEmpty(dataset.datasetv2.coverage.typicalAgeRange))
			questionAnswers['properties/coverage/typicalAgeRange'] = dataset.datasetv2.coverage.typicalAgeRange;
		if (
			!_.isNil(dataset.datasetv2.coverage.physicalSampleAvailability) &&
			!_.isEmpty(dataset.datasetv2.coverage.physicalSampleAvailability)
		)
			questionAnswers['properties/coverage/physicalSampleAvailability'] = module.exports.returnAsArray(
				dataset.datasetv2.coverage.physicalSampleAvailability
			);
		if (!_.isNil(dataset.datasetv2.coverage.followup) && !_.isEmpty(dataset.datasetv2.coverage.followup))
			questionAnswers['properties/coverage/followup'] = dataset.datasetv2.coverage.followup;
		if (!_.isNil(dataset.datasetv2.coverage.pathway) && !_.isEmpty(dataset.datasetv2.coverage.pathway))
			questionAnswers['properties/coverage/pathway'] = dataset.datasetv2.coverage.pathway;
		//Provenance
		//Origin
		if (!_.isNil(dataset.datasetv2.provenance.origin.purpose) && !_.isEmpty(dataset.datasetv2.provenance.origin.purpose))
			questionAnswers['properties/provenance/origin/purpose'] = module.exports.returnAsArray(dataset.datasetv2.provenance.origin.purpose);
		if (!_.isNil(dataset.datasetv2.provenance.origin.source) && !_.isEmpty(dataset.datasetv2.provenance.origin.source))
			questionAnswers['properties/provenance/origin/source'] = module.exports.returnAsArray(dataset.datasetv2.provenance.origin.source);
		if (
			!_.isNil(dataset.datasetv2.provenance.origin.collectionSituation) &&
			!_.isEmpty(dataset.datasetv2.provenance.origin.collectionSituation)
		)
			questionAnswers['properties/provenance/origin/collectionSituation'] = module.exports.returnAsArray(
				dataset.datasetv2.provenance.origin.collectionSituation
			);
		//Temporal
		if (
			!_.isNil(dataset.datasetv2.provenance.temporal.accrualPeriodicity) &&
			!_.isEmpty(dataset.datasetv2.provenance.temporal.accrualPeriodicity)
		)
			questionAnswers['properties/provenance/temporal/accrualPeriodicity'] = dataset.datasetv2.provenance.temporal.accrualPeriodicity;
		if (
			!_.isNil(dataset.datasetv2.provenance.temporal.distributionReleaseDate) &&
			!_.isEmpty(dataset.datasetv2.provenance.temporal.distributionReleaseDate)
		)
			questionAnswers['properties/provenance/temporal/distributionReleaseDate'] = module.exports.returnAsDate(
				dataset.datasetv2.provenance.temporal.distributionReleaseDate
			);
		if (!_.isNil(dataset.datasetv2.provenance.temporal.startDate) && !_.isEmpty(dataset.datasetv2.provenance.temporal.startDate))
			questionAnswers['properties/provenance/temporal/startDate'] = module.exports.returnAsDate(
				dataset.datasetv2.provenance.temporal.startDate
			);
		if (!_.isNil(dataset.datasetv2.provenance.temporal.endDate) && !_.isEmpty(dataset.datasetv2.provenance.temporal.endDate))
			questionAnswers['properties/provenance/temporal/endDate'] = module.exports.returnAsDate(
				dataset.datasetv2.provenance.temporal.endDate
			);
		if (!_.isNil(dataset.datasetv2.provenance.temporal.timeLag) && !_.isEmpty(dataset.datasetv2.provenance.temporal.timeLag))
			questionAnswers['properties/provenance/temporal/timeLag'] = dataset.datasetv2.provenance.temporal.timeLag;
		//Accessibility
		//Usage
		if (
			!_.isNil(dataset.datasetv2.accessibility.usage.dataUseLimitation) &&
			!_.isEmpty(dataset.datasetv2.accessibility.usage.dataUseLimitation)
		)
			questionAnswers['properties/accessibility/usage/dataUseLimitation'] = module.exports.returnAsArray(
				dataset.datasetv2.accessibility.usage.dataUseLimitation
			);
		if (
			!_.isNil(dataset.datasetv2.accessibility.usage.dataUseRequirements) &&
			!_.isEmpty(dataset.datasetv2.accessibility.usage.dataUseRequirements)
		)
			questionAnswers['properties/accessibility/usage/dataUseRequirements'] = module.exports.returnAsArray(
				dataset.datasetv2.accessibility.usage.dataUseRequirements
			);
		if (
			!_.isNil(dataset.datasetv2.accessibility.usage.resourceCreator) &&
			!_.isEmpty(dataset.datasetv2.accessibility.usage.resourceCreator)
		)
			questionAnswers['properties/accessibility/usage/resourceCreator'] = module.exports.returnAsArray(
				dataset.datasetv2.accessibility.usage.resourceCreator
			);
		if (!_.isNil(dataset.datasetv2.accessibility.usage.investigations) && !_.isEmpty(dataset.datasetv2.accessibility.usage.investigations))
			questionAnswers['properties/accessibility/usage/investigations'] = module.exports.returnAsArray(
				dataset.datasetv2.accessibility.usage.investigations
			);
		if (!_.isNil(dataset.datasetv2.accessibility.usage.isReferencedBy) && !_.isEmpty(dataset.datasetv2.accessibility.usage.isReferencedBy))
			questionAnswers['properties/accessibility/usage/isReferencedBy'] = module.exports.returnAsArray(
				dataset.datasetv2.accessibility.usage.isReferencedBy
			);
		//Access
		if (!_.isNil(dataset.datasetv2.accessibility.access.accessRights) && !_.isEmpty(dataset.datasetv2.accessibility.access.accessRights))
			questionAnswers['properties/accessibility/access/accessRights'] = module.exports.returnAsArray(
				dataset.datasetv2.accessibility.access.accessRights
			);
		if (!_.isNil(dataset.datasetv2.accessibility.access.accessService) && !_.isEmpty(dataset.datasetv2.accessibility.access.accessService))
			questionAnswers['properties/accessibility/access/accessService'] = dataset.datasetv2.accessibility.access.accessService;
		if (
			!_.isNil(dataset.datasetv2.accessibility.access.accessRequestCost) &&
			!_.isEmpty(dataset.datasetv2.accessibility.access.accessRequestCost)
		)
			questionAnswers['properties/accessibility/access/accessRequestCost'] = module.exports.returnAsArray(
				dataset.datasetv2.accessibility.access.accessRequestCost
			);
		if (
			!_.isNil(dataset.datasetv2.accessibility.access.deliveryLeadTime) &&
			!_.isEmpty(dataset.datasetv2.accessibility.access.deliveryLeadTime)
		)
			questionAnswers['properties/accessibility/access/deliveryLeadTime'] = dataset.datasetv2.accessibility.access.deliveryLeadTime;
		if (!_.isNil(dataset.datasetv2.accessibility.access.jurisdiction) && !_.isEmpty(dataset.datasetv2.accessibility.access.jurisdiction))
			questionAnswers['properties/accessibility/access/jurisdiction'] = module.exports.returnAsArray(
				dataset.datasetv2.accessibility.access.jurisdiction
			);
		if (!_.isNil(dataset.datasetv2.accessibility.access.dataProcessor) && !_.isEmpty(dataset.datasetv2.accessibility.access.dataProcessor))
			questionAnswers['properties/accessibility/access/dataProcessor'] = dataset.datasetv2.accessibility.access.dataProcessor;
		if (
			!_.isNil(dataset.datasetv2.accessibility.access.dataController) &&
			!_.isEmpty(dataset.datasetv2.accessibility.access.dataController)
		)
			questionAnswers['properties/accessibility/access/dataController'] = dataset.datasetv2.accessibility.access.dataController;
		//FormatAndStandards
		if (
			!_.isNil(dataset.datasetv2.accessibility.formatAndStandards.vocabularyEncodingScheme) &&
			!_.isEmpty(dataset.datasetv2.accessibility.formatAndStandards.vocabularyEncodingScheme)
		)
			questionAnswers['properties/accessibility/formatAndStandards/vocabularyEncodingScheme'] = module.exports.returnAsArray(
				dataset.datasetv2.accessibility.formatAndStandards.vocabularyEncodingScheme
			);
		if (
			!_.isNil(dataset.datasetv2.accessibility.formatAndStandards.conformsTo) &&
			!_.isEmpty(dataset.datasetv2.accessibility.formatAndStandards.conformsTo)
		)
			questionAnswers['properties/accessibility/formatAndStandards/conformsTo'] = module.exports.returnAsArray(
				dataset.datasetv2.accessibility.formatAndStandards.conformsTo
			);
		if (
			!_.isNil(dataset.datasetv2.accessibility.formatAndStandards.language) &&
			!_.isEmpty(dataset.datasetv2.accessibility.formatAndStandards.language)
		)
			questionAnswers['properties/accessibility/formatAndStandards/language'] = module.exports.returnAsArray(
				dataset.datasetv2.accessibility.formatAndStandards.language
			);
		if (
			!_.isNil(dataset.datasetv2.accessibility.formatAndStandards.format) &&
			!_.isEmpty(dataset.datasetv2.accessibility.formatAndStandards.format)
		)
			questionAnswers['properties/accessibility/formatAndStandards/format'] = module.exports.returnAsArray(
				dataset.datasetv2.accessibility.formatAndStandards.format
			);
		//EnrichmentAndLinkage
		if (
			!_.isNil(dataset.datasetv2.enrichmentAndLinkage.qualifiedRelation) &&
			!_.isEmpty(dataset.datasetv2.enrichmentAndLinkage.qualifiedRelation)
		)
			questionAnswers['properties/enrichmentAndLinkage/qualifiedRelation'] = module.exports.returnAsArray(
				dataset.datasetv2.enrichmentAndLinkage.qualifiedRelation
			);
		if (!_.isNil(dataset.datasetv2.enrichmentAndLinkage.derivation) && !_.isEmpty(dataset.datasetv2.enrichmentAndLinkage.derivation))
			questionAnswers['properties/enrichmentAndLinkage/derivation'] = module.exports.returnAsArray(
				dataset.datasetv2.enrichmentAndLinkage.derivation
			);
		if (!_.isNil(dataset.datasetv2.enrichmentAndLinkage.tools) && !_.isEmpty(dataset.datasetv2.enrichmentAndLinkage.tools))
			questionAnswers['properties/enrichmentAndLinkage/tools'] = module.exports.returnAsArray(dataset.datasetv2.enrichmentAndLinkage.tools);
		//Observations
		if (!_.isNil(dataset.datasetv2.observations.observations) && !_.isEmpty(dataset.datasetv2.observations.observations))
			questionAnswers['properties/observations/observations'] = dataset.datasetv2.observations.observations;

		return questionAnswers;
	},

	returnAsArray: value => {
		if (typeof value === 'string') return [value];
		return value;
	},

	returnAsDate: value => {
		return moment(new Date(value)).format('DD/MM/YYYY');
	},

	populateStructuralMetadata: dataset => {
		let structuralMetadata = [];

		for (const dataClass of dataset.datasetfields.technicaldetails) {
			for (const dataElement of dataClass.elements) {
				structuralMetadata.push({
					tableName: dataClass.label,
					tableDescription: dataClass.description,
					columnName: dataElement.label,
					columnDescription: dataElement.description,
					dataType: dataElement.dataType.label,
					sensitive: '',
				});
			}
		}

		return structuralMetadata;
	},

	//POST api/v1/dataset-onboarding
	createNewDatasetVersion: async (req, res) => {
		try {
			const publisherID = req.body.publisherID || null;
			const pid = req.body.pid || null;
			const currentVersionId = req.body.currentVersionId || null;

			//If no publisher then return error
			if (!publisherID) return res.status(404).json({ status: 'error', message: 'Dataset publisher could not be found.' });

			const publisherData = await PublisherModel.find({ _id: publisherID }).lean();
			let publisherObject = {
				summary: {
					publisher: {
						identifier: publisherID,
						name: publisherData[0].publisherDetails.name,
						memberOf: publisherData[0].publisherDetails.memberOf,
					},
				},
			};

			//If publisher but no pid then new dataset - create new pid and version is 1.0.0
			if (!pid) {
				let uuid = '';
				while (uuid === '') {
					uuid = uuidv4();
					if ((await Data.find({ pid: uuid }).length) === 0) uuid = '';
				}

				let uniqueID = '';
				while (uniqueID === '') {
					uniqueID = parseInt(Math.random().toString().replace('0.', ''));
					if ((await Data.find({ id: uniqueID }).length) === 0) uniqueID = '';
				}

				let data = new Data();
				data.pid = uuid;
				data.datasetVersion = '1.0.0';
				data.id = uniqueID;
				data.datasetid = 'New dataset';
				data.name = `New dataset ${moment(Date.now()).format('D MMM YYYY HH:mm')}`;
				data.datasetv2 = publisherObject;
				data.type = 'dataset';
				data.activeflag = 'draft';
				data.source = 'HDRUK MDC';
				data.is5Safes = publisherData[0].allowAccessRequestManagement;
				data.timestamps.created = Date.now();
				data.timestamps.updated = Date.now();
				data.questionAnswers = JSON.stringify({ 'summary/title': `New dataset ${moment(Date.now()).format('D MMM YYYY HH:mm')}` });
				await data.save();

				return res.status(200).json({ success: true, data: { id: data._id } });
			} else {
				//check does a version already exist with the pid that is in draft
				let isDraftDataset = await Data.findOne({ pid, activeflag: 'draft' }, { _id: 1 });

				if (!_.isNil(isDraftDataset)) {
					//if yes then return with error
					return res.status(200).json({ success: true, data: { id: isDraftDataset._id, draftExists: true } });
				}

				//else create new version of currentVersionId and send back new id
				let datasetToCopy = await Data.findOne({ _id: currentVersionId });

				if (_.isNil(datasetToCopy)) {
					return res.status(404).json({ status: 'error', message: 'Dataset to copy is not found' });
				}

				//create new uniqueID
				let uniqueID = '';
				while (uniqueID === '') {
					uniqueID = parseInt(Math.random().toString().replace('0.', ''));
					if ((await Data.find({ id: uniqueID }).length) === 0) uniqueID = '';
				}

				//incremenet the dataset version
				let newVersion = module.exports.incrementVersion([1, 0, 0], datasetToCopy.datasetVersion);

				let data = new Data();
				data.pid = pid;
				data.datasetVersion = newVersion;
				data.id = uniqueID;
				data.datasetid = 'New dataset version';
				data.name = datasetToCopy.name;
				data.datasetv2 = publisherObject;
				data.type = 'dataset';
				data.activeflag = 'draft';
				data.source = 'HDRUK MDC';
				data.is5Safes = publisherData[0].allowAccessRequestManagement;
				data.questionAnswers = datasetToCopy.questionAnswers;
				data.structuralMetadata = datasetToCopy.structuralMetadata;
				data.percentageCompleted = datasetToCopy.percentageCompleted;
				data.timestamps.created = Date.now();
				data.timestamps.updated = Date.now();
				await data.save();

				return res.status(200).json({ success: true, data: { id: data._id } });
			}
		} catch (err) {
			console.log(err.message);
			res.status(500).json({ status: 'error', message: err.message });
		}
	},

	incrementVersion: (masks, version) => {
		if (typeof masks === 'string') {
			version = masks;
			masks = [0, 0, 0];
		}

		let bitMap = ['major', 'minor', 'patch'];
		let bumpAt = 'patch';
		let oldVer = version.match(/\d+/g);

		for (let i = 0; i < masks.length; ++i) {
			if (masks[i] === 1) {
				bumpAt = bitMap[i];
				break;
			}
		}

		let bumpIdx = bitMap.indexOf(bumpAt);
		let newVersion = [];
		for (let i = 0; i < oldVer.length; ++i) {
			if (i < bumpIdx) {
				newVersion[i] = +oldVer[i];
			} else if (i === bumpIdx) {
				newVersion[i] = +oldVer[i] + 1;
			} else {
				newVersion[i] = 0;
			}
		}

		return newVersion.join('.');
	},

	//PATCH api/v1/dataset-onboarding/:id
	updateDatasetVersionDataElement: async (req, res) => {
		try {
			// 1. Id is the _id object in mongoo.db not the generated id or dataset Id
			const {
				params: { id },
				body: data,
			} = req;
			// 2. Destructure body and update only specific fields by building a segregated non-user specified update object
			let updateObj = module.exports.buildUpdateObject({
				...data,
				user: req.user,
			});
			// 3. Find data request by _id to determine current status
			let dataset = await Data.findOne({ _id: id });
			// 4. Check access record
			if (!dataset) {
				return res.status(404).json({ status: 'error', message: 'Dataset not found.' });
			}
			// 5. Update record object
			if (_.isEmpty(updateObj)) {
				if (data.key !== 'structuralMetadata') {
					return res.status(404).json({ status: 'error', message: 'Update failed' });
				} else {
					let structuralMetadata = JSON.parse(data.rows);

					if (_.isEmpty(structuralMetadata)) {
						return res.status(404).json({ status: 'error', message: 'Update failed' });
					} else {
						Data.findByIdAndUpdate(
							{ _id: id },
							{ structuralMetadata, percentageCompleted: data.percentageCompleted, 'timestamps.updated': Date.now() },
							{ new: true },
							err => {
								if (err) {
									console.error(err);
									throw err;
								}
							}
						);

						return res.status(200).json();
					}
				}
			} else {
				module.exports.updateApplication(dataset, updateObj).then(dataset => {
					const { unansweredAmendments = 0, answeredAmendments = 0, dirtySchema = false } = dataset;
					if (dirtySchema) {
						accessRequestRecord.jsonSchema = JSON.parse(accessRequestRecord.jsonSchema);
						accessRequestRecord = amendmentController.injectAmendments(accessRequestRecord, constants.userTypes.APPLICANT, req.user);
					}
					let data = {
						status: 'success',
						unansweredAmendments,
						answeredAmendments,
					};
					if (dirtySchema) {
						data = {
							...data,
							jsonSchema: accessRequestRecord.jsonSchema,
						};
					}

					if (updateObj.updatedQuestionId === 'summary/title') {
						let questionAnswers = JSON.parse(updateObj.questionAnswers);
						let title = questionAnswers['summary/title'];

						if (title.length >= 2) {
							Data.findByIdAndUpdate({ _id: id }, { name: title, 'timestamps.updated': Date.now() }, { new: true }, err => {
								if (err) {
									console.error(err);
									throw err;
								}
							});
							data.name = title;
						}
					}

					// 6. Return new data object
					return res.status(200).json(data);
				});
			}
		} catch (err) {
			console.log(err.message);
			res.status(500).json({ status: 'error', message: err.message });
		}
	},

	//POST api/v1/dataset-onboarding/:id
	submitDatasetVersion: async (req, res) => {
		try {
			// 1. id is the _id object in mongoo.db not the generated id or dataset Id
			const id = req.params.id || null;

			if (!id) return res.status(404).json({ status: 'error', message: 'Dataset _id could not be found.' });

			// 3. Check user type and authentication to submit application
			/* let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(accessRecord, req.user.id, req.user._id);
            if (!authorised) {
                return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
            } */

			//update dataset to inreview - constants.datatsetStatuses.INREVIEW

			let updatedDataset = await Data.findOneAndUpdate(
				{ _id: id },
				{ activeflag: constants.datatsetStatuses.INREVIEW, 'timestamps.updated': Date.now(), 'timestamps.submitted': Date.now() }
			);

			/* , err => {
				if (err) return res.send(err);
				return res.json({ success: true });
			}); */

			//emails / notifications
			/* await module.exports.createNotifications(
				accessRecord.submissionType === constants.submissionTypes.INITIAL
					? constants.notificationTypes.SUBMITTED
					: constants.notificationTypes.RESUBMITTED,
				{},
				accessRecord,
				req.user
			); */

			return res.status(200).json({ status: 'success' });

			//Below here is once a dataset has been approved

			//"id": "5bf09bf5-3464-4e2d-99b3-c8f39344fff4" HQIP

			/* {
                "label":"Pauls Dataset 2",
                "folder":"5bf09bf5-3464-4e2d-99b3-c8f39344fff4",
                "type": "Data Asset"
            } */

			//2. update MDC with v2 entries of data

			//3. finalise entry in MDC and input data into DB

			//http://localhost:3000/dataset-onboarding/5ffdbb1247b6f529a72be3e0
			/* const metadataQualityCall = axios
            .get('https://modelcatalogue.cs.ox.ac.uk/hdruk-preprod/api/authentication/isValidSession', { timeout: 5000 })
            .catch(err => {
                console.log('Unable to get session - ' + err.message);
            });
        
            // 2. Find the relevant data request application
            /*let accessRecord = await DataRequestModel.findOne({ _id: id }).populate([
                {
                    path: 'datasets dataset',
                    populate: {
                        path: 'publisher',
                        populate: {
                            path: 'team',
                            populate: {
                                path: 'users',
                                populate: {
                                    path: 'additionalInfo',
                                },
                            },
                        },
                    },
                },
                {
                    path: 'mainApplicant authors',
                    populate: {
                        path: 'additionalInfo',
                    },
                },
                {
                    path: 'publisherObj',
                },
            ]);
            if (!accessRecord) {
                return res.status(404).json({ status: 'error', message: 'Application not found.' });
            }
            // 3. Check user type and authentication to submit application
            let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(accessRecord, req.user.id, req.user._id);
            if (!authorised) {
                return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
            }
            // 4. Ensure single datasets are mapped correctly into array (backward compatibility for single dataset applications)
            if (_.isEmpty(accessRecord.datasets)) {
                accessRecord.datasets = [accessRecord.dataset];
            }
            // 5. Perform either initial submission or resubmission depending on application status
            if (accessRecord.applicationStatus === constants.applicationStatuses.INPROGRESS) {
                accessRecord = module.exports.doInitialSubmission(accessRecord);
            } else if (
                accessRecord.applicationStatus === constants.applicationStatuses.INREVIEW ||
                accessRecord.applicationStatus === constants.applicationStatuses.SUBMITTED
            ) {
                accessRecord = amendmentController.doResubmission(accessRecord.toObject(), req.user._id.toString());
            }
            // 6. Ensure a valid submission is taking place
            if (_.isNil(accessRecord.submissionType)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Application cannot be submitted as it has reached a final decision status.',
                });
            }
            // 7. Save changes to db
            await DataRequestModel.replaceOne({ _id: id }, accessRecord, async err => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'An error occurred saving the changes',
                    });
                } else {
                    // 8. Send notifications and emails with amendments
                    accessRecord.questionAnswers = JSON.parse(accessRecord.questionAnswers);
                    accessRecord.jsonSchema = JSON.parse(accessRecord.jsonSchema);
                    accessRecord = amendmentController.injectAmendments(accessRecord, userType, req.user);
                    await module.exports.createNotifications(
                        accessRecord.submissionType === constants.submissionTypes.INITIAL
                            ? constants.notificationTypes.SUBMITTED
                            : constants.notificationTypes.RESUBMITTED,
                        {},
                        accessRecord,
                        req.user
                    );
                    // 8. Start workflow process in Camunda if publisher requires it and it is the first submission
                    if (accessRecord.workflowEnabled && accessRecord.submissionType === constants.submissionTypes.INITIAL) {
                        let {
                            publisherObj: { name: publisher },
                            dateSubmitted,
                        } = accessRecord;
                        let bpmContext = {
                            dateSubmitted,
                            applicationStatus: constants.applicationStatuses.SUBMITTED,
                            publisher,
                            businessKey: id,
                        };
                        bpmController.postStartPreReview(bpmContext);
                    }
                }
            });
            // 9. Return aplication and successful response
            return res.status(200).json({ status: 'success', data: accessRecord._doc });*/
		} catch (err) {
			console.log(err.message);
			res.status(500).json({ status: 'error', message: err.message });
		}
	},

	buildUpdateObject: data => {
		let updateObj = {};
		let { questionAnswers, updatedQuestionId, user, jsonSchema = '', percentageCompleted } = data;
		if (questionAnswers) {
			updateObj = { ...updateObj, questionAnswers, updatedQuestionId, user, percentageCompleted, 'timestamps.updated': Date.now() };
		}

		if (!_.isEmpty(jsonSchema)) {
			updateObj = { ...updateObj, jsonSchema, 'timestamps.updated': Date.now() };
		}

		return updateObj;
	},

	updateApplication: async (accessRecord, updateObj) => {
		// 1. Extract properties
		let { activeflag, _id } = accessRecord;
		let { updatedQuestionId = '', user, percentageCompleted } = updateObj;
		// 2. If application is in progress, update initial question answers
		if (activeflag === constants.datatsetStatuses.DRAFT) {
			await Data.findByIdAndUpdate(_id, updateObj, { new: true }, err => {
				if (err) {
					console.error(err);
					throw err;
				}
			});
			return accessRecord;
			// 3. Else if application has already been submitted make amendment
		} else if (activeflag === constants.applicationStatuses.INREVIEW || activeflag === constants.applicationStatuses.SUBMITTED) {
			if (_.isNil(updateObj.questionAnswers)) {
				return accessRecord;
			}
			let updatedAnswer = JSON.parse(updateObj.questionAnswers)[updatedQuestionId];
			accessRecord = amendmentController.handleApplicantAmendment(accessRecord.toObject(), updatedQuestionId, '', updatedAnswer, user);
			await DataRequestModel.replaceOne({ _id }, accessRecord, err => {
				if (err) {
					console.error(err);
					throw err;
				}
			});
			return accessRecord;
		}
	},

	//PUT api/v1/dataset-onboarding/:id
	changeDatasetVersionStatus: async (req, res) => {
		try {
			// 1. Id is the _id object in MongoDb not the generated id or dataset Id
			// 2. Get the userId
			const id = req.params.id || null;
			let { _id, id: userId } = req.user;
			let { applicationStatus, applicationStatusDesc = '' } = req.body;

			if (!id) return res.status(404).json({ status: 'error', message: 'Dataset _id could not be found.' });

			if (applicationStatus === 'approved') {
				let dataset = await Data.findOne({ _id: id });
				if (!dataset) return res.status(404).json({ status: 'error', message: 'Dataset could not be found.' });

				dataset.questionAnswers = JSON.parse(dataset.questionAnswers);
				const publisherData = await PublisherModel.find({ _id: dataset.datasetv2.summary.publisher.identifier }).lean();

				//1. create new version on MDC with version number and take datasetid and store
				const loginDetails = {
					username: 'paul.mccafferty@paconsulting.com',
					password: 'blueLetterGlass47',
				}; //Paul - move to env variables
				await axios
					.post('https://modelcatalogue.cs.ox.ac.uk/hdruk-preprod/api/authentication/login', loginDetails, {
						withCredentials: true,
						timeout: 5000,
					})
					.then(async session => {
						axios.defaults.headers.Cookie = session.headers['set-cookie'][0]; // get cookie from request

						let jsonData = JSON.stringify(await module.exports.buildJSONFile(dataset));
						fs.writeFileSync(__dirname + `/datasetfiles/${dataset._id}.json`, jsonData);

						var data = new FormData();
						data.append('folderId', publisherData[0].mdcFolderId);
						data.append('importFile', fs.createReadStream(__dirname + `/datasetfiles/${dataset._id}.json`));
						data.append('finalised', 'false');
						data.append('importAsNewDocumentationVersion', 'true');

						await axios
							.post(
								'https://modelcatalogue.cs.ox.ac.uk/hdruk-preprod/api/dataModels/import/ox.softeng.metadatacatalogue.core.spi.json/JsonImporterService/1.1',
								data,
								{
									withCredentials: true,
									timeout: 5000,
									headers: {
										...data.getHeaders(),
									},
								}
							)
							.then(async newDatasetVersion => {
								let newDatasetVersionId = newDatasetVersion.data.items[0].id;
								fs.unlinkSync(__dirname + `/datasetfiles/${dataset._id}.json`);

								const updatedDatasetDetails = {
									documentationVersion: dataset.datasetVersion,
								};

								await axios
									.put(`https://modelcatalogue.cs.ox.ac.uk/hdruk-preprod/api/dataModels/${newDatasetVersionId}`, updatedDatasetDetails, {
										withCredentials: true,
										timeout: 5000,
									})
									.catch(err => {
										console.log('Error when trying to update the version number on the MDC - ' + err.message);
									});

								await axios
									.put(`https://modelcatalogue.cs.ox.ac.uk/hdruk-preprod/api/dataModels/${newDatasetVersionId}/finalise`, {
										withCredentials: true,
										timeout: 5000,
									})
									.catch(err => {
										console.log('Error when trying to finalise the dataset on the MDC - ' + err.message);
									});

								// Adding to DB
								let observations = await module.exports.buildObservations(dataset.questionAnswers);

								let datasetv2Object = {
									identifier: newDatasetVersionId,
									version: dataset.datasetVersion,
									issued: Date.now(),
									modified: Date.now(),
									revisions: [],
									summary: {
										title: dataset.questionAnswers['summary/title'] || '',
										abstract: dataset.questionAnswers['summary/abstract'] || '',
										publisher: {
											identifier: publisherData[0]._id.toString(),
											name: publisherData[0].publisherDetails.name,
											logo: publisherData[0].publisherDetails.logo || '',
											description: publisherData[0].publisherDetails.description || '',
											contactPoint: publisherData[0].publisherDetails.contactPoint || [],
											memberOf: publisherData[0].publisherDetails.memberOf,
											accessRights: publisherData[0].publisherDetails.accessRights || [],
											deliveryLeadTime: publisherData[0].publisherDetails.deliveryLeadTime || '',
											accessService: publisherData[0].publisherDetails.accessService || '',
											accessRequestCost: publisherData[0].publisherDetails.accessRequestCost || '',
											dataUseLimitation: publisherData[0].publisherDetails.dataUseLimitation || [],
											dataUseRequirements: publisherData[0].publisherDetails.dataUseRequirements || [],
										},
										contactPoint: dataset.questionAnswers['summary/contactPoint'] || '',
										keywords: dataset.questionAnswers['summary/keywords'] || [],
										alternateIdentifiers: dataset.questionAnswers['summary/alternateIdentifiers'] || [],
										doiName: dataset.questionAnswers['summary/doiName'] || '',
									},
									documentation: {
										description: dataset.questionAnswers['properties/documentation/description'] || '',
										associatedMedia: dataset.questionAnswers['properties/documentation/associatedMedia'] || [],
										isPartOf: dataset.questionAnswers['properties/documentation/isPartOf'] || [],
									},
									coverage: {
										spatial: dataset.questionAnswers['properties/coverage/spatial'] || '',
										typicalAgeRange: dataset.questionAnswers['properties/coverage/typicalAgeRange'] || '',
										physicalSampleAvailability: dataset.questionAnswers['properties/coverage/physicalSampleAvailability'] || [],
										followup: dataset.questionAnswers['properties/coverage/followup'] || '',
										pathway: dataset.questionAnswers['properties/coverage/pathway'] || '',
									},
									provenance: {
										origin: {
											purpose: dataset.questionAnswers['properties/provenance/origin/purpose'] || [],
											source: dataset.questionAnswers['properties/provenance/origin/source'] || [],
											collectionSituation: dataset.questionAnswers['properties/provenance/origin/collectionSituation'] || [],
										},
										temporal: {
											accrualPeriodicity: dataset.questionAnswers['properties/provenance/temporal/accrualPeriodicity'] || '',
											distributionReleaseDate: dataset.questionAnswers['properties/provenance/temporal/distributionReleaseDate'] || '',
											startDate: dataset.questionAnswers['properties/provenance/temporal/startDate'] || '',
											endDate: dataset.questionAnswers['properties/provenance/temporal/endDate'] || '',
											timeLag: dataset.questionAnswers['properties/provenance/temporal/timeLag'] || '',
										},
									},
									accessibility: {
										usage: {
											dataUseLimitation: dataset.questionAnswers['properties/accessibility/usage/dataUseLimitation'] || [],
											dataUseRequirements: dataset.questionAnswers['properties/accessibility/usage/dataUseRequirements'] || [],
											resourceCreator: dataset.questionAnswers['properties/accessibility/usage/resourceCreator'] || '',
											investigations: dataset.questionAnswers['properties/accessibility/usage/investigations'] || [],
											isReferencedBy: dataset.questionAnswers['properties/accessibility/usage/isReferencedBy'] || [],
										},
										access: {
											accessRights: dataset.questionAnswers['properties/accessibility/access/accessRights'] || [],
											accessService: dataset.questionAnswers['properties/accessibility/access/accessService'] || '',
											accessRequestCost: dataset.questionAnswers['properties/accessibility/access/accessRequestCost'] || '',
											deliveryLeadTime: dataset.questionAnswers['properties/accessibility/access/deliveryLeadTime'] || '',
											jurisdiction: dataset.questionAnswers['properties/accessibility/access/jurisdiction'] || [],
											dataProcessor: dataset.questionAnswers['properties/accessibility/access/dataController'] || '',
											dataController: dataset.questionAnswers['properties/accessibility/access/dataProcessor'] || '',
										},
										formatAndStandards: {
											vocabularyEncodingScheme:
												dataset.questionAnswers['properties/accessibility/formatAndStandards/vocabularyEncodingScheme'] || [],
											conformsTo: dataset.questionAnswers['properties/accessibility/formatAndStandards/conformsTo'] || [],
											language: dataset.questionAnswers['properties/accessibility/formatAndStandards/language'] || [],
											format: dataset.questionAnswers['properties/accessibility/formatAndStandards/format'] || [],
										},
									},
									enrichmentAndLinkage: {
										qualifiedRelation: dataset.questionAnswers['properties/enrichmentAndLinkage/qualifiedRelation'] || [],
										derivation: dataset.questionAnswers['properties/enrichmentAndLinkage/derivation'] || [],
										tools: dataset.questionAnswers['properties/enrichmentAndLinkage/tools'] || [],
									},
									observations: observations,
								};

								let previousDataset = await Data.findOneAndUpdate({ pid: dataset.pid, activeflag: 'active' }, { activeflag: 'archive' });
								let previousCounter = 0;
								if (previousDataset) previousCounter = previousDataset.counter || 0;

								//get technicaldetails and metadataQuality
								let technicalDetails = await module.exports.buildTechnicalDetails(dataset.structuralMetadata);
								let metadataQuality = await module.exports.buildMetadataQuality(datasetv2Object);

								await Data.findOneAndUpdate(
									{ _id: id },
									{
										datasetid: newDatasetVersionId,
										datasetVersion: dataset.datasetVersion,
										name: dataset.questionAnswers['summary/title'] || '',
										description: dataset.questionAnswers['properties/documentation/abstract'] || '',
										activeflag: 'active',
										tags: {
											features: dataset.questionAnswers['summary/keywords'] || [],
										},
										hasTechnicalDetails: !_.isEmpty(technicalDetails) ? true : false,
										'timestamps.updated': Date.now(),
										'timestamps.published': Date.now(),
										counter: previousCounter,
										datasetfields: {
											publisher: `${publisherData[0].publisherDetails.memberOf} > ${publisherData[0].publisherDetails.name}`,
											geographicCoverage: dataset.questionAnswers['properties/coverage/spatial'] || '',
											physicalSampleAvailability: dataset.questionAnswers['properties/coverage/physicalSampleAvailability'] || [],
											abstract: dataset.questionAnswers['summary/abstract'] || '',
											releaseDate: dataset.questionAnswers['properties/provenance/temporal/distributionReleaseDate'] || '',
											accessRequestDuration: dataset.questionAnswers['properties/accessibility/access/deliveryLeadTime'] || '',
											//conformsTo: dataset.questionAnswers['properties/accessibility/formatAndStandards/conformsTo'] || '',
											//accessRights: dataset.questionAnswers['properties/accessibility/access/accessRights'] || '',
											//jurisdiction: dataset.questionAnswers['properties/accessibility/access/jurisdiction'] || '',
											datasetStartDate: dataset.questionAnswers['properties/provenance/temporal/startDate'] || '',
											datasetEndDate: dataset.questionAnswers['properties/provenance/temporal/endDate'] || '',
											//statisticalPopulation: datasetMDC.statisticalPopulation,
											ageBand: dataset.questionAnswers['properties/coverage/typicalAgeRange'] || '',
											contactPoint: dataset.questionAnswers['summary/contactPoint'] || '',
											periodicity: dataset.questionAnswers['properties/provenance/temporal/accrualPeriodicity'] || '',

											metadataquality: metadataQuality,
											//datautility: dataUtility ? dataUtility : {},
											//metadataschema: metadataSchema && metadataSchema.data ? metadataSchema.data : {},
											technicaldetails: technicalDetails,
											//versionLinks: versionLinks && versionLinks.data && versionLinks.data.items ? versionLinks.data.items : [],
											phenotypes: [],
										},
										datasetv2: datasetv2Object,
										applicationStatusDesc: applicationStatusDesc,
									}
								);
							})
							.catch(err => {
								console.log('Error when trying to create new dataset on the MDC - ' + err.message);
							});
					})
					.catch(err => {
						console.log('Error when trying to login to MDC - ' + err.message);
					});

				await axios
					.post(`https://modelcatalogue.cs.ox.ac.uk/hdruk-preprod/api/authentication/logout`, { withCredentials: true, timeout: 5000 })
					.catch(err => {
						console.log('Error when trying to logout of the MDC - ' + err.message);
					});

				filtersService.optimiseFilters('dataset');

				return res.status(200).json({ status: 'success' });
			} else if (applicationStatus === 'rejected') {
				await Data.findOneAndUpdate(
					{ _id: id },
					{
						activeflag: constants.datatsetStatuses.REJECTED,
						applicationStatusDesc: applicationStatusDesc,
						'timestamps.rejected': Date.now(),
						'timestamps.updated': Date.now(),
					}
				);

				return res.status(200).json({ status: 'success' });
			} else if (applicationStatus === 'archived') {
				//await Data.findOneAndUpdate({ _id: id }, { activeflag: constants.datatsetStatuses.ARCHIVED });
			} else if (applicationStatus === 'unarchived') {
				//await Data.findOneAndUpdate({ _id: id }, { activeflag: constants.datatsetStatuses.ARCHIVED });
			}

			if (applicationStatusDesc) {
				accessRecord.applicationStatusDesc = inputSanitizer.removeNonBreakingSpaces(applicationStatusDesc);
				isDirty = true;
			}

			// 3. Check user type and authentication to submit application
			/* let { authorised, userType } = datarequestUtil.getUserPermissionsForApplication(accessRecord, req.user.id, req.user._id);
			if (!authorised) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			} */

			//update dataset to inreview - constants.datatsetStatuses.INREVIEW

			//let updatedDataset = await Data.findOneAndUpdate({ _id: id }, { activeflag: constants.datatsetStatuses.INREVIEW });
		} catch (err) {
			console.error(err.message);
			res.status(500).json({
				status: 'error',
				message: 'An error occurred updating the dataset status',
			});
		}
	},

	buildObservations: async observationsData => {
		let observationsArray = [];
		let regex = new RegExp('properties/observation/', 'g');

		let observationQuestions = [];
		Object.keys(observationsData).forEach(item => {
			if (item.match(regex)) {
				observationQuestions.push({ key: item, value: observationsData[item] });
			}
		});

		let observationUniqueIds = [''];
		observationQuestions.forEach(item => {
			let [, uniqueId] = item.key.split('_');
			if (!_.isEmpty(uniqueId) && !observationUniqueIds.find(x => x === uniqueId)) {
				observationUniqueIds.push(uniqueId);
			}
		});

		observationUniqueIds.forEach(uniqueId => {
			let entry = {};
			if (uniqueId === '') {
				observationQuestions.forEach(question => {
					if (!question.key.includes('_')) {
						let [, key] = question.key.split('properties/observation/');
						let newEntry = { [key]: question.value };
						entry = { ...entry, ...newEntry };
					}
				});
			} else {
				observationQuestions.forEach(question => {
					if (question.key.includes(uniqueId)) {
						let [keyLong] = question.key.split('_');
						let [, key] = keyLong.split('properties/observation/');
						let newEntry = { [key]: question.value };
						entry = { ...entry, ...newEntry };
					}
				});
			}
			observationsArray.push(entry);
		});

		return observationsArray;
	},

	buildTechnicalDetails: async structuralMetadata => {
		let technicalDetailsClasses = [];

		const orderedMetadata = _.map(_.groupBy(_.orderBy(structuralMetadata, ['tableName'], ['asc']), 'tableName'), (children, tableName) => ({
			tableName,
			children,
		}));

		orderedMetadata.forEach(item => {
			let technicalDetailsElements = [];
			item.children.forEach(child => {
				technicalDetailsElements.push({
					label: child.columnName,
					description: child.columnDescription,
					domainType: 'DataElement',
					dataType: {
						label: child.dataType,
						domainType: 'PrimitiveType',
					},
				});
			});

			technicalDetailsClasses.push({
				label: item.children[0].tableName,
				description: item.children[0].tableDescription,
				domainType: 'DataClass',
				elements: technicalDetailsElements,
			});
		});

		return technicalDetailsClasses;
	},

	buildJSONFile: async dataset => {
		let jsonFile = {};
		let metadata = [];
		let childDataClasses = [];
		let regex = new RegExp('properties/observation/', 'g');

		let observationQuestions = [];
		Object.keys(dataset.questionAnswers).forEach(item => {
			if (item.match(regex)) {
				observationQuestions.push({ key: item, value: dataset.questionAnswers[item] });
			} else {
				const newDatasetCatalogueItems = {
					namespace: 'org.healthdatagateway',
					key: item,
					value: dataset.questionAnswers[item],
				};
				metadata.push(newDatasetCatalogueItems);
			}
		});

		let observationUniqueIds = [''];
		observationQuestions.forEach(item => {
			let [, uniqueId] = item.key.split('_');
			if (!_.isEmpty(uniqueId) && !observationUniqueIds.find(x => x === uniqueId)) {
				observationUniqueIds.push(uniqueId);
			}
		});

		let observations = [];
		observationUniqueIds.forEach(uniqueId => {
			let entry = {};
			if (uniqueId === '') {
				observationQuestions.forEach(question => {
					if (!question.key.includes('_')) {
						let [, key] = question.key.split('properties/observation/');
						let newEntry = { [key]: question.value };
						entry = { ...entry, ...newEntry };
					}
				});
			} else {
				observationQuestions.forEach(question => {
					if (question.key.includes(uniqueId)) {
						let [keyLong] = question.key.split('_');
						let [, key] = keyLong.split('properties/observation/');
						let newEntry = { [key]: question.value };
						entry = { ...entry, ...newEntry };
					}
				});
			}
			observations.push(entry);
		});

		if (!_.isEmpty(observations)) {
			const newDatasetCatalogueItems = {
				namespace: 'org.healthdatagateway',
				key: 'properties/observations/observations',
				value: JSON.stringify(observations),
			};
			metadata.push(newDatasetCatalogueItems);
		}

		const orderedMetadata = _.map(
			_.groupBy(_.orderBy(dataset.structuralMetadata, ['tableName'], ['asc']), 'tableName'),
			(children, tableName) => ({ tableName, children })
		);

		orderedMetadata.forEach(item => {
			let childDataElements = [];
			item.children.forEach(child => {
				childDataElements.push({
					label: child.columnName,
					description: child.columnDescription,
					dataType: {
						label: child.dataType,
						domainType: 'PrimitiveType',
					},
				});
			});

			childDataClasses.push({
				label: item.children[0].tableName,
				description: item.children[0].tableDescription,
				childDataElements: childDataElements,
			});
		});

		jsonFile = {
			dataModel: {
				label: dataset.questionAnswers['summary/title'],
				description: dataset.questionAnswers['summary/abstract'],
				type: 'Data Asset',
				metadata: metadata,
				childDataClasses: childDataClasses,
			},
		};

		return jsonFile;
	},

	//GET api/v1/data-access-request/checkUniqueTitle
	checkUniqueTitle: async (req, res) => {
		let { pid, title = '' } = req.query;
		let regex = new RegExp(`^${title}$`, 'i');
		let dataset = await Data.findOne({ name: regex, pid: { $ne: pid } });
		return res.status(200).json({ isUniqueTitle: dataset ? false : true });
	},

	//GET api/v1/data-access-request/checkUniqueTitle
	buildMetadataQuality: async (dataset, pid) => {
		//VALIDATION_WEIGHTS_PATH = os.path.join(CWD, 'config', 'weights', 'latest', 'weights.v2.json')
		let weights = {
			//'1: Summary': {
			identifier: 0.026845638,
			'summary.title': 0.026845638,
			'summary.abstract': 0.026845638,
			'summary.contactPoint': 0.026845638,
			'summary.keywords': 0.026845638,
			'summary.doiName': 0.026845638,
			'summary.publisher.name': 0.026845638,
			'summary.publisher.contactPoint': 0.0,
			'summary.publisher.memberOf': 0.006711409,
			//},
			//'2: Documentation': {
			'documentation.description': 0.026845638,
			'documentation.associatedMedia': 0.0,
			'documentation.isPartOf': 0.0,
			//},
			//'3: Coverage': {
			'coverage.spatial': 0.026845638,
			'coverage.typicalAgeRange': 0.026845638,
			'coverage.physicalSampleAvailability': 0.026845638,
			'coverage.followup': 0.006711409,
			'coverage.pathway': 0.006711409,
			//},
			//'4: Provenance': {
			'provenance.origin.purpose': 0.006711409,
			'provenance.origin.source': 0.006711409,
			'provenance.origin.collectionSituation': 0.006711409,
			'provenance.temporal.accrualPeriodicity': 0.026845638,
			'provenance.temporal.distributionReleaseDate': 0.0,
			'provenance.temporal.startDate': 0.026845638,
			'provenance.temporal.endDate': 0.0,
			'provenance.temporal.timeLag': 0.006711409,
			//},
			//'5: Accessibility': {
			'accessibility.usage.dataUseLimitation': 0.026845638,
			'accessibility.usage.dataUseRequirements': 0.026845638,
			'accessibility.usage.resourceCreator': 0.026845638,
			'accessibility.usage.investigations': 0.006711409,
			'accessibility.usage.isReferencedBy': 0.006711409,
			'accessibility.access.accessRights': 0.026845638,
			'accessibility.access.accessService': 0.006711409,
			'accessibility.access.accessRequestCost': 0.026845638,
			'accessibility.access.deliveryLeadTime': 0.026845638,
			'accessibility.access.jurisdiction': 0.026845638,
			'accessibility.access.dataController': 0.026845638,
			'accessibility.access.dataProcessor': 0.0,
			'accessibility.formatAndStandards.vocabularyEncodingScheme': 0.026845638,
			'accessibility.formatAndStandards.conformsTo': 0.026845638,
			'accessibility.formatAndStandards.language': 0.026845638,
			'accessibility.formatAndStandards.format': 0.026845638,
			//},
			//'6: Enrichment & Linkage': {
			'enrichmentAndLinkage.qualifiedRelation': 0.006711409,
			'enrichmentAndLinkage.derivation': 0.006711409,
			'enrichmentAndLinkage.tools': 0.006711409,
			//},
			//'7. Observations': {
			'observation.observedNode': 0.026845638,
			'observation.measuredValue': 0.026845638,
			'observation.disambiguatingDescription': 0.0,
			'observation.observationDate': 0.0,
			'observation.measuredProperty': 0.0,
			//},
			//'8. Structural metadata': {
			'structuralMetadata.dataClassesCount': 0.026845638,
			'structuralMetadata.tableName': 0.026845638,
			'structuralMetadata.tableDescription': 0.026845638,
			'structuralMetadata.columnName': 0.026845638,
			'structuralMetadata.columnDescription': 0.026845638,
			'structuralMetadata.dataType': 0.026845638,
			'structuralMetadata.sensitive': 0.026845638,
			//},
		};

		let metadataquality = {
			schema_version: '2.0.1',
			pid: '',
			id: '',
			publisher: '',
			title: '',
			weighted_quality_rating: 'Not Rated',
			weighted_quality_score: 0,
			weighted_completeness_percent: 0,
			weighted_error_percent: 0,
		};

		metadataquality.pid = pid;
		metadataquality.id = dataset.identifier;
		metadataquality.publisher = dataset.summary.publisher.memberOf + ' > ' + dataset.summary.publisher.name;
		metadataquality.title = dataset.summary.title;

		let completeness = [];
		let totalCount = 0,
			totalWeight = 0;

		Object.entries(weights).forEach(([key, weight]) => {
			let datasetValue = module.exports.getDatatsetValue(dataset, key);

			if (key === 'identifier') {
				completeness.push({ weight, value: datasetValue });
				totalCount++;
				totalWeight += weight;
			} else if (key === 'structuralMetadata') {
				completeness.push({ weight, value: datasetValue });
				totalCount++;
				totalWeight += weight;
			}
			if (datasetValue) {
				completeness.push({ value: datasetValue, weight, score: weight });
				totalCount++;
				totalWeight += weight;
			} else {
				completeness.push({ value: datasetValue, weight, score: 0 });
			}

			//special rules around provenance.temporal.accrualPeriodicity = CONTINUOUS
		});

		let schema = {};

		let rawdata = fs.readFileSync(__dirname + '/schema.json');
		schema = JSON.parse(rawdata);

		const ajv = new Ajv({ strict: false, allErrors: true });
		const validate = ajv.compile(schema);
		const valid = validate(dataset);

		let errors = [];
		let errorCount = 0,
			errorWeight = 0;

		Object.entries(weights).forEach(([key, weight]) => {
			let updatedKey = '/' + key.replace(/\./g, '/');
			let errorIndex = Object.keys(validate.errors).find(key => validate.errors[key].dataPath === updatedKey);
			if (errorIndex) {
				errors.push({ value: key, scor: weight });
				errorCount += 1;
				errorWeight += weight;
			} else {
				errors.push({ value: key, scor: 0 });
			}
		});

		metadataquality.weighted_completeness_percent = Number(100 * totalWeight).toFixed(2);
		metadataquality.weighted_error_percent = Number(100 * errorWeight).toFixed(2);
		metadataquality.weighted_quality_score = Number(50 * (totalWeight + (1 - errorWeight))).toFixed(2);

		let rating = 'Not Rated';
		if (metadataquality.weighted_quality_score > 60 && metadataquality.weighted_quality_score <= 70) rating = 'Bronze';
		else if (metadataquality.weighted_quality_score > 70 && metadataquality.weighted_quality_score <= 80) rating = 'Silver';
		else if (metadataquality.weighted_quality_score > 80 && metadataquality.weighted_quality_score <= 90) rating = 'Gold';
		else if (metadataquality.weighted_quality_score > 90) rating = 'Platinum';
		metadataquality.weighted_quality_rating = rating;

		return metadataquality;
	},

	getDatatsetValue(dataset, field) {
		return field.split('.').reduce(function (o, k) {
			return o && o[k];
		}, dataset);
	},

	createNotifications: async (type, context, team) => {
		const teamName = getTeamName(team);
		let options = {};
		let html = '';

		switch (type) {
			case constants.notificationTypes.MEMBERREMOVED:
				// 1. Get user removed
				const { removedUser } = context;
				// 2. Create user notifications
				notificationBuilder.triggerNotificationMessage(
					[removedUser.id],
					`You have been removed from the team ${teamName}`,
					'team unlinked',
					teamName
				);
				// 3. Create email
				options = {
					teamName,
				};
				html = emailGenerator.generateRemovedFromTeam(options);
				emailGenerator.sendEmail([removedUser], constants.hdrukEmail, `You have been removed from the team ${teamName}`, html, false);
				break;
			case constants.notificationTypes.MEMBERADDED:
				// 1. Get users added
				const { newUsers } = context;
				const newUserIds = newUsers.map(user => user.id);
				// 2. Create user notifications
				notificationBuilder.triggerNotificationMessage(
					newUserIds,
					`You have been added to the team ${teamName} on the HDR UK Innovation Gateway`,
					'team',
					teamName
				);
				// 3. Create email for reviewers
				options = {
					teamName,
					role: constants.roleTypes.REVIEWER,
				};
				html = emailGenerator.generateAddedToTeam(options);
				emailGenerator.sendEmail(
					newUsers,
					constants.hdrukEmail,
					`You have been added as a reviewer to the team ${teamName} on the HDR UK Innovation Gateway`,
					html,
					false
				);
				// 4. Create email for managers
				options = {
					teamName,
					role: constants.roleTypes.MANAGER,
				};
				html = emailGenerator.generateAddedToTeam(options);
				emailGenerator.sendEmail(
					newUsers,
					constants.hdrukEmail,
					`You have been added as a manager to the team ${teamName} on the HDR UK Innovation Gateway`,
					html,
					false
				);
				break;
			case constants.notificationTypes.MEMBERROLECHANGED:
				break;
		}
	},

	createNotifications: async (type, context, accessRecord, user) => {
		// Project details from about application if 5 Safes
		let { aboutApplication = {} } = accessRecord;
		if (typeof aboutApplication === 'string') {
			aboutApplication = JSON.parse(accessRecord.aboutApplication);
		}
		let { projectName = 'No project name set' } = aboutApplication;
		let { projectId, _id, workflow = {}, dateSubmitted = '', jsonSchema, questionAnswers } = accessRecord;
		if (_.isEmpty(projectId)) {
			projectId = _id;
		}
		// Parse the schema
		if (typeof jsonSchema === 'string') {
			jsonSchema = JSON.parse(accessRecord.jsonSchema);
		}
		if (typeof questionAnswers === 'string') {
			questionAnswers = JSON.parse(accessRecord.questionAnswers);
		}
		let { pages, questionPanels, questionSets: questions } = jsonSchema;
		// Publisher details from single dataset
		let {
			datasetfields: { contactPoint, publisher },
		} = accessRecord.datasets[0];
		let datasetTitles = accessRecord.datasets.map(dataset => dataset.name).join(', ');
		// Main applicant (user obj)
		let { firstname: appFirstName, lastname: appLastName, email: appEmail } = accessRecord.mainApplicant;
		// Requesting user
		let { firstname, lastname } = user;
		// Instantiate default params
		let custodianManagers = [],
			custodianUserIds = [],
			managerUserIds = [],
			emailRecipients = [],
			options = {},
			html = '',
			attachmentContent = '',
			filename = '',
			jsonContent = {},
			authors = [],
			attachments = [];
		let applicants = datarequestUtil.extractApplicantNames(questionAnswers).join(', ');
		// Fall back for single applicant on short application form
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
		// Deconstruct workflow context if passed
		let {
			workflowName = '',
			stepName = '',
			reviewerNames = '',
			reviewSections = '',
			nextStepName = '',
			stepReviewers = [],
			stepReviewerUserIds = [],
			currentDeadline = '',
			remainingReviewers = [],
			remainingReviewerUserIds = [],
			dateDeadline,
		} = context;

		switch (type) {
			case constants.notificationTypes.STATUSCHANGE:
				// 1. Create notifications
				// Custodian manager and current step reviewer notifications
				if (_.has(accessRecord.datasets[0].toObject(), 'publisher.team.users')) {
					// Retrieve all custodian manager user Ids and active step reviewers
					custodianManagers = teamController.getTeamMembersByRole(accessRecord.datasets[0].publisher.team, constants.roleTypes.MANAGER);
					let activeStep = workflowController.getActiveWorkflowStep(workflow);
					stepReviewers = workflowController.getStepReviewers(activeStep);
					// Create custodian notification
					let statusChangeUserIds = [...custodianManagers, ...stepReviewers].map(user => user.id);
					await notificationBuilder.triggerNotificationMessage(
						statusChangeUserIds,
						`${appFirstName} ${appLastName}'s Data Access Request for ${datasetTitles} was ${context.applicationStatus} by ${firstname} ${lastname}`,
						'data access request',
						accessRecord._id
					);
				}
				// Create applicant notification
				await notificationBuilder.triggerNotificationMessage(
					[accessRecord.userId],
					`Your Data Access Request for ${datasetTitles} was ${context.applicationStatus} by ${publisher}`,
					'data access request',
					accessRecord._id
				);

				// Create authors notification
				if (!_.isEmpty(authors)) {
					await notificationBuilder.triggerNotificationMessage(
						authors.map(author => author.id),
						`A Data Access Request you are contributing to for ${datasetTitles} was ${context.applicationStatus} by ${publisher}`,
						'data access request',
						accessRecord._id
					);
				}

				// 2. Send emails to relevant users
				// Aggregate objects for custodian and applicant
				emailRecipients = [accessRecord.mainApplicant, ...custodianManagers, ...stepReviewers, ...accessRecord.authors];
				if (!dateSubmitted) ({ updatedAt: dateSubmitted } = accessRecord);
				// Create object to pass through email data
				options = {
					id: accessRecord._id,
					applicationStatus: context.applicationStatus,
					applicationStatusDesc: context.applicationStatusDesc,
					publisher,
					projectId,
					projectName,
					datasetTitles,
					dateSubmitted,
					applicants,
				};
				// Create email body content
				html = emailGenerator.generateDARStatusChangedEmail(options);
				// Send email
				await emailGenerator.sendEmail(
					emailRecipients,
					constants.hdrukEmail,
					`Data Access Request for ${datasetTitles} was ${context.applicationStatus} by ${publisher}`,
					html,
					false
				);
				break;
			case constants.notificationTypes.SUBMITTED:
				// 1. Create notifications
				// Custodian notification
				if (_.has(accessRecord.datasets[0].toObject(), 'publisher.team.users')) {
					// Retrieve all custodian user Ids to generate notifications
					custodianManagers = teamController.getTeamMembersByRole(accessRecord.datasets[0].publisher.team, constants.roleTypes.MANAGER);
					custodianUserIds = custodianManagers.map(user => user.id);
					await notificationBuilder.triggerNotificationMessage(
						custodianUserIds,
						`A Data Access Request has been submitted to ${publisher} for ${datasetTitles} by ${appFirstName} ${appLastName}`,
						'data access request',
						accessRecord._id
					);
				} else {
					const dataCustodianEmail = process.env.DATA_CUSTODIAN_EMAIL || contactPoint;
					custodianManagers = [{ email: dataCustodianEmail }];
				}
				// Applicant notification
				await notificationBuilder.triggerNotificationMessage(
					[accessRecord.userId],
					`Your Data Access Request for ${datasetTitles} was successfully submitted to ${publisher}`,
					'data access request',
					accessRecord._id
				);
				// Contributors/authors notification
				if (!_.isEmpty(authors)) {
					await notificationBuilder.triggerNotificationMessage(
						accessRecord.authors.map(author => author.id),
						`A Data Access Request you are contributing to for ${datasetTitles} was successfully submitted to ${publisher} by ${firstname} ${lastname}`,
						'data access request',
						accessRecord._id
					);
				}
				// 2. Send emails to custodian and applicant
				// Create object to pass to email generator
				options = {
					userType: '',
					userEmail: appEmail,
					publisher,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
				};
				// Iterate through the recipient types
				for (let emailRecipientType of constants.submissionEmailRecipientTypes) {
					// Establish email context object
					options = {
						...options,
						userType: emailRecipientType,
						submissionType: constants.submissionTypes.INITIAL,
					};
					// Build email template
					({ html, jsonContent } = await emailGenerator.generateEmail(questions, pages, questionPanels, questionAnswers, options));
					// Send emails to custodian team members who have opted in to email notifications
					if (emailRecipientType === 'dataCustodian') {
						emailRecipients = [...custodianManagers];
						// Generate json attachment for external system integration
						attachmentContent = Buffer.from(JSON.stringify({ id: accessRecord._id, ...jsonContent })).toString('base64');
						filename = `${helper.generateFriendlyId(accessRecord._id)} ${moment().format().toString()}.json`;
						attachments = [await emailGenerator.generateAttachment(filename, attachmentContent, 'application/json')];
					} else {
						// Send email to main applicant and contributors if they have opted in to email notifications
						emailRecipients = [accessRecord.mainApplicant, ...accessRecord.authors];
					}
					// Send email
					if (!_.isEmpty(emailRecipients)) {
						await emailGenerator.sendEmail(
							emailRecipients,
							constants.hdrukEmail,
							`Data Access Request has been submitted to ${publisher} for ${datasetTitles}`,
							html,
							false,
							attachments
						);
					}
				}
				break;
			case constants.notificationTypes.RESUBMITTED:
				// 1. Create notifications
				// Custodian notification
				if (_.has(accessRecord.datasets[0], 'publisher.team.users')) {
					// Retrieve all custodian user Ids to generate notifications
					custodianManagers = teamController.getTeamMembersByRole(accessRecord.datasets[0].publisher.team, constants.roleTypes.MANAGER);
					custodianUserIds = custodianManagers.map(user => user.id);
					await notificationBuilder.triggerNotificationMessage(
						custodianUserIds,
						`A Data Access Request has been resubmitted with updates to ${publisher} for ${datasetTitles} by ${appFirstName} ${appLastName}`,
						'data access request',
						accessRecord._id
					);
				} else {
					const dataCustodianEmail = process.env.DATA_CUSTODIAN_EMAIL || contactPoint;
					custodianManagers = [{ email: dataCustodianEmail }];
				}
				// Applicant notification
				await notificationBuilder.triggerNotificationMessage(
					[accessRecord.userId],
					`Your Data Access Request for ${datasetTitles} was successfully resubmitted with updates to ${publisher}`,
					'data access request',
					accessRecord._id
				);
				// Contributors/authors notification
				if (!_.isEmpty(authors)) {
					await notificationBuilder.triggerNotificationMessage(
						accessRecord.authors.map(author => author.id),
						`A Data Access Request you are contributing to for ${datasetTitles} was successfully resubmitted with updates to ${publisher} by ${firstname} ${lastname}`,
						'data access request',
						accessRecord._id
					);
				}
				// 2. Send emails to custodian and applicant
				// Create object to pass to email generator
				options = {
					userType: '',
					userEmail: appEmail,
					publisher,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
				};
				// Iterate through the recipient types
				for (let emailRecipientType of constants.submissionEmailRecipientTypes) {
					// Establish email context object
					options = {
						...options,
						userType: emailRecipientType,
						submissionType: constants.submissionTypes.RESUBMISSION,
					};
					// Build email template
					({ html, jsonContent } = await emailGenerator.generateEmail(questions, pages, questionPanels, questionAnswers, options));
					// Send emails to custodian team members who have opted in to email notifications
					if (emailRecipientType === 'dataCustodian') {
						emailRecipients = [...custodianManagers];
						// Generate json attachment for external system integration
						attachmentContent = Buffer.from(JSON.stringify({ id: accessRecord._id, ...jsonContent })).toString('base64');
						filename = `${helper.generateFriendlyId(accessRecord._id)} ${moment().format().toString()}.json`;
						attachments = [await emailGenerator.generateAttachment(filename, attachmentContent, 'application/json')];
					} else {
						// Send email to main applicant and contributors if they have opted in to email notifications
						emailRecipients = [accessRecord.mainApplicant, ...accessRecord.authors];
					}
					// Send email
					if (!_.isEmpty(emailRecipients)) {
						await emailGenerator.sendEmail(
							emailRecipients,
							constants.hdrukEmail,
							`Data Access Request to ${publisher} for ${datasetTitles} has been updated with updates`,
							html,
							false,
							attachments
						);
					}
				}
				break;
			case constants.notificationTypes.CONTRIBUTORCHANGE:
				// 1. Deconstruct authors array from context to compare with existing Mongo authors
				const { newAuthors, currentAuthors } = context;
				// 2. Determine authors who have been removed
				let addedAuthors = [...newAuthors].filter(author => !currentAuthors.includes(author));
				// 3. Determine authors who have been added
				let removedAuthors = [...currentAuthors].filter(author => !newAuthors.includes(author));
				// 4. Create emails and notifications for added/removed contributors
				// Set required data for email generation
				options = {
					id: accessRecord._id,
					projectName,
					projectId,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
					actioner: `${firstname} ${lastname}`,
					applicants,
				};
				// Notifications for added contributors
				if (!_.isEmpty(addedAuthors)) {
					options.change = 'added';
					html = emailGenerator.generateContributorEmail(options);
					// Find related user objects and filter out users who have not opted in to email communications
					let addedUsers = await UserModel.find({
						id: { $in: addedAuthors },
					}).populate('additionalInfo');

					await notificationBuilder.triggerNotificationMessage(
						addedUsers.map(user => user.id),
						`You have been added as a contributor for a Data Access Request to ${publisher} by ${firstname} ${lastname}`,
						'data access request',
						accessRecord._id
					);
					await emailGenerator.sendEmail(
						addedUsers,
						constants.hdrukEmail,
						`You have been added as a contributor for a Data Access Request to ${publisher} by ${firstname} ${lastname}`,
						html,
						false
					);
				}
				// Notifications for removed contributors
				if (!_.isEmpty(removedAuthors)) {
					options.change = 'removed';
					html = await emailGenerator.generateContributorEmail(options);
					// Find related user objects and filter out users who have not opted in to email communications
					let removedUsers = await UserModel.find({
						id: { $in: removedAuthors },
					}).populate('additionalInfo');

					await notificationBuilder.triggerNotificationMessage(
						removedUsers.map(user => user.id),
						`You have been removed as a contributor from a Data Access Request to ${publisher} by ${firstname} ${lastname}`,
						'data access request unlinked',
						accessRecord._id
					);
					await emailGenerator.sendEmail(
						removedUsers,
						constants.hdrukEmail,
						`You have been removed as a contributor from a Data Access Request to ${publisher} by ${firstname} ${lastname}`,
						html,
						false
					);
				}
				break;
			case constants.notificationTypes.STEPOVERRIDE:
				// 1. Create reviewer notifications
				notificationBuilder.triggerNotificationMessage(
					stepReviewerUserIds,
					`${firstname} ${lastname} has approved a Data Access Request application phase that you were assigned to review`,
					'data access request',
					accessRecord._id
				);
				// 2. Create reviewer emails
				options = {
					id: accessRecord._id,
					projectName,
					projectId,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
					actioner: `${firstname} ${lastname}`,
					applicants,
					dateSubmitted,
					...context,
				};
				html = emailGenerator.generateStepOverrideEmail(options);
				emailGenerator.sendEmail(
					stepReviewers,
					constants.hdrukEmail,
					`${firstname} ${lastname} has approved a Data Access Request application phase that you were assigned to review`,
					html,
					false
				);
				break;
			case constants.notificationTypes.REVIEWSTEPSTART:
				// 1. Create reviewer notifications
				notificationBuilder.triggerNotificationMessage(
					stepReviewerUserIds,
					`You are required to review a new Data Access Request application for ${publisher} by ${moment(currentDeadline).format(
						'D MMM YYYY HH:mm'
					)}`,
					'data access request',
					accessRecord._id
				);
				// 2. Create reviewer emails
				options = {
					id: accessRecord._id,
					projectName,
					projectId,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
					actioner: `${firstname} ${lastname}`,
					applicants,
					dateSubmitted,
					...context,
				};
				html = emailGenerator.generateNewReviewPhaseEmail(options);
				emailGenerator.sendEmail(
					stepReviewers,
					constants.hdrukEmail,
					`You are required to review a new Data Access Request application for ${publisher} by ${moment(currentDeadline).format(
						'D MMM YYYY HH:mm'
					)}`,
					html,
					false
				);
				break;
			case constants.notificationTypes.FINALDECISIONREQUIRED:
				// 1. Get managers for publisher
				custodianManagers = teamController.getTeamMembersByRole(accessRecord.publisherObj.team, constants.roleTypes.MANAGER);
				managerUserIds = custodianManagers.map(user => user.id);

				// 2. Create manager notifications
				notificationBuilder.triggerNotificationMessage(
					managerUserIds,
					`Action is required as a Data Access Request application for ${publisher} is now awaiting a final decision`,
					'data access request',
					accessRecord._id
				);
				// 3. Create manager emails
				options = {
					id: accessRecord._id,
					projectName,
					projectId,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
					actioner: `${firstname} ${lastname}`,
					applicants,
					dateSubmitted,
					...context,
				};
				html = emailGenerator.generateFinalDecisionRequiredEmail(options);
				emailGenerator.sendEmail(
					custodianManagers,
					constants.hdrukEmail,
					`Action is required as a Data Access Request application for ${publisher} is now awaiting a final decision`,
					html,
					false
				);
				break;
			case constants.notificationTypes.DEADLINEWARNING:
				// 1. Create reviewer notifications
				await notificationBuilder.triggerNotificationMessage(
					remainingReviewerUserIds,
					`The deadline is approaching for a Data Access Request application you are reviewing`,
					'data access request',
					accessRecord._id
				);
				// 2. Create reviewer emails
				options = {
					id: accessRecord._id,
					projectName,
					projectId,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
					actioner: `${firstname} ${lastname}`,
					applicants,
					workflowName,
					stepName,
					reviewSections,
					reviewerNames,
					nextStepName,
					dateDeadline,
				};
				html = await emailGenerator.generateReviewDeadlineWarning(options);
				await emailGenerator.sendEmail(
					remainingReviewers,
					constants.hdrukEmail,
					`The deadline is approaching for a Data Access Request application you are reviewing`,
					html,
					false
				);
				break;
			case constants.notificationTypes.DEADLINEPASSED:
				// 1. Get all managers
				custodianManagers = teamController.getTeamMembersByRole(accessRecord.publisherObj.team, constants.roleTypes.MANAGER);
				managerUserIds = custodianManagers.map(user => user.id);
				// 2. Combine managers and reviewers remaining
				let deadlinePassedUserIds = [...remainingReviewerUserIds, ...managerUserIds];
				let deadlinePassedUsers = [...remainingReviewers, ...custodianManagers];

				// 3. Create notifications
				await notificationBuilder.triggerNotificationMessage(
					deadlinePassedUserIds,
					`The deadline for a Data Access Request review phase has now elapsed`,
					'data access request',
					accessRecord._id
				);
				// 4. Create emails
				options = {
					id: accessRecord._id,
					projectName,
					projectId,
					datasetTitles,
					userName: `${appFirstName} ${appLastName}`,
					actioner: `${firstname} ${lastname}`,
					applicants,
					workflowName,
					stepName,
					reviewSections,
					reviewerNames,
					nextStepName,
					dateDeadline,
				};
				html = await emailGenerator.generateReviewDeadlinePassed(options);
				await emailGenerator.sendEmail(
					deadlinePassedUsers,
					constants.hdrukEmail,
					`The deadline for a Data Access Request review phase has now elapsed`,
					html,
					false
				);
				break;
		}
	},
};
