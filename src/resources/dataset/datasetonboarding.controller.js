import { Data } from '../tool/data.model';
import { PublisherModel } from '../publisher/publisher.model';
import { TeamModel } from '../team/team.model';
import { UserModel } from '../user/user.model';
import teamController from '../team/team.controller';
import randomstring from 'randomstring';
import { filtersService } from '../filters/dependency';
import notificationBuilder from '../utilities/notificationBuilder';
import emailGenerator from '../utilities/emailGenerator.util';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import axios from 'axios';
import FormData from 'form-data';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
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

			let query = {};

			if (publisherID === 'admin') {
				// get all datasets in review for admin
				query = {
					activeflag: 'inReview',
					type: 'dataset',
				};
			} else {
				// get all pids for publisherID
				query = {
					'datasetv2.summary.publisher.identifier': publisherID,
					type: 'dataset',
					activeflag: { $in: ['active', 'inReview', 'draft', 'rejected', 'archive'] },
				};
			}

			const datasets = await Data.find(query)
				.select(
					'_id pid name datasetVersion activeflag timestamps applicationStatusDesc percentageCompleted datasetv2.summary.publisher.name'
				)
				.sort({ 'timestamps.updated': -1 })
				.lean();

			const listOfDatasets = datasets.reduce((arr, dataset) => {
				dataset.listOfVersions = [];
				const datasetIdx = arr.findIndex(item => item.pid === dataset.pid);
				if (datasetIdx === -1) {
					arr = [...arr, dataset];
				} else {
					const { _id, datasetVersion, activeflag } = dataset;
					const versionDetails = { _id, datasetVersion, activeflag };
					arr[datasetIdx].listOfVersions = [...arr[datasetIdx].listOfVersions, versionDetails];
				}
				return arr;
			}, []);

			return res.status(200).json({
				success: true,
				data: { listOfDatasets },
			});
		} catch (err) {
			console.error(err.message);
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

			if (_.isEmpty(dataset.structuralMetadata)) {
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
			console.error(err.message);
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
		if (!_.isNil(dataset.datasetv2.observations) && !_.isEmpty(dataset.datasetv2.observations)) {
			let observations = module.exports.returnAsArray(dataset.datasetv2.observations);
			let uniqueId = '';
			for (let observation of observations) {
				questionAnswers[`properties/observation/observedNode${uniqueId}`] = observation.observedNode.toUpperCase();
				questionAnswers[`properties/observation/measuredValue${uniqueId}`] = observation.measuredValue;
				questionAnswers[`properties/observation/disambiguatingDescription${uniqueId}`] = observation.disambiguatingDescription;
				questionAnswers[`properties/observation/observationDate${uniqueId}`] = module.exports.returnAsDate(observation.observationDate);
				questionAnswers[`properties/observation/measuredProperty${uniqueId}`] = observation.measuredProperty;
				uniqueId = `_${randomstring.generate(5)}`;
			}
		}

		return questionAnswers;
	},

	returnAsArray: value => {
		if (typeof value === 'string') return [value];
		return value;
	},

	returnAsDate: value => {
		if (moment(value, 'DD/MM/YYYY').isValid()) return value;
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

				datasetToCopy.questionAnswers = JSON.parse(datasetToCopy.questionAnswers);
				if (!datasetToCopy.questionAnswers['properties/documentation/description'] && datasetToCopy.description)
					datasetToCopy.questionAnswers['properties/documentation/description'] = datasetToCopy.description;

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
				data.questionAnswers = JSON.stringify(datasetToCopy.questionAnswers);
				data.structuralMetadata = datasetToCopy.structuralMetadata;
				data.percentageCompleted = datasetToCopy.percentageCompleted;
				data.timestamps.created = Date.now();
				data.timestamps.updated = Date.now();
				await data.save();

				return res.status(200).json({ success: true, data: { id: data._id } });
			}
		} catch (err) {
			console.error(err.message);
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

						if (title && title.length >= 2) {
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
			console.error(err.message);
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

			//emails / notifications
			await module.exports.createNotifications(constants.notificationTypes.DATASETSUBMITTED, updatedDataset);

			return res.status(200).json({ status: 'success' });
		} catch (err) {
			console.error(err.message);
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
		if (activeflag === constants.datatsetStatuses.DRAFT || activeflag === constants.applicationStatuses.INREVIEW) {
			await Data.findByIdAndUpdate(_id, updateObj, { new: true }, err => {
				if (err) {
					console.error(err);
					throw err;
				}
			});
			return accessRecord;
			// 3. Else if application has already been submitted make amendment
		} else if (activeflag === constants.applicationStatuses.SUBMITTED) {
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
				let metadataCatalogueLink = process.env.MDC_Config_HDRUK_metadataUrl || 'https://modelcatalogue.cs.ox.ac.uk/hdruk-preprod';
				const loginDetails = {
					username: process.env.MDC_Config_HDRUK_username || '',
					password: process.env.MDC_Config_HDRUK_password || '',
				};

				await axios
					.post(metadataCatalogueLink + '/api/authentication/login', loginDetails, {
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
								metadataCatalogueLink + '/api/dataModels/import/ox.softeng.metadatacatalogue.core.spi.json/JsonImporterService/1.1',
								data,
								{
									withCredentials: true,
									timeout: 60000,
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
									.put(metadataCatalogueLink + `/api/dataModels/${newDatasetVersionId}`, updatedDatasetDetails, {
										withCredentials: true,
										timeout: 20000,
									})
									.catch(err => {
										console.error('Error when trying to update the version number on the MDC - ' + err.message);
									});

								await axios
									.put(metadataCatalogueLink + `/api/dataModels/${newDatasetVersionId}/finalise`, {
										withCredentials: true,
										timeout: 20000,
									})
									.catch(err => {
										console.error('Error when trying to finalise the dataset on the MDC - ' + err.message);
									});

								// Adding to DB
								let observations = await module.exports.buildObservations(dataset.questionAnswers);

								let datasetv2Object = {
									identifier: newDatasetVersionId,
									version: dataset.datasetVersion,
									issued: moment(Date.now()).format('DD/MM/YYYY'),
									modified: moment(Date.now()).format('DD/MM/YYYY'),
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
								let metadataQuality = await module.exports.buildMetadataQuality(dataset, datasetv2Object, dataset.pid);

								let updatedDataset = await Data.findOneAndUpdate(
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
									},
									{ new: true }
								);

								filtersService.optimiseFilters('dataset');

								//emails / notifications
								await module.exports.createNotifications(constants.notificationTypes.DATASETAPPROVED, updatedDataset);
							})
							.catch(err => {
								console.error('Error when trying to create new dataset on the MDC - ' + err.message);
							});
					})
					.catch(err => {
						console.error('Error when trying to login to MDC - ' + err.message);
					});

				await axios.post(metadataCatalogueLink + `/api/authentication/logout`, { withCredentials: true, timeout: 5000 }).catch(err => {
					console.error('Error when trying to logout of the MDC - ' + err.message);
				});

				return res.status(200).json({ status: 'success' });
			} else if (applicationStatus === 'rejected') {
				let updatedDataset = await Data.findOneAndUpdate(
					{ _id: id },
					{
						activeflag: constants.datatsetStatuses.REJECTED,
						applicationStatusDesc: applicationStatusDesc,
						'timestamps.rejected': Date.now(),
						'timestamps.updated': Date.now(),
					},
					{ new: true }
				);

				//emails / notifications
				await module.exports.createNotifications(constants.notificationTypes.DATASETREJECTED, updatedDataset);

				return res.status(200).json({ status: 'success' });
			} else if (applicationStatus === 'archive') {
				let dataset = await Data.findOne({ _id: id }).lean();

				if (dataset.timestamps.submitted) {
					//soft delete from MDC
					let metadataCatalogueLink = process.env.MDC_Config_HDRUK_metadataUrl || 'https://modelcatalogue.cs.ox.ac.uk/hdruk-preprod';

					await axios.post(metadataCatalogueLink + `/api/authentication/logout`, { withCredentials: true, timeout: 5000 }).catch(err => {
						console.error('Error when trying to logout of the MDC - ' + err.message);
					});
					const loginDetails = {
						username: process.env.MDC_Config_HDRUK_username || '',
						password: process.env.MDC_Config_HDRUK_password || '',
					};

					await axios
						.post(metadataCatalogueLink + '/api/authentication/login', loginDetails, {
							withCredentials: true,
							timeout: 5000,
						})
						.then(async session => {
							axios.defaults.headers.Cookie = session.headers['set-cookie'][0]; // get cookie from request

							await axios
								.delete(metadataCatalogueLink + `/api/dataModels/${dataset.datasetid}`, { withCredentials: true, timeout: 5000 })
								.catch(err => {
									console.error('Error when trying to delete(archive) a dataset - ' + err.message);
								});
						})
						.catch(err => {
							console.error('Error when trying to login to MDC - ' + err.message);
						});

					await axios.post(metadataCatalogueLink + `/api/authentication/logout`, { withCredentials: true, timeout: 5000 }).catch(err => {
						console.error('Error when trying to logout of the MDC - ' + err.message);
					});
				}
				await Data.findOneAndUpdate({ _id: id }, { activeflag: constants.datatsetStatuses.ARCHIVE });
				return res.status(200).json({ status: 'success' });
			} else if (applicationStatus === 'unarchive') {
				let dataset = await Data.findOne({ _id: id }).lean();
				let flagIs = 'draft';
				if (dataset.timestamps.submitted) {
					let metadataCatalogueLink = process.env.MDC_Config_HDRUK_metadataUrl || 'https://modelcatalogue.cs.ox.ac.uk/hdruk-preprod';

					await axios.post(metadataCatalogueLink + `/api/authentication/logout`, { withCredentials: true, timeout: 5000 }).catch(err => {
						console.error('Error when trying to logout of the MDC - ' + err.message);
					});
					const loginDetails = {
						username: process.env.MDC_Config_HDRUK_username || '',
						password: process.env.MDC_Config_HDRUK_password || '',
					};

					await axios
						.post(metadataCatalogueLink + '/api/authentication/login', loginDetails, {
							withCredentials: true,
							timeout: 5000,
						})
						.then(async session => {
							axios.defaults.headers.Cookie = session.headers['set-cookie'][0]; // get cookie from request

							const updatedDatasetDetails = {
								deleted: 'false',
							};
							await axios
								.put(metadataCatalogueLink + `/api/dataModels/${dataset.datasetid}`, updatedDatasetDetails, {
									withCredentials: true,
									timeout: 5000,
								})
								.catch(err => {
									console.error('Error when trying to update the version number on the MDC - ' + err.message);
								});
						})
						.catch(err => {
							console.error('Error when trying to login to MDC - ' + err.message);
						});

					await axios.post(metadataCatalogueLink + `/api/authentication/logout`, { withCredentials: true, timeout: 5000 }).catch(err => {
						console.error('Error when trying to logout of the MDC - ' + err.message);
					});

					flagIs = 'active';
				}
				await Data.findOneAndUpdate({ _id: id }, { activeflag: flagIs }); //active or draft
				return res.status(200).json({ status: 'success' });
			}
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
					value: !_.isString(dataset.questionAnswers[item]) ? JSON.stringify(dataset.questionAnswers[item]) : dataset.questionAnswers[item],
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
				description: dataset.questionAnswers['properties/documentation/description'] || dataset.questionAnswers['summary/abstract'],
				type: 'Data Asset',
				metadata: metadata,
				childDataClasses: childDataClasses,
			},
		};

		return jsonFile;
	},

	//GET api/v1/dataset-onboarding/checkUniqueTitle
	checkUniqueTitle: async (req, res) => {
		let { pid, title = '' } = req.query;
		let regex = new RegExp(`^${title}$`, 'i');
		let dataset = await Data.findOne({ name: regex, pid: { $ne: pid } });
		return res.status(200).json({ isUniqueTitle: dataset ? false : true });
	},

	//GET api/v1/dataset-onboarding/metaddataQuality
	getMetadataQuality: async (req, res) => {
		try {
			let { pid = '', datasetID = '', recalculate = false } = req.query;

			let dataset = {};

			if (!_.isEmpty(pid)) {
				dataset = await Data.findOne({ pid, activeflag: 'active' }).lean();
				if (!_.isEmpty(datasetID)) dataset = await Data.findOne({ pid: datasetID, activeflag: 'archive' }).sort({ createdAt: -1 });
			} else if (!_.isEmpty(datasetID)) dataset = await Data.findOne({ datasetid: { datasetID } }).lean();

			if (_.isEmpty(dataset)) return res.status(404).json({ status: 'error', message: 'Dataset could not be found.' });

			let metaddataQuality = {};

			if (recalculate) {
				metaddataQuality = await module.exports.buildMetadataQuality(dataset, dataset.datasetv2, dataset.pid);
				await Data.findOneAndUpdate({ _id: dataset._id }, { 'datasetfields.metadataquality': metaddataQuality });
			} else {
				metaddataQuality = dataset.datasetfields.metadataquality;
			}

			return res.status(200).json({ metaddataQuality });
		} catch (err) {
			console.error(err.message);
			res.status(500).json({ status: 'error', message: err.message });
		}
	},

	buildMetadataQuality: async (dataset, v2Object, pid) => {
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
			pid: dataset.pid,
			id: dataset.datasetid,
			publisher: dataset.datasetv2.summary.publisher.name,
			title: dataset.name,
			weighted_quality_rating: 'Not Rated',
			weighted_quality_score: 0,
			weighted_completeness_percent: 0,
			weighted_error_percent: 0,
		};

		metadataquality.pid = pid;
		metadataquality.id = v2Object.identifier;
		metadataquality.publisher = v2Object.summary.publisher.memberOf + ' > ' + v2Object.summary.publisher.name;
		metadataquality.title = v2Object.summary.title;

		let completeness = [];
		let totalCount = 0,
			totalWeight = 0;

		Object.entries(weights).forEach(([key, weight]) => {
			let [parentKey, subKey] = key.split('.');

			if (parentKey === 'structuralMetadata') {
				if (subKey === 'dataClassesCount') {
					if (!_.isEmpty(dataset.structuralMetadata)) {
						completeness.push({ value: 'structuralMetadata.dataClassesCount', weight, score: weight });
						totalCount++;
						totalWeight += weight;
					}
				} else if (subKey === 'tableName') {
					if (_.isEmpty(dataset.structuralMetadata.filter(data => !data.tableName))) {
						completeness.push({ value: 'structuralMetadata.tableName', weight, score: weight });
						totalCount++;
						totalWeight += weight;
					}
				} else if (subKey === 'tableDescription') {
					if (_.isEmpty(dataset.structuralMetadata.filter(data => !data.tableDescription))) {
						completeness.push({ value: 'structuralMetadata.tableDescription', weight, score: weight });
						totalCount++;
						totalWeight += weight;
					}
				} else if (subKey === 'columnName') {
					if (_.isEmpty(dataset.structuralMetadata.filter(data => !data.columnName))) {
						completeness.push({ value: 'structuralMetadata.columnName', weight, score: weight });
						totalCount++;
						totalWeight += weight;
					}
				} else if (subKey === 'columnDescription') {
					if (_.isEmpty(dataset.structuralMetadata.filter(data => !data.columnDescription))) {
						completeness.push({ value: 'structuralMetadata.columnDescription', weight, score: weight });
						totalCount++;
						totalWeight += weight;
					}
				} else if (subKey === 'dataType') {
					if (_.isEmpty(dataset.structuralMetadata.filter(data => !data.dataType))) {
						completeness.push({ value: 'structuralMetadata.dataType', weight, score: weight });
						totalCount++;
						totalWeight += weight;
					}
				} else if (subKey === 'sensitive') {
					if (_.isEmpty(dataset.structuralMetadata.filter(data => !data.sensitive))) {
						completeness.push({ value: 'structuralMetadata.sensitive', weight, score: weight });
						totalCount++;
						totalWeight += weight;
					}
				}
			} else if (parentKey === 'observation') {
				if (subKey === 'observedNode') {
					if (_.isEmpty(v2Object.observations.filter(data => !data.observedNode))) {
						completeness.push({ value: 'observation.observedNode', weight, score: weight });
						totalCount++;
						totalWeight += weight;
					}
				} else if (subKey === 'measuredValue') {
					if (_.isEmpty(v2Object.observations.filter(data => !data.measuredValue))) {
						completeness.push({ value: 'observation.measuredValue', weight, score: weight });
						totalCount++;
						totalWeight += weight;
					}
				} else if (subKey === 'disambiguatingDescription') {
					if (_.isEmpty(v2Object.observations.filter(data => !data.disambiguatingDescription))) {
						completeness.push({ value: 'observation.disambiguatingDescription', weight, score: weight });
						totalCount++;
						totalWeight += weight;
					}
				} else if (subKey === 'observationDate') {
					if (_.isEmpty(v2Object.observations.filter(data => !data.observationDate))) {
						completeness.push({ value: 'observation.observationDate', weight, score: weight });
						totalCount++;
						totalWeight += weight;
					}
				} else if (subKey === 'measuredProperty') {
					if (_.isEmpty(v2Object.observations.filter(data => !data.measuredProperty))) {
						completeness.push({ value: 'observation.measuredProperty', weight, score: weight });
						totalCount++;
						totalWeight += weight;
					}
				}
			} else {
				let datasetValue = module.exports.getDatatsetValue(v2Object, key);

				if (datasetValue) {
					completeness.push({ value: datasetValue, weight, score: weight });
					totalCount++;
					totalWeight += weight;
				} else {
					completeness.push({ value: datasetValue, weight, score: 0 });
				}
			}
			//special rules around provenance.temporal.accrualPeriodicity = CONTINUOUS
		});

		let schema = {};

		let rawdata = fs.readFileSync(__dirname + '/schema.json');
		schema = JSON.parse(rawdata);

		const ajv = new Ajv({ strict: false, allErrors: true });
		addFormats(ajv);
		const validate = ajv.compile(schema);
		validate(v2Object);

		let errors = [];
		let errorCount = 0,
			errorWeight = 0;

		Object.entries(weights).forEach(([key, weight]) => {
			let updatedKey = '/' + key.replace(/\./g, '/');

			let errorIndex = Object.keys(validate.errors).find(key => validate.errors[key].instancePath === updatedKey);
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

	createNotifications: async (type, context) => {
		let options = {},
			html = '',
			team,
			teamMembers = [],
			teamMembersDetails,
			teamMembersIds = [];

		switch (type) {
			case constants.notificationTypes.DATASETSUBMITTED:
				// 1. Get user removed
				let adminTeam = await TeamModel.findOne({ type: 'admin' }).lean();

				let adminMembers = [];
				for (let member of adminTeam.members) {
					adminMembers.push(member.memberid);
				}

				let adminMembersDetails = await UserModel.find({ _id: { $in: adminMembers } })
					.populate('additionalInfo')
					.lean();

				let adminMembersIds = [];
				for (let member of adminMembersDetails) {
					adminMembersIds.push(member.id);
				}

				// 2. Create user notifications
				notificationBuilder.triggerNotificationMessage(
					adminMembersIds,
					context.datasetVersion !== '1.0.0'
						? `A new dataset version for "${context.name}" is available for review`
						: `A new dataset "${context.name}" is available for review`,
					'dataset submitted',
					context._id
				);
				// 3. Create email
				options = {
					name: context.name,
					publisher: context.datasetv2.summary.publisher.name,
				};
				html = emailGenerator.generateMetadataOnboardingSumbitted(options);
				emailGenerator.sendEmail(adminMembersDetails, constants.hdrukEmail, `Dataset version available for review`, html, false);
				break;
			case constants.notificationTypes.DATASETAPPROVED:
				// 1. Get user removed
				team = await TeamModel.findOne({ _id: context.datasetv2.summary.publisher.identifier }).lean();

				for (let member of team.members) {
					if (member.roles.some(role => ['manager', 'metadata_editor'].includes(role))) teamMembers.push(member.memberid);
				}

				teamMembersDetails = await UserModel.find({ _id: { $in: teamMembers } })
					.populate('additionalInfo')
					.lean();

				for (let member of teamMembersDetails) {
					teamMembersIds.push(member.id);
				}
				// 2. Create user notifications
				notificationBuilder.triggerNotificationMessage(
					teamMembersIds,
					context.datasetVersion !== '1.0.0'
						? `Your dataset version for "${context.name}" has been approved and is now active`
						: `A dataset "${context.name}" has been approved and is now active`,
					'dataset approved',
					context.pid
				);
				// 3. Create email
				options = {
					name: context.name,
					publisherId: context.datasetv2.summary.publisher.identifier,
					comment: context.applicationStatusDesc,
				};
				html = emailGenerator.generateMetadataOnboardingApproved(options);
				emailGenerator.sendEmail(
					teamMembersDetails,
					constants.hdrukEmail,
					`Your dataset version has been approved and is now active`,
					html,
					false
				);
				break;
			case constants.notificationTypes.DATASETREJECTED:
				// 1. Get user removed
				team = await TeamModel.findOne({ _id: context.datasetv2.summary.publisher.identifier }).lean();

				for (let member of team.members) {
					teamMembers.push(member.memberid);
				}

				teamMembersDetails = await UserModel.find({ _id: { $in: teamMembers } })
					.populate('additionalInfo')
					.lean();

				for (let member of team.members) {
					if (member.roles.some(role => ['manager', 'metadata_editor'].includes(role))) teamMembers.push(member.memberid);
				}
				// 2. Create user notifications
				notificationBuilder.triggerNotificationMessage(
					teamMembersIds,
					context.datasetVersion !== '1.0.0'
						? `Your dataset version for "${context.name}" has been reviewed and rejected`
						: `A dataset "${context.name}" has been reviewed and rejected`,
					'dataset rejected',
					context.datasetv2.summary.publisher.identifier
				);
				// 3. Create email
				options = {
					name: context.name,
					publisherId: context.datasetv2.summary.publisher.identifier,
					comment: context.applicationStatusDesc,
				};
				html = emailGenerator.generateMetadataOnboardingRejected(options);
				emailGenerator.sendEmail(
					teamMembersDetails,
					constants.hdrukEmail,
					`Your dataset version has been reviewed and rejected`,
					html,
					false
				);
				break;
		}
	},
};
