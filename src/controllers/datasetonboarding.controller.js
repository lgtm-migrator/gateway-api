var fs = require('fs');
import _ from 'lodash';
import axios from 'axios';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/node';
import { isEmpty, escapeRegExp } from 'lodash';

import { Data } from '../resources/tool/data.model';
import constants from '../resources/utilities/constants.util';
import { filtersService } from '../resources/filters/dependency';
import datasetonboardingUtil from '../utils/datasetonboarding.util';
import { PublisherModel } from '../resources/publisher/publisher.model';
import { activityLogService } from '../resources/activitylog/dependency';
const HttpClient = require('../services/httpClient/httpClient');

const readEnv = process.env.ENV || 'prod';

export default class DatasetOnboardingController {
	constructor(datasetonboardingService) {
		this.datasetonboardingService = datasetonboardingService;
	}

	getDatasetsByPublisher = async (req, res) => {
		const activeflagOptions = Object.values(constants.datasetStatuses);

		try {
			let {
				params: { publisherID },
				query: { search, page, limit, sortBy, sortDirection, status },
			} = req;

			let statusArray = activeflagOptions;

			if (status) {
				statusArray = status.split(',');
			}

			const totalCounts = await this.datasetonboardingService.getDatasetsByPublisherCounts(publisherID);

			const [versionedDatasets, count] = await this.datasetonboardingService.getDatasetsByPublisher(
				statusArray,
				publisherID,
				page,
				limit,
				sortBy,
				sortDirection,
				search
			);

			const pageCount = Math.ceil(count / limit);

			return res.status(200).json({
				success: true,
				data: {
					publisherTotals: totalCounts,
					results: {
						'activeflag(s)': [...new Set(statusArray)].join(', '),
						total: count,
						currentPage: page,
						totalPages: pageCount,
						listOfDatasets: versionedDatasets,
					},
				},
			});
		} catch (err) {
			process.stdout.write(`${err.message}\n`);
			res.status(500).json({ success: false, message: err.message });
		}
	};

	getDatasetVersion = async (req, res) => {
		try {
			const id = req.params.id;

			if (_.isEmpty(id)) {
				return res.status(404).json({ success: false, message: 'A valid dataset ID was not supplied' });
			}

			const dataset = await this.datasetonboardingService.getDatasetVersion(id);

			const listOfDatasets = await this.datasetonboardingService.getAssociatedVersions(dataset.pid);

			return res.status(200).json({
				success: true,
				data: { dataset },
				listOfDatasets,
			});
		} catch (err) {
			process.stdout.write(`${err.message}\n`);
			res.status(500).json({ success: false, message: err.message });
		}
	};

	createNewDatasetVersion = async (req, res) => {
		try {
			const pid = req.body.pid || null;
			const publisherID = req.body.publisherID || null;
			const currentVersionId = req.body.currentVersionId || null;

			let { authorised } = await datasetonboardingUtil.getUserPermissionsForDataset(null, req.user, publisherID);

			if (!authorised) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}

			if (!publisherID) {
				return res.status(404).json({ status: 'error', message: 'Dataset publisher could not be found.' });
			}

			const [data, error] = await this.datasetonboardingService.createNewDatasetVersion(publisherID, pid, currentVersionId);

			if (error) {
				if (error === 'existingDataset') {
					return res.status(200).json({ success: true, data: { id: data._id, draftExists: true } });
				}
				if (error === 'missingVersion') {
					return res.status(404).json({ status: 'error', message: 'Dataset to copy is not found' });
				}
			}

			return res.status(200).json({ success: true, data: { id: data._id } });
		} catch (err) {
			process.stdout.write(`${err.message}\n`);
			res.status(500).json({ status: 'error', message: err.message });
		}
	};

	updateDatasetVersionDataElement = async (req, res) => {
		try {
			const {
				params: { id },
				body: data,
			} = req;

			let { authorised } = await datasetonboardingUtil.getUserPermissionsForDataset(id, req.user);

			if (!authorised) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}

			let dataset = await Data.findOne({ _id: id });

			if (!dataset) {
				return res.status(404).json({ status: 'error', message: 'Dataset not found.' });
			}

			let updateObj = datasetonboardingUtil.buildUpdateObject({
				...data,
				user: req.user,
			});

			if (isEmpty(updateObj)) {
				if (data.key !== 'structuralMetadata') {
					return res.status(404).json({ status: 'error', message: 'Update failed' });
				} else {
					let structuralMetadata = JSON.parse(data.rows);

					if (isEmpty(structuralMetadata)) {
						return res.status(404).json({ status: 'error', message: 'Update failed' });
					} else {
						await this.datasetonboardingService.updateStructuralMetadata(structuralMetadata, data.percentageCompleted, id);
						return res.status(200).json();
					}
				}
			} else {
				let response = await this.datasetonboardingService.updateDatasetVersionDataElement(dataset, updateObj, id);

				return res.status(200).json(response);
			}
		} catch (err) {
			process.stdout.write(`${err.message}\n`);
			res.status(500).json({ status: 'error', message: err.message });
		}
	};

	submitDatasetVersion = async (req, res) => {
		try {
			// 1. id is the _id object in mongoo.db not the generated id or dataset Id
			const id = req.params.id || null;

			if (!id) return res.status(404).json({ status: 'error', message: 'Dataset _id could not be found.' });

			// 3. Check user type and authentication to submit dataset
			let { authorised } = await datasetonboardingUtil.getUserPermissionsForDataset(id, req.user);
			if (!authorised) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}

			const [updatedDataset, dataset, datasetv2Object] = await this.datasetonboardingService.submitDatasetVersion(id);

			await datasetonboardingUtil.createNotifications(constants.notificationTypes.DATASETSUBMITTED, updatedDataset);

			await activityLogService.logActivity(constants.activityLogEvents.dataset.DATASET_VERSION_SUBMITTED, {
				type: constants.activityLogTypes.DATASET,
				updatedDataset,
				user: req.user,
			});

			if (parseInt(updatedDataset.datasetVersion) !== 1) {
				let datasetv2DifferenceObject = datasetonboardingUtil.datasetv2ObjectComparison(datasetv2Object, dataset.datasetv2);

				if (!_.isEmpty(datasetv2DifferenceObject)) {
					await activityLogService.logActivity(constants.activityLogEvents.dataset.DATASET_UPDATES_SUBMITTED, {
						type: constants.activityLogTypes.DATASET,
						updatedDataset,
						user: req.user,
						differences: datasetv2DifferenceObject,
					});
				}
			}

			return res.status(200).json({ status: 'success' });
		} catch (err) {
			process.stdout.write(`${err.message}\n`);
			res.status(500).json({ status: 'error', message: err.message });
		}
	};

	changeDatasetVersionStatus = async (req, res) => {
		const id = req.params.id || null;
		if (!id) {
			return res.status(404).json({
				status: 'error',
				message: 'Dataset _id could not be found.',
			});
		}

		let { firstname, lastname } = req.user;
		let { applicationStatus, applicationStatusDesc = '' } = req.body;

		let { authorised, userType } = await datasetonboardingUtil.getUserPermissionsForDataset(id, req.user);
		if (!authorised) {
			return res.status(401).json({
				status: 'failure',
				message: 'Unauthorised',
			});
		}

		try {
			let metadataCatalogueLink = process.env.MDC_Config_HDRUK_metadataUrl || 'https://modelcatalogue.cs.ox.ac.uk/hdruk-preprod';
			const loginDetails = {
				username: process.env.MDC_Config_HDRUK_username || '',
				password: process.env.MDC_Config_HDRUK_password || '',
			};
			let updatedDataset = null;
			let dataset = null;
			let activityLogStatus = null;

			const _httpClient = new HttpClient();
			switch (applicationStatus) {
				case 'approved':
					if (userType !== constants.userTypes.ADMIN) {
						return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
					}

					dataset = await Data.findOne({ _id: id });

					if (!dataset) return res.status(404).json({ status: 'error', message: 'Dataset could not be found.' });

					dataset.questionAnswers = JSON.parse(dataset.questionAnswers);
					const publisherData = await PublisherModel.find({ _id: dataset.datasetv2.summary.publisher.identifier }).lean();

					await _httpClient.post(metadataCatalogueLink + `/api/authentication/logout`, null, { withCredentials: true, timeout: 5000 });
					const responseLogin = await _httpClient.post(metadataCatalogueLink + '/api/authentication/login', loginDetails, {
						withCredentials: true,
						timeout: 5000,
					});
					const [cookie] = responseLogin.headers['set-cookie'];
					_httpClient.setHttpClientCookies(cookie);

					let jsonData = JSON.stringify(await datasetonboardingUtil.buildJSONFile(dataset));
					fs.writeFileSync(__dirname + `/datasetfiles/${dataset._id}.json`, jsonData);

					var data = new FormData();
					data.append('folderId', publisherData[0].mdcFolderId);
					data.append('importFile', fs.createReadStream(__dirname + `/datasetfiles/${dataset._id}.json`));
					data.append('finalised', 'false');
					data.append('importAsNewDocumentationVersion', 'true');

					const responseImport = await _httpClient.post(
						metadataCatalogueLink + '/api/dataModels/import/ox.softeng.metadatacatalogue.core.spi.json/JsonImporterService/1.1',
						data,
						{
							withCredentials: true,
							timeout: 60000,
							headers: {
								...data.getHeaders(),
							},
						}
					);

					let newDatasetVersionId = responseImport.data.items[0].id;
					fs.unlinkSync(__dirname + `/datasetfiles/${dataset._id}.json`);

					const updatedDatasetDetails = {
						documentationVersion: dataset.datasetVersion,
					};

					await _httpClient.put(metadataCatalogueLink + `/api/dataModels/${newDatasetVersionId}`, updatedDatasetDetails, {
						withCredentials: true,
						timeout: 20000,
					});
					await _httpClient.put(metadataCatalogueLink + `/api/dataModels/${newDatasetVersionId}/finalise`, null, {
						withCredentials: true,
						timeout: 20000,
					});

					// Adding to DB
					let datasetv2Object = await datasetonboardingUtil.buildv2Object(dataset, newDatasetVersionId);

					let previousDataset = await Data.findOneAndUpdate({ pid: dataset.pid, activeflag: 'active' }, { activeflag: 'archive' });
					let previousCounter = 0;
					let previousDiscourseTopicId = 0;
					if (previousDataset) previousCounter = previousDataset.counter || 0;
					if (previousDataset) previousDiscourseTopicId = previousDataset.discourseTopicId || 0;

					//get technicaldetails and metadataQuality
					let technicalDetails = await datasetonboardingUtil.buildTechnicalDetails(dataset.structuralMetadata);
					let metadataQuality = await datasetonboardingUtil.buildMetadataQuality(dataset, datasetv2Object, dataset.pid);

					// call filterCommercialUsage to determine commericalUse field only pass in v2 a
					let commercialUse = filtersService.computeCommericalUse({}, datasetv2Object);

					updatedDataset = await Data.findOneAndUpdate(
						{ _id: id },
						{
							datasetid: newDatasetVersionId,
							datasetVersion: dataset.datasetVersion,
							name: dataset.questionAnswers['properties/summary/title'] || '',
							description: dataset.questionAnswers['properties/documentation/abstract'] || '',
							activeflag: 'active',
							tags: {
								features: dataset.questionAnswers['properties/summary/keywords'] || [],
							},
							commercialUse,
							hasTechnicalDetails: !isEmpty(technicalDetails) ? true : false,
							'timestamps.updated': Date.now(),
							'timestamps.published': Date.now(),
							counter: previousCounter,
							datasetfields: {
								publisher: `${publisherData[0].publisherDetails.memberOf} > ${publisherData[0].publisherDetails.name}`,
								geographicCoverage: dataset.questionAnswers['properties/coverage/spatial'] || [],
								physicalSampleAvailability: dataset.questionAnswers['properties/coverage/physicalSampleAvailability'] || [],
								abstract: dataset.questionAnswers['properties/summary/abstract'] || '',
								releaseDate: dataset.questionAnswers['properties/provenance/temporal/distributionReleaseDate'] || '',
								accessRequestDuration: dataset.questionAnswers['properties/accessibility/access/deliveryLeadTime'] || '',
								datasetStartDate: dataset.questionAnswers['properties/provenance/temporal/startDate'] || '',
								datasetEndDate: dataset.questionAnswers['properties/provenance/temporal/endDate'] || '',
								ageBand: dataset.questionAnswers['properties/coverage/typicalAgeRange'] || '',
								contactPoint: dataset.questionAnswers['properties/summary/contactPoint'] || '',
								periodicity: dataset.questionAnswers['properties/provenance/temporal/accrualPeriodicity'] || '',
								metadataquality: metadataQuality,
								technicaldetails: technicalDetails,
								phenotypes: [],
							},
							datasetv2: datasetv2Object,
							applicationStatusDesc: applicationStatusDesc,
							discourseTopicId: previousDiscourseTopicId,
						},
						{ new: true }
					);

					filtersService.optimiseFilters('dataset');

					let datasetv2DifferenceObject = datasetonboardingUtil.datasetv2ObjectComparison(datasetv2Object, dataset.datasetv2);

					if (!_.isEmpty(datasetv2DifferenceObject)) {
						await activityLogService.logActivity(constants.activityLogEvents.dataset.DATASET_UPDATES_SUBMITTED, {
							type: constants.activityLogTypes.DATASET,
							updatedDataset,
							user: req.user,
							differences: datasetv2DifferenceObject,
						});
					}

					//emails / notifications
					await datasetonboardingUtil.createNotifications(constants.notificationTypes.DATASETAPPROVED, updatedDataset);

					activityLogStatus = constants.activityLogEvents.dataset.DATASET_VERSION_APPROVED;

					await _httpClient.post(metadataCatalogueLink + `/api/authentication/logout`, null, { withCredentials: true, timeout: 5000 });

					break;
				case 'rejected':
					if (userType !== constants.userTypes.ADMIN) {
						return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
					}

					updatedDataset = await Data.findOneAndUpdate(
						{ _id: id },
						{
							activeflag: constants.datasetStatuses.REJECTED,
							applicationStatusDesc: applicationStatusDesc,
							applicationStatusAuthor: `${firstname} ${lastname}`,
							'timestamps.rejected': Date.now(),
							'timestamps.updated': Date.now(),
						},
						{ new: true }
					);

					//emails / notifications
					await datasetonboardingUtil.createNotifications(constants.notificationTypes.DATASETREJECTED, updatedDataset);

					activityLogStatus = constants.activityLogEvents.dataset.DATASET_VERSION_REJECTED;

					break;
				case 'archive':
					dataset = await Data.findOne({ _id: id }).lean();

					if (dataset.timestamps.submitted) {
						await _httpClient.post(metadataCatalogueLink + `/api/authentication/logout`, null, { withCredentials: true, timeout: 5000 });

						const responseLogin = await _httpClient.post(metadataCatalogueLink + '/api/authentication/login', loginDetails, {
							withCredentials: true,
							timeout: 5000,
						});
						const [cookie] = responseLogin.headers['set-cookie'];
						_httpClient.setHttpClientCookies(cookie);

						await _httpClient.delete(metadataCatalogueLink + `/api/dataModels/${dataset.datasetid}`, loginDetails, {
							withCredentials: true,
							timeout: 5000,
						});

						await _httpClient.post(metadataCatalogueLink + `/api/authentication/logout`, null, { withCredentials: true, timeout: 5000 });
					}
					updatedDataset = await Data.findOneAndUpdate(
						{ _id: id },
						{ activeflag: constants.datasetStatuses.ARCHIVE, 'timestamps.updated': Date.now(), 'timestamps.archived': Date.now() }
					);

					activityLogStatus = constants.activityLogEvents.dataset.DATASET_VERSION_ARCHIVED;

					break;
				case 'unarchive':
					dataset = await Data.findOne({ _id: id }).lean();
					let flagIs = 'draft';
					if (dataset.timestamps.submitted) {
						await _httpClient.post(metadataCatalogueLink + `/api/authentication/logout`, null, { withCredentials: true, timeout: 5000 });

						const responseLogin = await _httpClient.post(metadataCatalogueLink + '/api/authentication/login', loginDetails, {
							withCredentials: true,
							timeout: 5000,
						});
						const [cookie] = responseLogin.headers['set-cookie'];
						_httpClient.setHttpClientCookies(cookie);

						const updatedDatasetDetails = {
							deleted: 'false',
						};

						await _httpClient.put(
							metadataCatalogueLink + metadataCatalogueLink + `/api/dataModels/${dataset.datasetid}`,
							updatedDatasetDetails,
							{ withCredentials: true, timeout: 5000 }
						);

						await _httpClient.post(metadataCatalogueLink + `/api/authentication/logout`, null, { withCredentials: true, timeout: 5000 });

						flagIs = 'active';
					}
					updatedDataset = await Data.findOneAndUpdate({ _id: id }, { activeflag: flagIs }); //active or draft

					activityLogStatus = constants.activityLogEvents.dataset.DATASET_VERSION_UNARCHIVED;

					break;
				default:
					res.status(500).json({
						status: 'error',
						message: 'An error occurred - application status is not set correctly',
					});
			}

			await activityLogService.logActivity(activityLogStatus, {
				type: constants.activityLogTypes.DATASET,
				updatedDataset,
				user: req.user,
			});

			return res.status(200).json({ status: 'success' });
		} catch (err) {
			res.status(500).json({
				status: 'error',
				message: 'An error occurred updating the dataset status',
			});
		}
	};

	checkUniqueTitle = async (req, res) => {
		let { pid, title = '' } = req.query;
		let regex = new RegExp(`^${escapeRegExp(title)}$`, 'i');

		const dataset = await this.datasetonboardingService.checkUniqueTitle(regex, pid);

		return res.status(200).json({ isUniqueTitle: dataset ? false : true });
	};

	getMetadataQuality = async (req, res) => {
		try {
			let { pid = '', datasetID = '', recalculate = false } = req.query;

			const metadataQuality = await this.datasetonboardingService.getMetadataQuality(pid, datasetID, recalculate);

			return res.status(200).json({ metadataQuality });
		} catch (err) {
			process.stdout.write(`${err.message}\n`);
			res.status(500).json({ status: 'error', message: err.message });
		}
	};

	deleteDraftDataset = async (req, res) => {
		try {
			let id = req.params.id;

			let { authorised } = await datasetonboardingUtil.getUserPermissionsForDataset(id, req.user);
			if (!authorised) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}

			const [dataset, draftDatasetName] = await this.datasetonboardingService.deleteDraftDataset(id);

			await datasetonboardingUtil.createNotifications(constants.notificationTypes.DRAFTDATASETDELETED, dataset);

			return res.status(200).json({
				success: true,
				data: draftDatasetName,
			});
		} catch (err) {
			process.stdout.write(`${err.message}\n`);
			res.status(500).json({ status: 'error', message: err.message });
		}
	};

	bulkUpload = async (req, res) => {
		try {
			let key = req.body.key;
			// Check for key
			if (!key) {
				return res.status(400).json({ success: false, error: 'Bulk upload of metadata could not be started' });
			}
			// Check that key matches
			if (key !== process.env.METADATA_BULKUPLOAD_KEY) {
				return res.status(400).json({ success: false, error: 'Bulk upload of metadata could not be started' });
			}

			//Check for file
			if (isEmpty(req.file)) {
				return res.status(404).json({ success: false, message: 'For bulk upload of metadata you must supply a JSON file' });
			}

			let arrayOfDraftDatasets = [];
			try {
				arrayOfDraftDatasets = JSON.parse(req.file.buffer);
			} catch {
				return res.status(400).json({ success: false, message: 'Unable to read JSON file' });
			}

			if (!isEmpty(arrayOfDraftDatasets)) {
				//Build bulk upload object
				const resultObject = await datasetonboardingUtil.buildBulkUploadObject(arrayOfDraftDatasets);

				if (resultObject.result === true) {
					for (let dataset of resultObject.datasets) {
						//Build publisher object
						let publisherObject = {
							summary: {
								publisher: {
									identifier: dataset.publisher._id.toString(),
									name: dataset.publisher.publisherDetails.name,
									memberOf: dataset.publisher.publisherDetails.memberOf,
								},
							},
						};

						//Create new pid if needed
						if (isEmpty(dataset.pid)) {
							while (dataset.pid === '') {
								dataset.pid = uuidv4();
								if ((await Data.find({ pid: dataset.pid }).length) === 0) dataset.pid = '';
							}
						}

						//Create new uniqueID
						let uniqueID = '';
						while (uniqueID === '') {
							uniqueID = parseInt(Math.random().toString().replace('0.', ''));
							if ((await Data.find({ id: uniqueID }).length) === 0) uniqueID = '';
						}

						//Create DB entry
						let data = new Data();
						data.pid = dataset.pid;
						data.datasetVersion = dataset.version || '1.0.0';
						data.id = uniqueID;
						data.datasetid = 'New dataset';
						data.name = dataset.title;
						data.datasetv2 = publisherObject;
						data.type = 'dataset';
						data.activeflag = 'draft';
						data.source = 'HDRUK MDC';
						data.is5Safes = dataset.publisher.uses5Safes;
						data.timestamps.created = Date.now();
						data.timestamps.updated = Date.now();
						data.questionAnswers = JSON.stringify(dataset.questionAnswers);
						data.structuralMetadata = [...dataset.structuralMetadata];
						await data.save();
					}
					return res.status(200).json({ success: true, message: 'Bulk upload of metadata completed' });
				} else {
					return res.status(400).json({ success: false, message: 'Bulk upload of metadata failed', error: resultObject.error });
				}
			} else {
				return res.status(400).json({ success: false, message: 'No metadata found' });
			}
		} catch (err) {
			if (readEnv === 'test' || readEnv === 'prod') {
				Sentry.captureException(err);
			}
			process.stdout.write(`${err.message}\n`);
			return res.status(500).json({ success: false, message: 'Bulk upload of metadata failed', error: err.message });
		}
	};

	duplicateDataset = async (req, res) => {
		try {
			let id = req.params.id;

			let { authorised } = await datasetonboardingUtil.getUserPermissionsForDataset(id, req.user);

			if (!authorised) {
				return res.status(401).json({ status: 'failure', message: 'Unauthorised' });
			}

			const dataset = await this.datasetonboardingService.duplicateDataset(id);

			await datasetonboardingUtil.createNotifications(constants.notificationTypes.DATASETDUPLICATED, dataset);

			return res.status(200).json({
				success: true,
				datasetName: dataset.name,
			});
		} catch (err) {
			process.stdout.write(`${err.message}\n`);
			res.status(500).json({ status: 'error', message: err.message });
		}
	};
}
