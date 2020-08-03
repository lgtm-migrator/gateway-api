import { Data } from '../tool/data.model'
import axios from 'axios';
import emailGenerator from '../utilities/emailGenerator.util';

export async function loadDatasets(override) {
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
    var datasetsMDCIDs = []

    await datasetsMDCList.results.reduce(
        (p, datasetMDC) => p.then(
            () => (new Promise(resolve => {
                setTimeout(async function () {
                    var datasetHDR = await Data.findOne({ datasetid: datasetMDC.id });
                    datasetsMDCIDs.push({ datasetid: datasetMDC.id });
                    
                    const metadataQuality = metadataQualityList.data.find(x => x.id === datasetMDC.id);
                    
                    const metadataSchemaCall = axios.get(metadataCatalogueLink + '/api/profiles/uk.ac.hdrukgateway/HdrUkProfilePluginService/schema.org/'+ datasetMDC.id, { timeout:5000 }).catch(err => { console.log('Unable to get metadata schema '+err.message) }); 
                    const [metadataSchema] = await axios.all([metadataSchemaCall]);
                    
                    /* 
                    Technical metadata calls - https://github.com/HDRUK/datasets/blob/master/datasets.py
                    API_BASE_URL="https://metadata-catalogue.org/hdruk/api"
                    DATA_MODELS = API_BASE_URL + "/dataModels"
                    DATA_MODEL_ID = API_BASE_URL + "/facets/{MODEL_ID}/profile/uk.ac.hdrukgateway/HdrUkProfilePluginService"
                    DATA_MODEL_CLASSES = DATA_MODELS + "/{MODEL_ID}/dataClasses"
                    DATA_MODEL_CLASSES_ELEMENTS = DATA_MODEL_CLASSES + "/{CLASS_ID}/dataElements"
                    DATA_MODEL_SEMANTIC_LINKS = API_BASE_URL + "/catalogueItems/{MODEL_ID}/semanticLinks"
                    */

                    if (datasetHDR) {
                        //Edit
                        var keywordArray = splitString(datasetMDC.keywords)
                        var physicalSampleAvailabilityArray = splitString(datasetMDC.physicalSampleAvailability)
                        
                        await Data.findOneAndUpdate({ datasetid: datasetMDC.id },
                            {
                                name: datasetMDC.title,
                                description: datasetMDC.description,
                                activeflag: 'active',
                                license: datasetMDC.license,
                                tags: {
                                    features: keywordArray
                                },
                                datasetfields: {
                                    publisher: datasetMDC.publisher,
                                    geographicCoverage: datasetMDC.geographicCoverage,
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
                                    
                                    metadataquality: metadataQuality ? metadataQuality : {},
                                    metadataschema: metadataSchema && metadataSchema.data ? metadataSchema.data : {}
                                },
                            }
                        );
                    }
                    else {
                        //Add
                        var uniqueID='';
                        while (uniqueID === '') {
                            uniqueID = parseInt(Math.random().toString().replace('0.', ''));
                            if (await Data.find({ id: uniqueID }).length === 0) {
                                uniqueID = '';
                            }
                        }
                        
                        var keywordArray = splitString(datasetMDC.keywords)
                        var physicalSampleAvailabilityArray = splitString(datasetMDC.physicalSampleAvailability)
                        
                        var data = new Data(); 
                        data.id = uniqueID;
                        data.datasetid = datasetMDC.id;
                        data.type = 'dataset';
                        data.activeflag = 'active';
                        
                        data.name = datasetMDC.title;
                        data.description = datasetMDC.description;
                        data.license = datasetMDC.license;
                        data.tags.features = keywordArray;
                        data.datasetfields.publisher = datasetMDC.publisher;
                        data.datasetfields.geographicCoverage = datasetMDC.geographicCoverage;
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
                        
                        data.datasetfields.metadataquality = metadataQuality ? metadataQuality : {};
                        data.datasetfields.metadataschema = metadataSchema && metadataSchema.data ? metadataSchema.data : {};

                        await data.save(); 
                    }
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