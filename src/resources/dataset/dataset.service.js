import { Data } from '../tool/data.model'
import { MetricsData } from '../stats/metrics.model'
import axios from 'axios';
import emailGenerator from '../utilities/emailGenerator.util';
import { v4 as uuidv4 } from 'uuid';

export async function loadDataset(datasetID) {
    var metadataCatalogueLink = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
    const datasetCall = axios.get(metadataCatalogueLink + '/api/facets/'+ datasetID +'/profile/uk.ac.hdrukgateway/HdrUkProfilePluginService', { timeout:5000 }).catch(err => { console.log('Unable to get dataset details '+err.message) }); 
    const metadataQualityCall = axios.get('https://raw.githubusercontent.com/HDRUK/datasets/master/reports/metadata_quality.json', { timeout:5000 }).catch(err => { console.log('Unable to get metadata quality value '+err.message) }); 
    const metadataSchemaCall = axios.get(metadataCatalogueLink + '/api/profiles/uk.ac.hdrukgateway/HdrUkProfilePluginService/schema.org/'+ datasetID, { timeout:5000 }).catch(err => { console.log('Unable to get metadata schema '+err.message) }); 
    const dataClassCall = axios.get(metadataCatalogueLink + '/api/dataModels/'+datasetID+'/dataClasses?max=300', { timeout:5000 }).catch(err => { console.log('Unable to get dataclass '+err.message) }); 
    const versionLinksCall = axios.get(metadataCatalogueLink + '/api/catalogueItems/'+datasetID+'/semanticLinks', { timeout:5000 }).catch(err => { console.log('Unable to get version links '+err.message) }); 
    const phenotypesCall = await axios.get('https://raw.githubusercontent.com/spiros/hdr-caliber-phenome-portal/master/_data/dataset2phenotypes.json', { timeout:5000 }).catch(err => { console.log('Unable to get phenotypes '+err.message) }); 
    const dataUtilityCall = await axios.get('https://raw.githubusercontent.com/HDRUK/datasets/master/reports/data_utility.json', { timeout:5000 }).catch(err => { console.log('Unable to get data utility '+err.message) }); 
    const [dataset, metadataQualityList, metadataSchema, dataClass, versionLinks, phenotypesList, dataUtilityList] = await axios.all([datasetCall, metadataQualityCall, metadataSchemaCall, dataClassCall, versionLinksCall, phenotypesCall,dataUtilityCall]);

    var technicaldetails = [];

    await dataClass.data.items.reduce(
        (p, dataclassMDC) => p.then(
            () => (new Promise(resolve => {
                setTimeout(async function () {
                    const dataClassElementCall = axios.get(metadataCatalogueLink + '/api/dataModels/'+datasetID+'/dataClasses/'+dataclassMDC.id+'/dataElements?all=true', { timeout:5000 }).catch(err => { console.log('Unable to get dataclass element '+err.message) }); 
                    const [dataClassElement] = await axios.all([dataClassElementCall]);
                    var dataClassElementArray = []

                        dataClassElement.data.items.forEach((element) => {
                        dataClassElementArray.push(
                            {
                                "id": element.id,
                                "domainType": element.domainType,
                                "label": element.label,
                                "description": element.description,
                                "dataType": {
                                    "id": element.dataType.id,
                                    "domainType": element.dataType.domainType,
                                    "label": element.dataType.label
                                }
                            }
                        );
                    });
                    
                    technicaldetails.push({
                        "id": dataclassMDC.id,
                        "domainType": dataclassMDC.domainType,
                        "label": dataclassMDC.label,
                        "description": dataclassMDC.description,
                        "elements": dataClassElementArray
                    })

                    resolve(null)
                }, 500)
            }))
        ),
        Promise.resolve(null)
    );
    
    var uniqueID='';
    while (uniqueID === '') {
        uniqueID = parseInt(Math.random().toString().replace('0.', ''));
        if (await Data.find({ id: uniqueID }).length === 0) {
            uniqueID = '';
        }
    }
    
    var keywordArray = splitString(dataset.data.keywords)
    var physicalSampleAvailabilityArray = splitString(dataset.data.physicalSampleAvailability)
    var geographicCoverageArray = splitString(dataset.data.geographicCoverage)
    
    const metadataQuality = metadataQualityList.data.find(x => x.id === datasetID);
    const phenotypes = phenotypesList.data[datasetID] || [];
    const dataUtility = dataUtilityList.data.find(x => x.id === datasetID);

    var data = new Data(); 
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

    return await data.save();
}

export async function loadDatasets(override) {
    console.log("Starting run at "+Date())
    const hdrukEmail = 'paul.mccafferty@paconsulting.com';//`enquiry@healthdatagateway.org`;
    var metadataCatalogueLink = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
        
    var datasetsMDCCount = await new Promise(function (resolve, reject) {
        axios.post(metadataCatalogueLink + '/api/profiles/uk.ac.hdrukgateway/HdrUkProfilePluginService/customSearch?searchTerm=&domainType=DataModel&limit=1')
            .then(function (response) {
                resolve(response.data.count);
            })
            .catch(function (err) {
                /* emailGenerator.sendEmail(
                    [emailRecipients],
                    `${hdrukEmail}`,
                    `The caching run has failed`,
                    `The caching run has failed because it was unable to get a count from the MDC`,
                ); */
                reject(err)
            })
    })

    //Compare counts from HDR and MDC, if greater drop of 10%+ then stop process and email support queue
    var datasetsHDRCount = await Data.countDocuments({ type: 'dataset', activeflag: 'active' });
    //console.log(datasetsHDRCount)
    //console.log(datasetsMDCCount)
    //console.log(datasetsHDRCount/datasetsMDCCount*100)
    if ((datasetsHDRCount/datasetsMDCCount*100) < 90 && !override) {
        /* emailGenerator.sendEmail(
            [emailRecipients],
            `${hdrukEmail}`,
            `The caching run has failed`,
            `The caching run has failed because the counts from the MDC (${datasetsMDCCount}) where ${(datasetsHDRCount/datasetsMDCCount*100) < 90}% lower than the number stored in the DB (${datasetsHDRCount})`
        ); */
        return "Update failed";
    }
    
    //datasetsMDCCount = 10; //For testing to limit the number brought down
    
    var datasetsMDCList = await new Promise(function (resolve, reject) {
        axios.post(metadataCatalogueLink + '/api/profiles/uk.ac.hdrukgateway/HdrUkProfilePluginService/customSearch?searchTerm=&domainType=DataModel&limit=' + datasetsMDCCount)
            .then(function (response) {
                resolve(response.data);
            })
            .catch(function (err) {
                /* emailGenerator.sendEmail(
                    [emailRecipients],
                    `${hdrukEmail}`,
                    `The caching run has failed`,
                    `The caching run has failed because it was unable to pull the datasets from the MDC`,
                ); */
                reject(err)
            })
    })

    const metadataQualityList = await axios.get('https://raw.githubusercontent.com/HDRUK/datasets/master/reports/metadata_quality.json', { timeout:5000 }).catch(err => { console.log('Unable to get metadata quality value '+err.message) }); 
    const phenotypesList = await axios.get('https://raw.githubusercontent.com/spiros/hdr-caliber-phenome-portal/master/_data/dataset2phenotypes.json', { timeout:5000 }).catch(err => { console.log('Unable to get phenotypes '+err.message) }); 
    const dataUtilityList = await axios.get('https://raw.githubusercontent.com/HDRUK/datasets/master/reports/data_utility.json', { timeout:5000 }).catch(err => { console.log('Unable to get data utility '+err.message) }); 
    var datasetsMDCIDs = []
    var counter = 0;

    await datasetsMDCList.results.reduce(
        (p, datasetMDC) => p.then(
            () => (new Promise(resolve => {
                setTimeout(async function () {
                    counter++;
                    var datasetHDR = await Data.findOne({ datasetid: datasetMDC.id });
                    datasetsMDCIDs.push({ datasetid: datasetMDC.id });
                    
                    const metadataQuality = metadataQualityList.data.find(x => x.id === datasetMDC.id);
                    const dataUtility = dataUtilityList.data.find(x => x.id === datasetMDC.id);
                    const phenotypes = phenotypesList.data[datasetMDC.id] || [];
                    
                    const metadataSchemaCall = axios.get(metadataCatalogueLink + '/api/profiles/uk.ac.hdrukgateway/HdrUkProfilePluginService/schema.org/'+ datasetMDC.id, { timeout:5000 }).catch(err => { console.log('Unable to get metadata schema '+err.message) }); 
                    const dataClassCall = axios.get(metadataCatalogueLink + '/api/dataModels/'+datasetMDC.id+'/dataClasses?max=300', { timeout:5000 }).catch(err => { console.log('Unable to get dataclass '+err.message) }); 
                    const versionLinksCall = axios.get(metadataCatalogueLink + '/api/catalogueItems/'+datasetMDC.id+'/semanticLinks', { timeout:5000 }).catch(err => { console.log('Unable to get version links '+err.message) }); 
                    const [metadataSchema, dataClass, versionLinks] = await axios.all([metadataSchemaCall, dataClassCall, versionLinksCall]);
                    
                    var technicaldetails = [];

                    await dataClass.data.items.reduce(
                        (p, dataclassMDC) => p.then(
                            () => (new Promise(resolve => {
                                setTimeout(async function () {
                                    const dataClassElementCall = axios.get(metadataCatalogueLink + '/api/dataModels/'+datasetMDC.id+'/dataClasses/'+dataclassMDC.id+'/dataElements?all=true', { timeout:5000 }).catch(err => { console.log('Unable to get dataclass element '+err.message) }); 
                                    const [dataClassElement] = await axios.all([dataClassElementCall]);
                                    var dataClassElementArray = []

                                     dataClassElement.data.items.forEach((element) => {
                                        dataClassElementArray.push(
                                            {
                                                "id": element.id,
                                                "domainType": element.domainType,
                                                "label": element.label,
                                                "description": element.description,
                                                "dataType": {
                                                    "id": element.dataType.id,
                                                    "domainType": element.dataType.domainType,
                                                    "label": element.dataType.label
                                                }
                                            }
                                        );
                                    });
                                    
                                    technicaldetails.push({
                                        "id": dataclassMDC.id,
                                        "domainType": dataclassMDC.domainType,
                                        "label": dataclassMDC.label,
                                        "description": dataclassMDC.description,
                                        "elements": dataClassElementArray
                                    })

                
                                    resolve(null)
                                }, 500)
                            }))
                        ),
                        Promise.resolve(null)
                    );
                    
                    if (datasetHDR) {
                        //Edit
                        if (!datasetHDR.pid) {
                            var uuid = uuidv4();
                            var listOfVersions =[];
                            datasetHDR.pid = uuid;
                            datasetHDR.datasetVersion = "0.0.1";
                            
                            if (versionLinks && versionLinks.data && versionLinks.data.items && versionLinks.data.items.length > 0) {
                                versionLinks.data.items.forEach((item) => {
                                    if (!listOfVersions.find(x => x.id === item.source.id)) {
                                        listOfVersions.push({"id":item.source.id, "version":item.source.documentationVersion});
                                    }
                                    if (!listOfVersions.find(x => x.id === item.target.id)) {
                                        listOfVersions.push({"id":item.target.id, "version":item.target.documentationVersion});
                                    }
                                })

                                listOfVersions.forEach(async (item) => {
                                    if (item.id !== datasetMDC.id) {
                                        await Data.findOneAndUpdate({ datasetid: item.id },
                                            { pid: uuid, datasetVersion: item.version }
                                        )
                                    }
                                    else {
                                        datasetHDR.pid = uuid;
                                        datasetHDR.datasetVersion = item.version;
                                    }
                                })
                            }
                        }

                        var keywordArray = splitString(datasetMDC.keywords)
                        var physicalSampleAvailabilityArray = splitString(datasetMDC.physicalSampleAvailability)
                        var geographicCoverageArray = splitString(datasetMDC.geographicCoverage)
                        
                        await Data.findOneAndUpdate({ datasetid: datasetMDC.id },
                            {
                                pid: datasetHDR.pid,
                                datasetVersion: datasetHDR.datasetVersion,
                                name: datasetMDC.title,
                                description: datasetMDC.description,
                                activeflag: 'active',
                                license: datasetMDC.license,
                                tags: {
                                    features: keywordArray
                                },
                                datasetfields: {
                                    publisher: datasetMDC.publisher,
                                    geographicCoverage: geographicCoverageArray,
                                    physicalSampleAvailability: physicalSampleAvailabilityArray,
                                    abstract: datasetMDC.abstract,
                                    releaseDate: datasetMDC.releaseDate,
                                    accessRequestDuration: datasetMDC.accessRequestDuration,
                                    conformsTo: datasetMDC.conformsTo,
                                    accessRights: datasetMDC.accessRights,
                                    jurisdiction: datasetMDC.jurisdiction,
                                    datasetStartDate: datasetMDC.datasetStartDate,
                                    datasetEndDate: datasetMDC.datasetEndDate,
                                    statisticalPopulation: datasetMDC.statisticalPopulation,
                                    ageBand: datasetMDC.ageBand,
                                    contactPoint: datasetMDC.contactPoint,
                                    periodicity: datasetMDC.periodicity,
                                    
                                    metadataquality: metadataQuality ? metadataQuality : {},
                                    datautility: dataUtility ? dataUtility : {},
                                    metadataschema: metadataSchema && metadataSchema.data ? metadataSchema.data : {},
                                    technicaldetails: technicaldetails,
                                    versionLinks: versionLinks && versionLinks.data && versionLinks.data.items ? versionLinks.data.items : [],
                                    phenotypes
                                },
                            }
                        );
                    }
                    else {
                        //Add
                        var uuid = uuidv4();
                        var listOfVersions =[];
                        var pid = uuid;
                        var datasetVersion = "0.0.1";
                        
                        if (versionLinks && versionLinks.data && versionLinks.data.items && versionLinks.data.items.length > 0) {
                            versionLinks.data.items.forEach((item) => {
                                if (!listOfVersions.find(x => x.id === item.source.id)) {
                                    listOfVersions.push({"id":item.source.id, "version":item.source.documentationVersion});
                                }
                                if (!listOfVersions.find(x => x.id === item.target.id)) {
                                    listOfVersions.push({"id":item.target.id, "version":item.target.documentationVersion});
                                }
                            })

                            listOfVersions.forEach(async (item) => {
                                if (item.id !== datasetMDC.id) {
                                    var existingDataset = await Data.findOne({ datasetid: item.id });
                                    if (existingDataset && existingDataset.pid) pid = existingDataset.pid;
                                    else {
                                        await Data.findOneAndUpdate({ datasetid: item.id },
                                            { pid: uuid, datasetVersion: item.version }
                                        )
                                    }
                                }
                                else {
                                    datasetVersion = item.version;
                                }
                            })
                        }
                        
                        var uniqueID='';
                        while (uniqueID === '') {
                            uniqueID = parseInt(Math.random().toString().replace('0.', ''));
                            if (await Data.find({ id: uniqueID }).length === 0) {
                                uniqueID = '';
                            }
                        }

                        var keywordArray = splitString(datasetMDC.keywords)
                        var physicalSampleAvailabilityArray = splitString(datasetMDC.physicalSampleAvailability)
                        var geographicCoverageArray = splitString(datasetMDC.geographicCoverage)
                        
                        var data = new Data(); 
                        data.pid = pid;
                        data.datasetVersion = datasetVersion;
                        data.id = uniqueID;
                        data.datasetid = datasetMDC.id;
                        data.type = 'dataset';
                        data.activeflag = 'active';
                        
                        data.name = datasetMDC.title;
                        data.description = datasetMDC.description;
                        data.license = datasetMDC.license;
                        data.tags.features = keywordArray;
                        data.datasetfields.publisher = datasetMDC.publisher;
                        data.datasetfields.geographicCoverage = geographicCoverageArray;
                        data.datasetfields.physicalSampleAvailability = physicalSampleAvailabilityArray;
                        data.datasetfields.abstract = datasetMDC.abstract;
                        data.datasetfields.releaseDate = datasetMDC.releaseDate;
                        data.datasetfields.accessRequestDuration = datasetMDC.accessRequestDuration;
                        data.datasetfields.conformsTo = datasetMDC.conformsTo;
                        data.datasetfields.accessRights = datasetMDC.accessRights;
                        data.datasetfields.jurisdiction = datasetMDC.jurisdiction;
                        data.datasetfields.datasetStartDate = datasetMDC.datasetStartDate;
                        data.datasetfields.datasetEndDate = datasetMDC.datasetEndDate;
                        data.datasetfields.statisticalPopulation = datasetMDC.statisticalPopulation;
                        data.datasetfields.ageBand = datasetMDC.ageBand;
                        data.datasetfields.contactPoint = datasetMDC.contactPoint;
                        data.datasetfields.periodicity = datasetMDC.periodicity;
                        
                        data.datasetfields.metadataquality = metadataQuality ? metadataQuality : {};
                        data.datasetfields.datautility = dataUtility ? dataUtility : {};
                        data.datasetfields.metadataschema = metadataSchema && metadataSchema.data ? metadataSchema.data : {};
                        data.datasetfields.technicaldetails = technicaldetails;
                        data.datasetfields.versionLinks = versionLinks && versionLinks.data && versionLinks.data.items ? versionLinks.data.items : [];
                        data.datasetfields.phenotypes = phenotypes;
                        await data.save(); 
                    }
                    console.log("Finished "+counter+" of "+datasetsMDCCount);
                    resolve(null)
                }, 500)
            }))
        ),
        Promise.resolve(null)
    );

    var datasetsHDRIDs = await Data.aggregate([{ $match: { type: 'dataset' } },{ $project: { "_id": 0, "datasetid": 1 } }]);

    let datasetsNotFound = datasetsHDRIDs.filter(o1 => !datasetsMDCIDs.some(o2 => o1.datasetid === o2.datasetid));

    await Promise.all( datasetsNotFound.map( async (dataset) => {
        //Archive
        await Data.findOneAndUpdate({ datasetid: dataset.datasetid },
            {
                activeflag: 'archive',
            }
        );
    }))
    
    saveUptime();

    console.log("Update Completed at "+Date())
    return "Update completed";
};

function splitString (array) {
    var returnArray = [];
    if (array !== null && array !== '' && array !== 'undefined' && array !== undefined) {
        if (array.indexOf(',') === -1) {
            returnArray.push(array.trim());
        }
        else {
            array.split(',').forEach((term) => {
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
    selectedMonthStart.setMonth(selectedMonthStart.getMonth()-1);
    selectedMonthStart.setDate(1);
    selectedMonthStart.setHours(0,0,0,0);

    var selectedMonthEnd = new Date();
    selectedMonthEnd.setDate(0);
    selectedMonthEnd.setHours(23,59,59,999);

    const request = {
        name: client.projectPath(projectId),
        filter: 'metric.type="monitoring.googleapis.com/uptime_check/check_passed" AND resource.type="uptime_url" AND metric.label."check_id"="check-production-web-app-qsxe8fXRrBo" AND metric.label."checker_location"="eur-belgium"',

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
            groupByFields: [
                'metric.label."checker_location"',
                'resource.label."instance_id"'
            ],
            perSeriesAligner: 'ALIGN_FRACTION_TRUE',
        },
    };

    // Writes time series data
    const [timeSeries] = await client.listTimeSeries(request);
    var dailyUptime = [];
    var averageUptime;

    timeSeries.forEach(data => {

        data.points.forEach(data => {
            dailyUptime.push(data.value.doubleValue)
        })

        averageUptime = (dailyUptime.reduce((a, b) => a + b, 0) / dailyUptime.length) * 100;
    });

    var metricsData = new MetricsData(); 
    metricsData.uptime = averageUptime;
    await metricsData.save();
}