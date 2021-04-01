import { Data } from '../../tool/data.model';
import { MetricsData } from '../../stats/metrics.model';
import axios from 'axios';
import * as Sentry from '@sentry/node';
import { v4 as uuidv4 } from 'uuid';
import { PublisherModel } from '../../publisher/publisher.model';

export async function loadDataset(datasetID) {
	var metadataCatalogueLink = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
	const datasetCall = axios
		.get(metadataCatalogueLink + '/api/facets/' + datasetID + '/profile/uk.ac.hdrukgateway/HdrUkProfilePluginService', { timeout: 5000 })
		.catch(err => {
			console.error('Unable to get dataset details ' + err.message);
		});
	const metadataQualityCall = axios
		.get('https://raw.githubusercontent.com/HDRUK/datasets/master/reports/metadata_quality.json', { timeout: 5000 })
		.catch(err => {
			console.error('Unable to get metadata quality value ' + err.message);
		});
	const metadataSchemaCall = axios
		.get(metadataCatalogueLink + '/api/profiles/uk.ac.hdrukgateway/HdrUkProfilePluginService/schema.org/' + datasetID, { timeout: 5000 })
		.catch(err => {
			console.error('Unable to get metadata schema ' + err.message);
		});
	const dataClassCall = axios.get(metadataCatalogueLink + '/api/dataModels/' + datasetID + '/dataClasses', { timeout: 5000 }).catch(err => {
		console.error('Unable to get dataclass ' + err.message);
	});
	const versionLinksCall = axios
		.get(metadataCatalogueLink + '/api/catalogueItems/' + datasetID + '/semanticLinks', { timeout: 5000 })
		.catch(err => {
			console.error('Unable to get version links ' + err.message);
		});
	const phenotypesCall = await axios
		.get('https://raw.githubusercontent.com/spiros/hdr-caliber-phenome-portal/master/_data/dataset2phenotypes.json', { timeout: 5000 })
		.catch(err => {
			console.error('Unable to get phenotypes ' + err.message);
		});
	const dataUtilityCall = await axios
		.get('https://raw.githubusercontent.com/HDRUK/datasets/master/reports/data_utility.json', { timeout: 5000 })
		.catch(err => {
			console.error('Unable to get data utility ' + err.message);
		});
	const datasetV2Call = axios
		.get(metadataCatalogueLink + '/api/facets/' + datasetID + '/metadata?all=true', { timeout: 5000 })
		.catch(err => {
			console.error('Unable to get dataset version 2 ' + err.message);
		});
	const [
		dataset,
		metadataQualityList,
		metadataSchema,
		dataClass,
		versionLinks,
		phenotypesList,
		dataUtilityList,
		datasetV2,
	] = await axios.all([
		datasetCall,
		metadataQualityCall,
		metadataSchemaCall,
		dataClassCall,
		versionLinksCall,
		phenotypesCall,
		dataUtilityCall,
		datasetV2Call,
	]);

	var technicaldetails = [];

	await dataClass.data.items.reduce(
		(p, dataclassMDC) =>
			p.then(
				() =>
					new Promise(resolve => {
						setTimeout(async function () {
							const dataClassElementCall = axios
								.get(metadataCatalogueLink + '/api/dataModels/' + datasetID + '/dataClasses/' + dataclassMDC.id + '/dataElements', {
									timeout: 5000,
								})
								.catch(err => {
									console.error('Unable to get dataclass element ' + err.message);
								});
							const [dataClassElement] = await axios.all([dataClassElementCall]);
							var dataClassElementArray = [];

							dataClassElement.data.items.forEach(element => {
								dataClassElementArray.push({
									id: element.id,
									domainType: element.domainType,
									label: element.label,
									description: element.description,
									dataType: {
										id: element.dataType.id,
										domainType: element.dataType.domainType,
										label: element.dataType.label,
									},
								});
							});

							technicaldetails.push({
								id: dataclassMDC.id,
								domainType: dataclassMDC.domainType,
								label: dataclassMDC.label,
								description: dataclassMDC.description,
								elements: dataClassElementArray,
							});

							resolve(null);
						}, 500);
					})
			),
		Promise.resolve(null)
	);

	let datasetv2Object = populateV2datasetObject(datasetV2.data.items);

	let uuid = uuidv4();
	let listOfVersions = [];
	let pid = uuid;
	let datasetVersion = '0.0.1';

	if (versionLinks && versionLinks.data && versionLinks.data.items && versionLinks.data.items.length > 0) {
		versionLinks.data.items.forEach(item => {
			if (!listOfVersions.find(x => x.id === item.source.id)) {
				listOfVersions.push({ id: item.source.id, version: item.source.documentationVersion });
			}
			if (!listOfVersions.find(x => x.id === item.target.id)) {
				listOfVersions.push({ id: item.target.id, version: item.target.documentationVersion });
			}
		});

		for (const item of listOfVersions) {
			if (item.id !== dataset.data.id) {
				let existingDataset = await Data.findOne({ datasetid: item.id });
				if (existingDataset && existingDataset.pid) pid = existingDataset.pid;
				else {
					await Data.findOneAndUpdate({ datasetid: item.id }, { pid: uuid, datasetVersion: item.version });
				}
			} else {
				datasetVersion = item.version;
			}
		}
	}

	var uniqueID = '';
	while (uniqueID === '') {
		uniqueID = parseInt(Math.random().toString().replace('0.', ''));
		if ((await Data.find({ id: uniqueID }).length) === 0) {
			uniqueID = '';
		}
	}

	var keywordArray = splitString(dataset.data.keywords);
	var physicalSampleAvailabilityArray = splitString(dataset.data.physicalSampleAvailability);
	var geographicCoverageArray = splitString(dataset.data.geographicCoverage);

	const metadataQuality = metadataQualityList.data.find(x => x.id === datasetID);
	const phenotypes = phenotypesList.data[datasetID] || [];
	const dataUtility = dataUtilityList.data.find(x => x.id === datasetID);

	var data = new Data();
	data.pid = pid;
	data.datasetVersion = datasetVersion;
	data.id = uniqueID;
	data.datasetid = dataset.data.id;
	data.type = 'dataset';
	data.activeflag = 'archive';

	data.name = dataset.data.title;
	data.description = dataset.data.description;
	data.license = dataset.data.license;
	data.tags.features = keywordArray;
	data.datasetfields.publisher = dataset.data.publisher;
	data.datasetfields.geographicCoverage = geographicCoverageArray;
	data.datasetfields.physicalSampleAvailability = physicalSampleAvailabilityArray;
	data.datasetfields.abstract = dataset.data.abstract;
	data.datasetfields.releaseDate = dataset.data.releaseDate;
	data.datasetfields.accessRequestDuration = dataset.data.accessRequestDuration;
	data.datasetfields.conformsTo = dataset.data.conformsTo;
	data.datasetfields.accessRights = dataset.data.accessRights;
	data.datasetfields.jurisdiction = dataset.data.jurisdiction;
	data.datasetfields.datasetStartDate = dataset.data.datasetStartDate;
	data.datasetfields.datasetEndDate = dataset.data.datasetEndDate;
	data.datasetfields.statisticalPopulation = dataset.data.statisticalPopulation;
	data.datasetfields.ageBand = dataset.data.ageBand;
	data.datasetfields.contactPoint = dataset.data.contactPoint;
	data.datasetfields.periodicity = dataset.data.periodicity;

	data.datasetfields.metadataquality = metadataQuality ? metadataQuality : {};
	data.datasetfields.metadataschema = metadataSchema && metadataSchema.data ? metadataSchema.data : {};
	data.datasetfields.technicaldetails = technicaldetails;
	data.datasetfields.versionLinks = versionLinks && versionLinks.data && versionLinks.data.items ? versionLinks.data.items : [];
	data.datasetfields.phenotypes = phenotypes;
	data.datasetfields.datautility = dataUtility ? dataUtility : {};
	data.datasetv2 = datasetv2Object;

	return await data.save();
}

export async function loadDatasets(override) {
	let startCacheTime = Date.now();
	console.log(`Starting run at ${Date()}`);
	let metadataCatalogueLink = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
	//let metadataCatalogueLink = process.env.metadataURL || 'https://modelcatalogue.cs.ox.ac.uk/hdruk-preprod';

	let datasetsMDCList = await new Promise(function (resolve, reject) {
		axios
			.get(metadataCatalogueLink + '/api/dataModels')
			.then(function (response) {
				resolve(response.data);
			})
			.catch(err => {
				Sentry.addBreadcrumb({
					category: 'Caching',
					message: 'The caching run has failed because it was unable to get a count from the MDC',
					level: Sentry.Severity.Fatal,
				});
				Sentry.captureException(err);
				reject(err);
			});
	}).catch(() => {
		return 'Update failed';
	});

	if (datasetsMDCList === 'Update failed') return;

	// Compare counts from HDR and MDC, if greater drop of 10%+ then stop process and email support queue
	var datasetsHDRCount = await Data.countDocuments({ type: 'dataset', activeflag: 'active', source: 'HDRUK MDC' });

	if ((datasetsMDCList.count / datasetsHDRCount) * 100 < 90 && !override) {
		Sentry.addBreadcrumb({
			category: 'Caching',
			message: `The caching run has failed because the counts from the MDC (${datasetsMDCList.count}) where ${
				100 - (datasetsMDCList.count / datasetsHDRCount) * 100
			}% lower than the number stored in the DB (${datasetsHDRCount})`,
			level: Sentry.Severity.Fatal,
		});
		Sentry.captureException();
		return;
	}

	//datasetsMDCList.count = 10; //For testing to limit the number brought down

	const metadataQualityList = await axios
		.get('https://raw.githubusercontent.com/HDRUK/datasets/master/reports/metadata_quality.json', { timeout: 10000 })
		.catch(err => {
			Sentry.addBreadcrumb({
				category: 'Caching',
				message: 'Unable to get metadata quality value ' + err.message,
				level: Sentry.Severity.Error,
			});
			Sentry.captureException(err);
			console.error('Unable to get metadata quality value ' + err.message);
		});

	const phenotypesList = await axios
		.get('https://raw.githubusercontent.com/spiros/hdr-caliber-phenome-portal/master/_data/dataset2phenotypes.json', { timeout: 10000 })
		.catch(err => {
			Sentry.addBreadcrumb({
				category: 'Caching',
				message: 'Unable to get metadata quality value ' + err.message,
				level: Sentry.Severity.Error,
			});
			Sentry.captureException(err);
			console.error('Unable to get metadata quality value ' + err.message);
		});

	const dataUtilityList = await axios
		.get('https://raw.githubusercontent.com/HDRUK/datasets/master/reports/data_utility.json', { timeout: 10000 })
		.catch(err => {
			Sentry.addBreadcrumb({
				category: 'Caching',
				message: 'Unable to get data utility ' + err.message,
				level: Sentry.Severity.Error,
			});
			Sentry.captureException(err);
			console.error('Unable to get data utility ' + err.message);
		});

	// Get active custodians on HDR Gateway
	const publishers = await PublisherModel.find().select('name').lean();
	const onboardedCustodians = publishers.map(publisher => publisher.name);
	var datasetsMDCIDs = [];
	var counter = 0;

	//Logout first to clear any previous logins
	await axios
		.post(`https://modelcatalogue.cs.ox.ac.uk/hdruk-preprod/api/authentication/logout`, { withCredentials: true, timeout: 10000 })
		.catch(err => {
			console.log('Error when trying to logout of the MDC - ' + err.message);
		});

	const loginDetails = {
		username: process.env.MDCUsername,
		password: process.env.MDCPassword,
	};

	await axios
		.post(metadataCatalogueLink + '/api/authentication/login', loginDetails, {
			withCredentials: true,
			timeout: 10000,
		})
		.then(async session => {
			axios.defaults.headers.Cookie = session.headers['set-cookie'][0];

			for (const datasetMDC of datasetsMDCList.items) {
				counter++;
				console.log(`Starting ${counter} of ${datasetsMDCList.count} datasets (${datasetMDC.id})`);

				var datasetHDR = await Data.findOne({ datasetid: datasetMDC.id });
				datasetsMDCIDs.push({ datasetid: datasetMDC.id });

				const metadataQuality = metadataQualityList.data.find(x => x.id === datasetMDC.id);
				const dataUtility = dataUtilityList.data.find(x => x.id === datasetMDC.id);
				const phenotypes = phenotypesList.data[datasetMDC.id] || [];

				let startImportTime = Date.now();

				const datasetMDCJSON = await axios
					.get(
						metadataCatalogueLink +
							`/api/dataModels/${datasetMDC.id}/export/ox.softeng.metadatacatalogue.core.spi.json/JsonExporterService/1.1`,
						{
							timeout: 60000,
						}
					)
					.catch(err => {
						Sentry.addBreadcrumb({
							category: 'Caching',
							message: 'Unable to get dataset JSON ' + err.message,
							level: Sentry.Severity.Error,
						});
						Sentry.captureException(err);
						console.error('Unable to get metadata JSON ' + err.message);
					});

				var elapsedTime = ((Date.now() - startImportTime) / 1000).toFixed(3);
				console.log(`Time taken to import JSON  ${elapsedTime} (${datasetMDC.id})`);

				const metadataSchemaCall = axios //Paul - Remove and populate gateway side
					.get(metadataCatalogueLink + '/api/profiles/uk.ac.hdrukgateway/HdrUkProfilePluginService/schema.org/' + datasetMDC.id, {
						timeout: 10000,
					})
					.catch(err => {
						Sentry.addBreadcrumb({
							category: 'Caching',
							message: 'Unable to get metadata schema ' + err.message,
							level: Sentry.Severity.Error,
						});
						Sentry.captureException(err);
						console.error('Unable to get metadata schema ' + err.message);
					});

				const versionLinksCall = axios
					.get(metadataCatalogueLink + '/api/catalogueItems/' + datasetMDC.id + '/semanticLinks', { timeout: 10000 })
					.catch(err => {
						Sentry.addBreadcrumb({
							category: 'Caching',
							message: 'Unable to get version links ' + err.message,
							level: Sentry.Severity.Error,
						});
						Sentry.captureException(err);
						console.error('Unable to get version links ' + err.message);
					});

				const [metadataSchema, versionLinks] = await axios.all([metadataSchemaCall, versionLinksCall]);

				let datasetv1Object = populateV1datasetObject(datasetMDCJSON.data.dataModel.metadata);
				let datasetv2Object = populateV2datasetObject(datasetMDCJSON.data.dataModel.metadata);

				// Get technical details data classes
				let technicaldetails = [];

				if (datasetMDCJSON.data.dataModel.childDataClasses) {
					for (const dataClassMDC of datasetMDCJSON.data.dataModel.childDataClasses) {
						if (dataClassMDC.childDataElements) {
							// Map out data class elements to attach to class
							const dataClassElementArray = dataClassMDC.childDataElements.map(element => {
								return {
									domainType: element.domainType,
									label: element.label,
									description: element.description,
									dataType: {
										domainType: element.dataType.domainType,
										label: element.dataType.label,
									},
								};
							});

							// Create class object
							const technicalDetailClass = {
								domainType: dataClassMDC.domainType,
								label: dataClassMDC.label,
								description: dataClassMDC.description,
								elements: dataClassElementArray,
							};

							technicaldetails = [...technicaldetails, technicalDetailClass];
						}
					}
				}

				// Detect if dataset uses 5 Safes form for access
				const is5Safes = onboardedCustodians.includes(datasetMDC.publisher);
				const hasTechnicalDetails = technicaldetails.length > 0;

				if (datasetHDR) {
					//Edit
					if (!datasetHDR.pid) {
						let uuid = uuidv4();
						let listOfVersions = [];
						datasetHDR.pid = uuid;
						datasetHDR.datasetVersion = '0.0.1';

						if (versionLinks && versionLinks.data && versionLinks.data.items && versionLinks.data.items.length > 0) {
							versionLinks.data.items.forEach(item => {
								if (!listOfVersions.find(x => x.id === item.source.id)) {
									listOfVersions.push({ id: item.source.id, version: item.source.documentationVersion });
								}
								if (!listOfVersions.find(x => x.id === item.target.id)) {
									listOfVersions.push({ id: item.target.id, version: item.target.documentationVersion });
								}
							});

							listOfVersions.forEach(async item => {
								if (item.id !== datasetMDC.id) {
									await Data.findOneAndUpdate({ datasetid: item.id }, { pid: uuid, datasetVersion: item.version });
								} else {
									datasetHDR.pid = uuid;
									datasetHDR.datasetVersion = item.version;
								}
							});
						}
					}

					let keywordArray = splitString(datasetv1Object.keywords);
					let physicalSampleAvailabilityArray = splitString(datasetv1Object.physicalSampleAvailability);
					let geographicCoverageArray = splitString(datasetv1Object.geographicCoverage);

					await Data.findOneAndUpdate(
						{ datasetid: datasetMDC.id },
						{
							pid: datasetHDR.pid,
							datasetVersion: datasetHDR.datasetVersion,
							name: datasetMDC.label,
							description: datasetMDC.description,
							source: 'HDRUK MDC',
							is5Safes: is5Safes,
							hasTechnicalDetails,
							activeflag: 'active',
							license: datasetv1Object.license,
							tags: {
								features: keywordArray,
							},
							datasetfields: {
								publisher: datasetv1Object.publisher,
								geographicCoverage: geographicCoverageArray,
								physicalSampleAvailability: physicalSampleAvailabilityArray,
								abstract: datasetv1Object.abstract,
								releaseDate: datasetv1Object.releaseDate,
								accessRequestDuration: datasetv1Object.accessRequestDuration,
								conformsTo: datasetv1Object.conformsTo,
								accessRights: datasetv1Object.accessRights,
								jurisdiction: datasetv1Object.jurisdiction,
								datasetStartDate: datasetv1Object.datasetStartDate,
								datasetEndDate: datasetv1Object.datasetEndDate,
								statisticalPopulation: datasetv1Object.statisticalPopulation,
								ageBand: datasetv1Object.ageBand,
								contactPoint: datasetv1Object.contactPoint,
								periodicity: datasetv1Object.periodicity,

								metadataquality: metadataQuality ? metadataQuality : {},
								datautility: dataUtility ? dataUtility : {},
								metadataschema: metadataSchema && metadataSchema.data ? metadataSchema.data : {},
								technicaldetails: technicaldetails,
								versionLinks: versionLinks && versionLinks.data && versionLinks.data.items ? versionLinks.data.items : [],
								phenotypes,
							},
							datasetv2: datasetv2Object,
						}
					);
					console.log(`Dataset Editted (${datasetMDC.id})`);
				} else {
					//Add
					let uuid = uuidv4();
					let listOfVersions = [];
					let pid = uuid;
					let datasetVersion = '0.0.1';

					if (versionLinks && versionLinks.data && versionLinks.data.items && versionLinks.data.items.length > 0) {
						versionLinks.data.items.forEach(item => {
							if (!listOfVersions.find(x => x.id === item.source.id)) {
								listOfVersions.push({ id: item.source.id, version: item.source.documentationVersion });
							}
							if (!listOfVersions.find(x => x.id === item.target.id)) {
								listOfVersions.push({ id: item.target.id, version: item.target.documentationVersion });
							}
						});

						for (const item of listOfVersions) {
							if (item.id !== datasetMDC.id) {
								var existingDataset = await Data.findOne({ datasetid: item.id });
								if (existingDataset && existingDataset.pid) pid = existingDataset.pid;
								else {
									await Data.findOneAndUpdate({ datasetid: item.id }, { pid: uuid, datasetVersion: item.version });
								}
							} else {
								datasetVersion = item.version;
							}
						}
					}

					var uniqueID = '';
					while (uniqueID === '') {
						uniqueID = parseInt(Math.random().toString().replace('0.', ''));
						if ((await Data.find({ id: uniqueID }).length) === 0) {
							uniqueID = '';
						}
					}

					var keywordArray = splitString(datasetv1Object.keywords);
					var physicalSampleAvailabilityArray = splitString(datasetv1Object.physicalSampleAvailability);
					var geographicCoverageArray = splitString(datasetv1Object.geographicCoverage);

					var data = new Data();
					data.pid = pid;
					data.datasetVersion = datasetVersion;
					data.id = uniqueID;
					data.datasetid = datasetMDC.id;
					data.type = 'dataset';
					data.activeflag = 'active';
					data.source = 'HDRUK MDC';
					data.is5Safes = is5Safes;
					data.hasTechnicalDetails = hasTechnicalDetails;

					data.name = datasetMDC.label;
					data.description = datasetMDC.description;
					data.license = datasetv1Object.license;
					data.tags.features = keywordArray;
					data.datasetfields.publisher = datasetv1Object.publisher;
					data.datasetfields.geographicCoverage = geographicCoverageArray;
					data.datasetfields.physicalSampleAvailability = physicalSampleAvailabilityArray;
					data.datasetfields.abstract = datasetv1Object.abstract;
					data.datasetfields.releaseDate = datasetv1Object.releaseDate;
					data.datasetfields.accessRequestDuration = datasetv1Object.accessRequestDuration;
					data.datasetfields.conformsTo = datasetv1Object.conformsTo;
					data.datasetfields.accessRights = datasetv1Object.accessRights;
					data.datasetfields.jurisdiction = datasetv1Object.jurisdiction;
					data.datasetfields.datasetStartDate = datasetv1Object.datasetStartDate;
					data.datasetfields.datasetEndDate = datasetv1Object.datasetEndDate;
					data.datasetfields.statisticalPopulation = datasetv1Object.statisticalPopulation;
					data.datasetfields.ageBand = datasetv1Object.ageBand;
					data.datasetfields.contactPoint = datasetv1Object.contactPoint;
					data.datasetfields.periodicity = datasetv1Object.periodicity;

					data.datasetfields.metadataquality = metadataQuality ? metadataQuality : {};
					data.datasetfields.datautility = dataUtility ? dataUtility : {};
					data.datasetfields.metadataschema = metadataSchema && metadataSchema.data ? metadataSchema.data : {};
					data.datasetfields.technicaldetails = technicaldetails;
					data.datasetfields.versionLinks = versionLinks && versionLinks.data && versionLinks.data.items ? versionLinks.data.items : [];
					data.datasetfields.phenotypes = phenotypes;
					data.datasetv2 = datasetv2Object;
					await data.save();
					console.log(`Dataset Added (${datasetMDC.id})`);
				}

				console.log(`Finished ${counter} of ${datasetsMDCList.count} datasets (${datasetMDC.id})`);
			}
		})
		.catch(err => {
			Sentry.addBreadcrumb({
				category: 'Caching',
				message: 'Unable to complete the run ' + err.message,
				level: Sentry.Severity.Error,
			});
			Sentry.captureException(err);
			console.error('Unable to complete the run ' + err.message);
		});

	await axios
		.post(`https://modelcatalogue.cs.ox.ac.uk/hdruk-preprod/api/authentication/logout`, { withCredentials: true, timeout: 10000 })
		.catch(err => {
			console.log('Error when trying to logout of the MDC - ' + err.message);
		});

	var datasetsHDRIDs = await Data.aggregate([
		{ $match: { type: 'dataset', activeflag: 'active', source: 'HDRUK MDC' } },
		{ $project: { _id: 0, datasetid: 1 } },
	]);

	let datasetsNotFound = datasetsHDRIDs.filter(o1 => !datasetsMDCIDs.some(o2 => o1.datasetid === o2.datasetid));

	await Promise.all(
		datasetsNotFound.map(async dataset => {
			//Archive
			await Data.findOneAndUpdate(
				{ datasetid: dataset.datasetid },
				{
					activeflag: 'archive',
				}
			);
		})
	);

	//saveUptime();
	var totalCacheTime = ((Date.now() - startCacheTime) / 1000).toFixed(3);
	console.log(`Run Completed at ${Date()} - Run took ${totalCacheTime}s`);
	return;
}

function populateV1datasetObject(v1Data) {
	let datasetV1List = v1Data.filter(item => item.namespace === 'uk.ac.hdrukgateway');
	let datasetv1Object = {};
	if (datasetV1List.length > 0) {
		datasetv1Object = {
			keywords: datasetV1List.find(x => x.key === 'keywords') ? datasetV1List.find(x => x.key === 'keywords').value : '',
			license: datasetV1List.find(x => x.key === 'license') ? datasetV1List.find(x => x.key === 'license').value : '',
			publisher: datasetV1List.find(x => x.key === 'publisher') ? datasetV1List.find(x => x.key === 'publisher').value : '',
			geographicCoverage: datasetV1List.find(x => x.key === 'geographicCoverage')
				? datasetV1List.find(x => x.key === 'geographicCoverage').value
				: '',
			physicalSampleAvailability: datasetV1List.find(x => x.key === 'physicalSampleAvailability')
				? datasetV1List.find(x => x.key === 'physicalSampleAvailability').value
				: '',
			abstract: datasetV1List.find(x => x.key === 'abstract') ? datasetV1List.find(x => x.key === 'abstract').value : '',
			releaseDate: datasetV1List.find(x => x.key === 'releaseDate') ? datasetV1List.find(x => x.key === 'releaseDate').value : '',
			accessRequestDuration: datasetV1List.find(x => x.key === 'accessRequestDuration')
				? datasetV1List.find(x => x.key === 'accessRequestDuration').value
				: '',
			conformsTo: datasetV1List.find(x => x.key === 'conformsTo') ? datasetV1List.find(x => x.key === 'conformsTo').value : '',
			accessRights: datasetV1List.find(x => x.key === 'accessRights') ? datasetV1List.find(x => x.key === 'accessRights').value : '',
			jurisdiction: datasetV1List.find(x => x.key === 'jurisdiction') ? datasetV1List.find(x => x.key === 'jurisdiction').value : '',
			datasetStartDate: datasetV1List.find(x => x.key === 'datasetStartDate')
				? datasetV1List.find(x => x.key === 'datasetStartDate').value
				: '',
			datasetEndDate: datasetV1List.find(x => x.key === 'datasetEndDate') ? datasetV1List.find(x => x.key === 'datasetEndDate').value : '',
			statisticalPopulation: datasetV1List.find(x => x.key === 'statisticalPopulation')
				? datasetV1List.find(x => x.key === 'statisticalPopulation').value
				: '',
			ageBand: datasetV1List.find(x => x.key === 'ageBand') ? datasetV1List.find(x => x.key === 'ageBand').value : '',
			contactPoint: datasetV1List.find(x => x.key === 'contactPoint') ? datasetV1List.find(x => x.key === 'contactPoint').value : '',
			periodicity: datasetV1List.find(x => x.key === 'periodicity') ? datasetV1List.find(x => x.key === 'periodicity').value : '',
		};
	}

	return datasetv1Object;
}

function populateV2datasetObject(v2Data) {
	let datasetV2List = v2Data.filter(item => item.namespace === 'org.healthdatagateway');

	let datasetv2Object = {};
	if (datasetV2List.length > 0) {
		datasetv2Object = {
			identifier: datasetV2List.find(x => x.key === 'properties/identifier')
				? datasetV2List.find(x => x.key === 'properties/identifier').value
				: '',
			version: datasetV2List.find(x => x.key === 'properties/version') ? datasetV2List.find(x => x.key === 'properties/version').value : '',
			issued: datasetV2List.find(x => x.key === 'properties/issued') ? datasetV2List.find(x => x.key === 'properties/issued').value : '',
			modified: datasetV2List.find(x => x.key === 'properties/modified')
				? datasetV2List.find(x => x.key === 'properties/modified').value
				: '',
			revisions: [],
			summary: {
				title: datasetV2List.find(x => x.key === 'properties/summary/title')
					? datasetV2List.find(x => x.key === 'properties/summary/title').value
					: '',
				abstract: datasetV2List.find(x => x.key === 'properties/summary/abstract')
					? datasetV2List.find(x => x.key === 'properties/summary/abstract').value
					: '',
				publisher: {
					identifier: datasetV2List.find(x => x.key === 'properties/summary/publisher/identifier')
						? datasetV2List.find(x => x.key === 'properties/summary/publisher/identifier').value
						: '',
					name: datasetV2List.find(x => x.key === 'properties/summary/publisher/name')
						? datasetV2List.find(x => x.key === 'properties/summary/publisher/name').value
						: '',
					logo: datasetV2List.find(x => x.key === 'properties/summary/publisher/logo')
						? datasetV2List.find(x => x.key === 'properties/summary/publisher/logo').value
						: '',
					description: datasetV2List.find(x => x.key === 'properties/summary/publisher/description')
						? datasetV2List.find(x => x.key === 'properties/summary/publisher/description').value
						: '',
					contactPoint: checkForArray(
						datasetV2List.find(x => x.key === 'properties/summary/publisher/contactPoint')
							? datasetV2List.find(x => x.key === 'properties/summary/publisher/contactPoint').value
							: []
					),
					memberOf: datasetV2List.find(x => x.key === 'properties/summary/publisher/memberOf')
						? datasetV2List.find(x => x.key === 'properties/summary/publisher/memberOf').value
						: '',
					accessRights: checkForArray(
						datasetV2List.find(x => x.key === 'properties/summary/publisher/accessRights')
							? datasetV2List.find(x => x.key === 'properties/summary/publisher/accessRights').value
							: []
					),
					deliveryLeadTime: datasetV2List.find(x => x.key === 'properties/summary/publisher/deliveryLeadTime')
						? datasetV2List.find(x => x.key === 'properties/summary/publisher/deliveryLeadTime').value
						: '',
					accessService: datasetV2List.find(x => x.key === 'properties/summary/publisher/accessService')
						? datasetV2List.find(x => x.key === 'properties/summary/publisher/accessService').value
						: '',
					accessRequestCost: datasetV2List.find(x => x.key === 'properties/summary/publisher/accessRequestCost')
						? datasetV2List.find(x => x.key === 'properties/summary/publisher/accessRequestCost').value
						: '',
					dataUseLimitation: checkForArray(
						datasetV2List.find(x => x.key === 'properties/summary/publisher/dataUseLimitation')
							? datasetV2List.find(x => x.key === 'properties/summary/publisher/dataUseLimitation').value
							: []
					),
					dataUseRequirements: checkForArray(
						datasetV2List.find(x => x.key === 'properties/summary/publisher/dataUseRequirements')
							? datasetV2List.find(x => x.key === 'properties/summary/publisher/dataUseRequirements').value
							: []
					),
				},
				contactPoint: datasetV2List.find(x => x.key === 'properties/summary/contactPoint')
					? datasetV2List.find(x => x.key === 'properties/summary/contactPoint').value
					: '',
				keywords: checkForArray(
					datasetV2List.find(x => x.key === 'properties/summary/keywords')
						? datasetV2List.find(x => x.key === 'properties/summary/keywords').value
						: []
				),
				alternateIdentifiers: checkForArray(
					datasetV2List.find(x => x.key === 'properties/summary/alternateIdentifiers')
						? datasetV2List.find(x => x.key === 'properties/summary/alternateIdentifiers').value
						: []
				),
				doiName: datasetV2List.find(x => x.key === 'properties/summary/doiName')
					? datasetV2List.find(x => x.key === 'properties/summary/doiName').value
					: '',
			},
			documentation: {
				description: datasetV2List.find(x => x.key === 'properties/documentation/description')
					? datasetV2List.find(x => x.key === 'properties/documentation/description').value
					: '',
				associatedMedia: checkForArray(
					datasetV2List.find(x => x.key === 'properties/documentation/associatedMedia')
						? datasetV2List.find(x => x.key === 'properties/documentation/associatedMedia').value
						: []
				),
				isPartOf: checkForArray(
					datasetV2List.find(x => x.key === 'properties/documentation/isPartOf')
						? datasetV2List.find(x => x.key === 'properties/documentation/isPartOf').value
						: []
				),
			},
			coverage: {
				spatial: datasetV2List.find(x => x.key === 'properties/coverage/spatial')
					? datasetV2List.find(x => x.key === 'properties/coverage/spatial').value
					: '',
				typicalAgeRange: datasetV2List.find(x => x.key === 'properties/coverage/typicalAgeRange')
					? datasetV2List.find(x => x.key === 'properties/coverage/typicalAgeRange').value
					: '',
				physicalSampleAvailability: checkForArray(
					datasetV2List.find(x => x.key === 'properties/coverage/physicalSampleAvailability')
						? datasetV2List.find(x => x.key === 'properties/coverage/physicalSampleAvailability').value
						: []
				),
				followup: datasetV2List.find(x => x.key === 'properties/coverage/followup')
					? datasetV2List.find(x => x.key === 'properties/coverage/followup').value
					: '',
				pathway: datasetV2List.find(x => x.key === 'properties/coverage/pathway')
					? datasetV2List.find(x => x.key === 'properties/coverage/pathway').value
					: '',
			},
			provenance: {
				origin: {
					purpose: checkForArray(
						datasetV2List.find(x => x.key === 'properties/provenance/origin/purpose')
							? datasetV2List.find(x => x.key === 'properties/provenance/origin/purpose').value
							: []
					),
					source: checkForArray(
						datasetV2List.find(x => x.key === 'properties/provenance/origin/source')
							? datasetV2List.find(x => x.key === 'properties/provenance/origin/source').value
							: []
					),
					collectionSituation: checkForArray(
						datasetV2List.find(x => x.key === 'properties/provenance/origin/collectionSituation')
							? datasetV2List.find(x => x.key === 'properties/provenance/origin/collectionSituation').value
							: []
					),
				},
				temporal: {
					accrualPeriodicity: datasetV2List.find(x => x.key === 'properties/provenance/temporal/accrualPeriodicity')
						? datasetV2List.find(x => x.key === 'properties/provenance/temporal/accrualPeriodicity').value
						: '',
					distributionReleaseDate: datasetV2List.find(x => x.key === 'properties/provenance/temporal/distributionReleaseDate')
						? datasetV2List.find(x => x.key === 'properties/provenance/temporal/distributionReleaseDate').value
						: '',
					startDate: datasetV2List.find(x => x.key === 'properties/provenance/temporal/startDate')
						? datasetV2List.find(x => x.key === 'properties/provenance/temporal/startDate').value
						: '',
					endDate: datasetV2List.find(x => x.key === 'properties/provenance/temporal/endDate')
						? datasetV2List.find(x => x.key === 'properties/provenance/temporal/endDate').value
						: '',
					timeLag: datasetV2List.find(x => x.key === 'properties/provenance/temporal/timeLag')
						? datasetV2List.find(x => x.key === 'properties/provenance/temporal/timeLag').value
						: '',
				},
			},
			accessibility: {
				usage: {
					dataUseLimitation: checkForArray(
						datasetV2List.find(x => x.key === 'properties/accessibility/usage/dataUseLimitation')
							? datasetV2List.find(x => x.key === 'properties/accessibility/usage/dataUseLimitation').value
							: []
					),
					dataUseRequirements: checkForArray(
						datasetV2List.find(x => x.key === 'properties/accessibility/usage/dataUseRequirements')
							? datasetV2List.find(x => x.key === 'properties/accessibility/usage/dataUseRequirements').value
							: []
					),
					resourceCreator: datasetV2List.find(x => x.key === 'properties/accessibility/usage/resourceCreator')
						? datasetV2List.find(x => x.key === 'properties/accessibility/usage/resourceCreator').value
						: '',
					investigations: checkForArray(
						datasetV2List.find(x => x.key === 'properties/accessibility/usage/investigations')
							? datasetV2List.find(x => x.key === 'properties/accessibility/usage/investigations').value
							: []
					),
					isReferencedBy: checkForArray(
						datasetV2List.find(x => x.key === 'properties/accessibility/usage/isReferencedBy')
							? datasetV2List.find(x => x.key === 'properties/accessibility/usage/isReferencedBy').value
							: []
					),
				},
				access: {
					accessRights: checkForArray(
						datasetV2List.find(x => x.key === 'properties/accessibility/access/accessRights')
							? datasetV2List.find(x => x.key === 'properties/accessibility/access/accessRights').value
							: []
					),
					accessService: datasetV2List.find(x => x.key === 'properties/accessibility/access/accessService')
						? datasetV2List.find(x => x.key === 'properties/accessibility/access/accessService').value
						: '',
					accessRequestCost: datasetV2List.find(x => x.key === 'properties/accessibility/access/accessRequestCost')
						? datasetV2List.find(x => x.key === 'properties/accessibility/access/accessRequestCost').value
						: '',
					deliveryLeadTime: datasetV2List.find(x => x.key === 'properties/accessibility/access/deliveryLeadTime')
						? datasetV2List.find(x => x.key === 'properties/accessibility/access/deliveryLeadTime').value
						: '',
					jurisdiction: checkForArray(
						datasetV2List.find(x => x.key === 'properties/accessibility/access/jurisdiction')
							? datasetV2List.find(x => x.key === 'properties/accessibility/access/jurisdiction').value
							: []
					),
					dataProcessor: datasetV2List.find(x => x.key === 'properties/accessibility/access/dataProcessor')
						? datasetV2List.find(x => x.key === 'properties/accessibility/access/dataProcessor').value
						: '',
					dataController: datasetV2List.find(x => x.key === 'properties/accessibility/access/dataController')
						? datasetV2List.find(x => x.key === 'properties/accessibility/access/dataController').value
						: '',
				},
				formatAndStandards: {
					vocabularyEncodingScheme: checkForArray(
						datasetV2List.find(x => x.key === 'properties/accessibility/formatAndStandards/vocabularyEncodingScheme')
							? datasetV2List.find(x => x.key === 'properties/accessibility/formatAndStandards/vocabularyEncodingScheme').value
							: []
					),
					conformsTo: checkForArray(
						datasetV2List.find(x => x.key === 'properties/accessibility/formatAndStandards/conformsTo')
							? datasetV2List.find(x => x.key === 'properties/accessibility/formatAndStandards/conformsTo').value
							: []
					),
					language: checkForArray(
						datasetV2List.find(x => x.key === 'properties/accessibility/formatAndStandards/language')
							? datasetV2List.find(x => x.key === 'properties/accessibility/formatAndStandards/language').value
							: []
					),
					format: checkForArray(
						datasetV2List.find(x => x.key === 'properties/accessibility/formatAndStandards/format')
							? datasetV2List.find(x => x.key === 'properties/accessibility/formatAndStandards/format').value
							: []
					),
				},
			},
			enrichmentAndLinkage: {
				qualifiedRelation: checkForArray(
					datasetV2List.find(x => x.key === 'properties/enrichmentAndLinkage/qualifiedRelation')
						? datasetV2List.find(x => x.key === 'properties/enrichmentAndLinkage/qualifiedRelation').value
						: []
				),
				derivation: checkForArray(
					datasetV2List.find(x => x.key === 'properties/enrichmentAndLinkage/derivation')
						? datasetV2List.find(x => x.key === 'properties/enrichmentAndLinkage/derivation').value
						: []
				),
				tools: checkForArray(
					datasetV2List.find(x => x.key === 'properties/enrichmentAndLinkage/tools')
						? datasetV2List.find(x => x.key === 'properties/enrichmentAndLinkage/tools').value
						: []
				),
			},
			observations: [],
		};
	}

	return datasetv2Object;
}

function checkForArray(value) {
	if (typeof value !== 'string') return value;
	try {
		const type = Object.prototype.toString.call(JSON.parse(value));
		if (type === '[object Object]' || type === '[object Array]') return JSON.parse(value);
	} catch (err) {
		return value;
	}
}

function splitString(array) {
	var returnArray = [];
	if (array !== null && array !== '' && array !== 'undefined' && array !== undefined) {
		if (array.indexOf(',') === -1) {
			returnArray.push(array.trim());
		} else {
			array.split(',').forEach(term => {
				returnArray.push(term.trim());
			});
		}
	}
	return returnArray;
}

async function saveUptime() {
	const monitoring = require('@google-cloud/monitoring');
	const projectId = 'hdruk-gateway';
	const client = new monitoring.MetricServiceClient();

	var selectedMonthStart = new Date();
	selectedMonthStart.setMonth(selectedMonthStart.getMonth() - 1);
	selectedMonthStart.setDate(1);
	selectedMonthStart.setHours(0, 0, 0, 0);

	var selectedMonthEnd = new Date();
	selectedMonthEnd.setDate(0);
	selectedMonthEnd.setHours(23, 59, 59, 999);

	const request = {
		name: client.projectPath(projectId),
		filter:
			'metric.type="monitoring.googleapis.com/uptime_check/check_passed" AND resource.type="uptime_url" AND metric.label."check_id"="check-production-web-app-qsxe8fXRrBo" AND metric.label."checker_location"="eur-belgium"',

		interval: {
			startTime: {
				seconds: selectedMonthStart.getTime() / 1000,
			},
			endTime: {
				seconds: selectedMonthEnd.getTime() / 1000,
			},
		},
		aggregation: {
			alignmentPeriod: {
				seconds: '86400s',
			},
			crossSeriesReducer: 'REDUCE_NONE',
			groupByFields: ['metric.label."checker_location"', 'resource.label."instance_id"'],
			perSeriesAligner: 'ALIGN_FRACTION_TRUE',
		},
	};

	// Writes time series data
	const [timeSeries] = await client.listTimeSeries(request);
	var dailyUptime = [];
	var averageUptime;

	timeSeries.forEach(data => {
		data.points.forEach(data => {
			dailyUptime.push(data.value.doubleValue);
		});

		averageUptime = (dailyUptime.reduce((a, b) => a + b, 0) / dailyUptime.length) * 100;
	});

	var metricsData = new MetricsData();
	metricsData.uptime = averageUptime;
	await metricsData.save();
}
