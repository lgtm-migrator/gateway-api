import express from 'express'
import { Data } from '../tool/data.model'
import _ from 'lodash';

const router = express.Router();


// @route   GET api/v1/search/filter
// @desc    GET Get all filters
// @access  Public
router.get('/', async (req, res) => {
    var searchString = req.query.search || ""; //If blank then return all
    var tab = req.query.tab || ""; //If blank then return all
    if (tab === '') {
        let searchQuery = { $and: [{ activeflag: 'active' }] };
        if (searchString.length > 0) searchQuery["$and"].push({ $text: { $search: searchString } });
        var activeFiltersQuery = getObjectFilters(searchQuery, req, 'dataset')
        
        await Promise.all([
            getFilter(searchString, 'dataset', 'license', false, activeFiltersQuery),
            getFilter(searchString, 'dataset', 'datasetfields.physicalSampleAvailability', true, activeFiltersQuery),
            getFilter(searchString, 'dataset', 'tags.features', true, activeFiltersQuery),
            getFilter(searchString, 'dataset', 'datasetfields.publisher', false, activeFiltersQuery),
            getFilter(searchString, 'dataset', 'datasetfields.ageBand', true, activeFiltersQuery),
            getFilter(searchString, 'dataset', 'datasetfields.geographicCoverage', true, activeFiltersQuery),
            getFilter(searchString, 'dataset', 'datasetfields.phenotypes', true, activeFiltersQuery),

            getFilter(searchString, 'tool', 'tags.topic', true, activeFiltersQuery),
            getFilter(searchString, 'tool', 'tags.features', true, activeFiltersQuery),
            getFilter(searchString, 'tool', 'categories.programmingLanguage', true, activeFiltersQuery),
            getFilter(searchString, 'tool', 'categories.category', false, activeFiltersQuery),

            getFilter(searchString, 'project', 'tags.topics', true, activeFiltersQuery),
            getFilter(searchString, 'project', 'tags.features', true, activeFiltersQuery),
            getFilter(searchString, 'project', 'categories.category', false, activeFiltersQuery),

            getFilter(searchString, 'paper', 'tags.topics', true, activeFiltersQuery),
            getFilter(searchString, 'paper', 'tags.features', true, activeFiltersQuery)  
        ]).then((values) => {
            return res.json({
                success: true, 
                allFilters: {
                    licenseFilter: values[0][0],
                    sampleFilter: values[1][0],
                    datasetFeatureFilter: values[2][0],
                    publisherFilter: values[3][0],
                    ageBandFilter: values[4][0],
                    geographicCoverageFilter: values[5][0],
                    phenotypesFilter: values[6][0],

                    toolTopicFilter: values[6][0],
                    toolFeatureFilter: values[7][0],
                    toolLanguageFilter: values[8][0],
                    toolCategoryFilter: values[9][0],

                    projectTopicFilter: values[10][0],
                    projectFeatureFilter: values[11][0],
                    projectCategoryFilter: values[12][0],

                    paperTopicFilter: values[13][0],
                    paperFeatureFilter: values[14][0]
                },
                filterOptions: {
                    licenseFilterOptions: values[0][1],
                    sampleFilterOptions: values[1][1],
                    datasetFeaturesFilterOptions: values[2][1],
                    publisherFilterOptions: values[3][1],
                    ageBandFilterOptions: values[4][1],
                    geographicCoverageFilterOptions: values[5][1],
                    phenotypesOptions: values[6][1],

                    toolTopicsFilterOptions: values[7][1],
                    featuresFilterOptions: values[8][1],
                    programmingLanguageFilterOptions: values[9][1],
                    toolCategoriesFilterOptions: values[10][1],

                    projectTopicsFilterOptions: values[11][1],
                    projectFeaturesFilterOptions: values[12][1],
                    projectCategoriesFilterOptions: values[13][1],

                    paperTopicsFilterOptions: values[14][1],
                    paperFeaturesFilterOptions: values[15][1]
                }
            });
        });
    }
    else if (tab === 'Datasets') {
        let searchQuery = { $and: [{ activeflag: 'active' }] };
        if (searchString.length > 0) searchQuery["$and"].push({ $text: { $search: searchString } });
        var activeFiltersQuery = getObjectFilters(searchQuery, req, 'dataset')
        
        await Promise.all([
            getFilter(searchString, 'dataset', 'license', false, activeFiltersQuery),
            getFilter(searchString, 'dataset', 'datasetfields.physicalSampleAvailability', true, activeFiltersQuery),
            getFilter(searchString, 'dataset', 'tags.features', true, activeFiltersQuery),
            getFilter(searchString, 'dataset', 'datasetfields.publisher', false, activeFiltersQuery),
            getFilter(searchString, 'dataset', 'datasetfields.ageBand', true, activeFiltersQuery),
            getFilter(searchString, 'dataset', 'datasetfields.geographicCoverage', true, activeFiltersQuery),
            getFilter(searchString, 'dataset', 'datasetfields.phenotypes', true, activeFiltersQuery)
        ]).then((values) => {
            return res.json({
                success: true, 
                allFilters: {
                    licenseFilter: values[0][0],
                    sampleFilter: values[1][0],
                    datasetFeatureFilter: values[2][0],
                    publisherFilter: values[3][0],
                    ageBandFilter: values[4][0],
                    geographicCoverageFilter: values[5][0],
                    phenotypesFilter: values[6][0]
                },
                filterOptions: {
                    licenseFilterOptions: values[0][1],
                    sampleFilterOptions: values[1][1],
                    datasetFeaturesFilterOptions: values[2][1],
                    publisherFilterOptions: values[3][1],
                    ageBandFilterOptions: values[4][1],
                    geographicCoverageFilterOptions: values[5][1],
                    phenotypesOptions: values[6][1]
                }
            });
        });
    }
    else if (tab === 'Tools') {
        let searchQuery = { $and: [{ activeflag: 'active' }] };
        if (searchString.length > 0) searchQuery["$and"].push({ $text: { $search: searchString } });
        var activeFiltersQuery = getObjectFilters(searchQuery, req, 'dataset')
        
        await Promise.all([
            getFilter(searchString, 'tool', 'tags.topics', true, activeFiltersQuery),
            getFilter(searchString, 'tool', 'tags.features', true, activeFiltersQuery),
            getFilter(searchString, 'tool', 'categories.programmingLanguage', true, activeFiltersQuery),
            getFilter(searchString, 'tool', 'categories.category', false, activeFiltersQuery)      
        ]).then((values) => {
            return res.json({
                success: true, 
                allFilters: {
                    toolTopicFilter: values[0][0],
                    toolFeatureFilter: values[1][0],
                    toolLanguageFilter: values[2][0],
                    toolCategoryFilter: values[3][0]
                },
                filterOptions: {
                    toolTopicsFilterOptions: values[0][1],
                    featuresFilterOptions: values[1][1],
                    programmingLanguageFilterOptions: values[2][1],
                    toolCategoriesFilterOptions: values[3][1]
                }
            });
        });
    }
    else if (tab === 'Projects') {
        let searchQuery = { $and: [{ activeflag: 'active' }] };
        if (searchString.length > 0) searchQuery["$and"].push({ $text: { $search: searchString } });
        var activeFiltersQuery = getObjectFilters(searchQuery, req, 'dataset')
        
        await Promise.all([
            getFilter(searchString, 'project', 'tags.topics', true, activeFiltersQuery),
            getFilter(searchString, 'project', 'tags.features', true, activeFiltersQuery),
            getFilter(searchString, 'project', 'categories.category', false, activeFiltersQuery)  
        ]).then((values) => {
            return res.json({
                success: true, 
                allFilters: {
                    projectTopicFilter: values[0][0],
                    projectFeatureFilter: values[1][0],
                    projectCategoryFilter: values[2][0],
                },
                filterOptions: {
                    projectTopicsFilterOptions: values[0][1],
                    projectFeaturesFilterOptions: values[1][1],
                    projectCategoriesFilterOptions: values[2][1]
                }
            });
        });
    }
    else if (tab === 'Papers') {
        let searchQuery = { $and: [{ activeflag: 'active' }] };
        if (searchString.length > 0) searchQuery["$and"].push({ $text: { $search: searchString } });
        var activeFiltersQuery = getObjectFilters(searchQuery, req, 'dataset')
        
        await Promise.all([
            getFilter(searchString, 'paper', 'tags.topics', true, activeFiltersQuery),
            getFilter(searchString, 'paper', 'tags.features', true, activeFiltersQuery)
        ]).then((values) => {
            return res.json({
                success: true, 
                allFilters: {
                    paperTopicFilter: values[0][0],
                    paperFeatureFilter: values[1][0]
                },
                filterOptions: {
                    paperTopicsFilterOptions: values[0][1],
                    paperFeaturesFilterOptions: values[1][1]
                }
            });
        });
    }
});

router.get('/topic/:type',
    async (req, res) => {
      await getFilter('', req.params.type, 'tags.topics', true)
        .then(data => {
          return res.json({success: true, data});
        })
        .catch(err => {
          return res.json({success: false, err});
        });
    }
);

router.get('/feature/:type',
    async (req, res) => {
      await getFilter('', req.params.type, 'tags.features', true)
        .then(data => {
          return res.json({success: true, data});
        })
        .catch(err => {
          return res.json({success: false, err});
        });
    }
);

router.get('/language/:type',
    async (req, res) => {
      await getFilter('', req.params.type, 'categories.programmingLanguage', true)
        .then(data => {
          return res.json({success: true, data});
        })
        .catch(err => {
          return res.json({success: false, err});
        });
    }
);

router.get('/category/:type',
    async (req, res) => {
      await getFilter('', req.params.type, 'categories.category', false)  
        .then(data => {
          return res.json({success: true, data});
        })
        .catch(err => {
          return res.json({success: false, err});
        });
    }
);

router.get('/license/:type',
    async (req, res) => {
      await getFilter('', req.params.type, 'license', false)
        .then(data => {
          return res.json({success: true, data});
        })
        .catch(err => {
          return res.json({success: false, err});
        });
    }
);


  
const getFilter = async (searchString, type, field, isArray, activeFiltersQuery) => {
    return new Promise(async (resolve, reject) => {
        var q = '', p = '';
        var combinedResults = [], activeCombinedResults = [];

        if (searchString) q = Data.aggregate(filterQueryGenerator(field, searchString, type, isArray, {}));
        else q = Data.aggregate(filterQueryGenerator(field, '', type, isArray, {}));
        
        q.exec((err, data) => {
            if (err) return resolve({})

            if (data.length) {
                data.forEach((dat) => {
                    if (dat.result && dat.result !== '') {
                        if (field === 'datasetfields.phenotypes') combinedResults.push(dat.result.name.trim());
                        else combinedResults.push(dat.result.trim());
                    }
                })
            }
 
            var newSearchQuery = JSON.parse(JSON.stringify(activeFiltersQuery));
            newSearchQuery["$and"].push({ type: type })
            
            if (searchString) p = Data.aggregate(filterQueryGenerator(field, searchString, type, isArray, newSearchQuery));
            else p = Data.aggregate(filterQueryGenerator(field, '', type, isArray, newSearchQuery));
            
            p.exec((activeErr, activeData) => {
                if (activeData.length) {
                    activeData.forEach((dat) => {
                        if (dat.result && dat.result !== '') {
                            if (field === 'datasetfields.phenotypes') activeCombinedResults.push(dat.result.name.trim());
                            else activeCombinedResults.push(dat.result.trim());
                        }
                    })
                }
                resolve([combinedResults, activeCombinedResults]);
            });
        });
    })
}

function filterQueryGenerator(filter, searchString, type, isArray, activeFiltersQuery) {
    var queryArray = []

    if (!_.isEmpty(activeFiltersQuery)) {
        queryArray.push({ $match: activeFiltersQuery});
    }
    else {
        if (searchString !=='') queryArray.push({ $match: { $and: [{ $text: { $search: searchString } }, { type: type }, { activeflag: 'active' }] } });
        else queryArray.push({ $match: { $and: [{ type: type }, { activeflag: 'active' }] } });
    }

    queryArray.push(
        { 
            "$project" : { 
                "result" : "$"+filter, 
                "_id": 0
            }
        }
    );
    
    if (isArray) {
        queryArray.push({"$unwind": '$result'});
        queryArray.push({"$unwind": '$result'});
    } 

    queryArray.push(
        { 
            "$group" : { 
                "_id" : null, 
                "distinct" : { 
                    "$addToSet" : "$$ROOT"
                }
            }
        }, 
        { 
            "$unwind" : { 
                "path" : "$distinct", 
                "preserveNullAndEmptyArrays" : false
            }
        }, 
        { 
            "$replaceRoot" : { 
                "newRoot" : "$distinct"
            }
        },
        {
            "$sort": {
                "result": 1
            }
        }
    );

    return queryArray;
}

function filterQueryGenerator2(filter, searchString, type, isArray) {
    var queryArray = []

    if (searchString !=='') queryArray.push({ $match: { $and: [{ $text: { $search: searchString } }, { type: type }, { activeflag: 'active' }] } });
    else queryArray.push({ $match: { $and: [{ type: type }, { activeflag: 'active' }] } });
    
    queryArray.push(
        { 
            "$project" : { 
                "result" : "$"+filter, 
                "_id": 0
            }
        }
    );
    
    if (isArray) {
        queryArray.push({"$unwind": '$result'});
        queryArray.push({"$unwind": '$result'});
    } 

    queryArray.push(
        { 
            "$group" : { 
                "_id" : null, 
                "distinct" : { 
                    "$addToSet" : "$$ROOT"
                }
            }
        }, 
        { 
            "$unwind" : { 
                "path" : "$distinct", 
                "preserveNullAndEmptyArrays" : false
            }
        }, 
        { 
            "$replaceRoot" : { 
                "newRoot" : "$distinct"
            }
        },
        {
            "$sort": {
                "result": 1
            }
        }
    );

    return queryArray;
}

function getObjectFilters(searchQueryStart, req, type) {
    var searchQuery = JSON.parse(JSON.stringify(searchQueryStart));
    
    var license = req.query.license || "";
    var sample = req.query.sampleavailability || "";
    var datasetfeature = req.query.keywords || "";
    var publisher = req.query.publisher || "";
    var ageBand = req.query.ageband || "";
    var geographicCoverage = req.query.geographiccover || "";
    var phenotypes = req.query.phenotypes || "";

    var programmingLanguage = req.query.programmingLanguage || "";
    var toolcategories = req.query.toolcategories || "";
    var features = req.query.features || "";
    var tooltopics = req.query.tooltopics || "";

    var projectcategories = req.query.projectcategories || "";
    var projectfeatures = req.query.projectfeatures || "";
    var projecttopics = req.query.projecttopics || "";

    var paperfeatures = req.query.paperfeatures || "";
    var papertopics = req.query.papertopics || "";

    if (type === "dataset") {
        if (license.length > 0) {
            var filterTermArray = [];
            license.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "license": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }

        if (sample.length > 0) {
            var filterTermArray = [];
            sample.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "datasetfields.physicalSampleAvailability": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }

        if (datasetfeature.length > 0) {
            var filterTermArray = [];
            datasetfeature.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "tags.features": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }

        if (publisher.length > 0) {
            var filterTermArray = [];
            publisher.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "datasetfields.publisher": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }

        if (ageBand.length > 0) {
            var filterTermArray = [];
            ageBand.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "datasetfields.ageBand": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }

        if (geographicCoverage.length > 0) {
            var filterTermArray = [];
            geographicCoverage.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "datasetfields.geographicCoverage": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }

        if (phenotypes.length > 0) {
            var filterTermArray = [];
            phenotypes.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "datasetfields.phenotypes.name": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }
    }

    if (type === "tool") {
        if (programmingLanguage.length > 0) {
            var filterTermArray = [];
            programmingLanguage.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "categories.programmingLanguage": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }

        if (toolcategories.length > 0) {
            var filterTermArray = [];
            toolcategories.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "categories.category": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }

        if (features.length > 0) {
            var filterTermArray = [];
            features.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "tags.features": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }

        if (tooltopics.length > 0) {
            var filterTermArray = [];
            tooltopics.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "tags.topics": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }
    }
    else if (type === "project") {
        if (projectcategories.length > 0) {
            var filterTermArray = [];
            projectcategories.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "categories.category": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }

        if (projectfeatures.length > 0) {
            var filterTermArray = [];
            projectfeatures.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "tags.features": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }

        if (projecttopics.length > 0) {
            var filterTermArray = [];
            projecttopics.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "tags.topics": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }
    }
    else if (type === "paper") {
        if (paperfeatures.length > 0) {
            var filterTermArray = [];
            paperfeatures.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "tags.features": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }

        if (papertopics.length > 0) {
            var filterTermArray = [];
            papertopics.split('::').forEach((filterTerm) => {
                filterTermArray.push({ "tags.topics": filterTerm })
            });
            searchQuery["$and"].push({ "$or": filterTermArray });
        }
    }
    return searchQuery;
}

module.exports = router;