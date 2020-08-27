import express from 'express'
import axios from 'axios';

import { RecordSearchData } from '../search/record.search.model';
import { Data } from '../tool/data.model'

const router = express.Router();
  
/**
 * {get} /api/search Search tools
 * 
 * Return list of tools, this can be with filters or/and search criteria. This will also include pagination on results.
 * The free word search criteria can be improved on with node modules that specialize with searching i.e. js-search
 */
router.get('/', async (req, res) => {
    var authorID = parseInt(req.query.userID);
    var searchString = req.query.search || ""; //If blank then return all
    var tab = req.query.tab || "";
    let searchQuery = { $and: [{ activeflag: 'active' }] };

    if(req.query.form){
        searchQuery = {$and:[{$or:[{$and:[{activeflag:'review'},{authors:authorID}]},{activeflag:'active'}]}]};
    }

    var searchAll = false;

    if (searchString.length > 0) {
        searchQuery["$and"].push({ $text: { $search: searchString } });

        /* datasetSearchString = '"' + searchString.split(' ').join('""') + '"';
        //The following code is a workaround for the way search works TODO:work with MDC to improve API
        if (searchString.match(/"/)) {
            //user has added quotes so pass string through
            datasetSearchString = searchString;
        } else {
            //no quotes so lets a proximiy search
            datasetSearchString = '"'+searchString+'"~25';
        } */
    }
    else {
        searchAll = true;
    }
    
    var allResults = [], datasetResults = [], toolResults = [], projectResults = [], paperResults = [], personResults = [];

    if (tab === '') {
        allResults = await Promise.all([
            getObjectResult('dataset', searchAll, getObjectFilters(searchQuery, req, 'dataset'), req.query.datasetIndex || 0, req.query.maxResults || 40),
            getObjectResult('tool', searchAll, getObjectFilters(searchQuery, req, 'tool'), req.query.toolIndex || 0, req.query.maxResults || 40),
            getObjectResult('project', searchAll, getObjectFilters(searchQuery, req, 'project'), req.query.projectIndex || 0, req.query.maxResults || 40),
            getObjectResult('paper', searchAll, getObjectFilters(searchQuery, req, 'paper'), req.query.paperIndex || 0, req.query.maxResults || 40),
            getObjectResult('person', searchAll, searchQuery, req.query.personIndex || 0, req.query.maxResults || 40)
        ]);
    }
    else if (tab === 'Datasets') {
        datasetResults = await Promise.all([
            getObjectResult('dataset', searchAll, getObjectFilters(searchQuery, req, 'dataset'), req.query.datasetIndex || 0, req.query.maxResults || 40)
        ]);
    }
    else if (tab === 'Tools') {
        toolResults = await Promise.all([
            getObjectResult('tool', searchAll, getObjectFilters(searchQuery, req, 'tool'), req.query.toolIndex || 0, req.query.maxResults || 40)
        ]);
    }
    else if (tab === 'Projects') {
        projectResults = await Promise.all([
            getObjectResult('project', searchAll, getObjectFilters(searchQuery, req, 'project'), req.query.projectIndex || 0, req.query.maxResults || 40)
        ]);
    }
    else if (tab === 'Papers') {
        paperResults = await Promise.all([
            getObjectResult('paper', searchAll, getObjectFilters(searchQuery, req, 'paper'), req.query.paperIndex || 0, req.query.maxResults || 40)
        ]);
    }
    else if (tab === 'People') {
        personResults = await Promise.all([
            getObjectResult('person', searchAll, searchQuery, req.query.personIndex || 0, req.query.maxResults || 40)
        ]);
    }

    var summaryCounts = await Promise.all([
        getObjectCount('dataset', searchAll, getObjectFilters(searchQuery, req, 'dataset')),
        getObjectCount('tool', searchAll, getObjectFilters(searchQuery, req, 'tool')),
        getObjectCount('project', searchAll, getObjectFilters(searchQuery, req, 'project')),
        getObjectCount('paper', searchAll, getObjectFilters(searchQuery, req, 'paper')),
        getObjectCount('person', searchAll, searchQuery)
    ]);


    var summary = { 
        datasets: summaryCounts[0][0] !== undefined ? summaryCounts[0][0].count : 0, 
        tools: summaryCounts[1][0] !== undefined ? summaryCounts[1][0].count : 0,
        projects: summaryCounts[2][0] !== undefined ? summaryCounts[2][0].count : 0,
        papers: summaryCounts[3][0] !== undefined ? summaryCounts[3][0].count : 0,
        persons: summaryCounts[4][0] !== undefined ? summaryCounts[4][0].count : 0 
    }

    let recordSearchData = new RecordSearchData();
    recordSearchData.searched = searchString;
    recordSearchData.returned.dataset = summaryCounts[0][0] !== undefined ? summaryCounts[0][0].count : 0;
    recordSearchData.returned.tool = summaryCounts[1][0] !== undefined ? summaryCounts[1][0].count : 0;
    recordSearchData.returned.project = summaryCounts[2][0] !== undefined ? summaryCounts[2][0].count : 0;
    recordSearchData.returned.paper = summaryCounts[3][0] !== undefined ? summaryCounts[3][0].count : 0;
    recordSearchData.returned.person = summaryCounts[4][0] !== undefined ? summaryCounts[4][0].count : 0;
    recordSearchData.datesearched = Date.now();
    recordSearchData.save((err) => { });

    if (tab === '') {
        return res.json({
            success: true,
            datasetResults: allResults[0],
            toolResults: allResults[1],
            projectResults: allResults[2],
            paperResults: allResults[3],
            personResults: allResults[4],
            summary: summary
        });
    }
    return res.json({
        success: true,
        datasetResults: datasetResults[0],
        toolResults: toolResults[0],
        projectResults: projectResults[0],
        paperResults: paperResults[0],
        personResults: personResults[0],
        summary: summary
    });
});

function getObjectResult(type, searchAll, searchQuery, startIndex, maxResults) {
    var newSearchQuery = JSON.parse(JSON.stringify(searchQuery));
    newSearchQuery["$and"].push({ type: type })

    var q = '';
    
    if (searchAll) {
        q = Data.aggregate([
            { $match: newSearchQuery }, 
            { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } },            
            {
                $project: {
                            "_id": 0, 
                            "id": 1,
                            "name": 1,
                            "type": 1,
                            "description": 1,
                            "bio": 1,
                            "categories.category": 1,
                            "categories.programmingLanguage": 1,
                            "license": 1,
                            "tags.features": 1,
                            "tags.topics": 1,   
                            "firstname": 1,
                            "lastname": 1,
                            "datasetid": 1,

                            "datasetfields.publisher": 1,
                            "datasetfields.geographicCoverage": 1,
                            "datasetfields.physicalSampleAvailability": 1,
                            "datasetfields.abstract": 1,
                            "datasetfields.ageBand": 1,
                            "datasetfields.phenotypes": 1,

                            "persons.id": 1,
                            "persons.firstname": 1,
                            "persons.lastname": 1,

                            "activeflag": 1,
                          }
              }
        ]).sort({ name : 1 }).skip(parseInt(startIndex)).limit(parseInt(maxResults));
    }
    else {
        q = Data.aggregate([
            { $match: newSearchQuery },
            { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } },
            {
                $project: {
                            "_id": 0, 
                            "id": 1,
                            "name": 1,
                            "type": 1,
                            "description": 1,
                            "bio": 1,
                            "categories.category": 1,
                            "categories.programmingLanguage": 1,
                            "license": 1,
                            "tags.features": 1,
                            "tags.topics": 1,   
                            "firstname": 1,
                            "lastname": 1,
                            "datasetid": 1,

                            "datasetfields.publisher": 1,
                            "datasetfields.geographicCoverage": 1,
                            "datasetfields.physicalSampleAvailability": 1,
                            "datasetfields.abstract": 1,
                            "datasetfields.ageBand": 1,
                            "datasetfields.phenotypes": 1,

                            "persons.id": 1,
                            "persons.firstname": 1,
                            "persons.lastname": 1,

                            "activeflag": 1,
                          }
              }
        ]).sort({ score: { $meta: "textScore" } }).skip(parseInt(startIndex)).limit(parseInt(maxResults));
    }
    
    return new Promise((resolve, reject) => {
        q.exec((err, data) => {
            if (typeof data === "undefined") resolve([]);
            else resolve(data);
        })
    })
}

function getObjectCount(type, searchAll, searchQuery) {
    var newSearchQuery = JSON.parse(JSON.stringify(searchQuery));
    newSearchQuery["$and"].push({ type: type })
    var q = '';
    
    if (searchAll) {
        q = Data.aggregate([
            { $match: newSearchQuery }, 
            {
                "$group": {
                    "_id": {},
                    "count": {
                        "$sum": 1
                    }
                }
            }, 
            {
                "$project": {
                    "count": "$count",
                    "_id": 0
                }
            }
        ]);
    }
    else {
        q = Data.aggregate([
            { $match: newSearchQuery },
            {
                "$group": {
                    "_id": {},
                    "count": {
                        "$sum": 1
                    }
                }
            }, 
            {
                "$project": {
                    "count": "$count",
                    "_id": 0
                }
            }
        ]).sort({ score: { $meta: "textScore" } });
    }
    
    return new Promise((resolve, reject) => {
        q.exec((err, data) => {
            if (typeof data === "undefined") resolve([]);
            else resolve(data);
        })
    })
}

//Move to services
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