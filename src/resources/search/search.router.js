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
    var searchString = req.query.search || ""; //If blank then return all
    let searchQuery = { $and: [{ activeflag: 'active' }] };
    var searchAll = false;
    var datasetSearchString = '';

    if (searchString.length > 0) {
        searchQuery["$and"].push({ $text: { $search: searchString } });
        datasetSearchString = '"' + searchString.split(' ').join('""') + '"';
        //The following code is a workaround for the way search works TODO:work with MDC to improve API
        if (searchString.match(/"/)) {
            //user has added quotes so pass string through
            datasetSearchString = searchString;
        } else {
            //no quotes so lets a proximiy search
            datasetSearchString = '"'+searchString+'"~25';
        }
    }
    else {
        searchAll = true;
    }

    await Promise.all([
        getDatasetResult(datasetSearchString, getDatasetFilters(req)),
        getObjectResult('tool', searchAll, getObjectFilters(searchQuery, req, 'tool')),
        getObjectResult('project', searchAll, getObjectFilters(searchQuery, req, 'project')),
        getObjectResult('paper', searchAll, getObjectFilters(searchQuery, req, 'paper')),
        getObjectResult('person', searchAll, searchQuery),
    ]).then((values) => {
        var datasetCount = values[0].results.length || 0;
        var toolCount = values[1].length || 0;
        var projectCount = values[2].length || 0;
        var paperCount = values[3].length || 0;
        var personCount = values[4].length || 0;

        let recordSearchData = new RecordSearchData();
        recordSearchData.searched = searchString;
        recordSearchData.returned.dataset = datasetCount;
        recordSearchData.returned.tool = toolCount;
        recordSearchData.returned.project = projectCount;
        recordSearchData.returned.paper = paperCount;
        recordSearchData.returned.person = personCount;
        recordSearchData.datesearched = Date.now();
        recordSearchData.save((err) => { });

        var filterOptions = getFilterOptions(values)
        var summary = { datasets: datasetCount, tools: toolCount, projects: projectCount, papers: paperCount, persons: personCount }
        
        var datasetIndex = req.query.datasetIndex || 0;
        var toolIndex = req.query.toolIndex || 0;
        var projectIndex = req.query.projectIndex || 0;
        var paperIndex = req.query.paperIndex || 0;
        var personIndex = req.query.personIndex || 0;
        var maxResults = req.query.maxResults || 40;

        var datasetList = values[0].results.slice(datasetIndex, (+datasetIndex + +maxResults));
        var toolList = values[1].slice(toolIndex, (+toolIndex + +maxResults));
        var projectList = values[2].slice(projectIndex, (+projectIndex + +maxResults));
        var paperList = values[3].slice(paperIndex, (+paperIndex + +maxResults));
        var personList = values[4].slice(personIndex, (+personIndex + +maxResults));

        return res.json({
            success: true,
            datasetResults: datasetList,
            toolResults: toolList,
            projectResults: projectList,
            paperResults: paperList,
            personResults: personList,
            filterOptions: filterOptions,
            summary: summary
        });
    });
});

function getDatasetResult(searchString, datasetFilters) {
    var metadataCatalogue = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
    var count = 5;

    return new Promise((resolve, reject) => {
        axios.post(metadataCatalogue + '/api/profiles/uk.ac.hdrukgateway/HdrUkProfilePluginService/customSearch?searchTerm=' + searchString + '&domainType=DataModel&limit=1' + datasetFilters)
            .then(function (response) {
                count = response.data.count;
            })
            .then(function () {
                axios.post(metadataCatalogue + '/api/profiles/uk.ac.hdrukgateway/HdrUkProfilePluginService/customSearch?searchTerm=' + searchString + '&domainType=DataModel&limit=' + count + datasetFilters)
                    .then(function (response) {
                        resolve(response.data);
                    })
                    .catch(function (err) {
                        reject(err);
                    })
            })
    })
}

function getObjectResult(type, searchAll, searchQuery) {
    var newSearchQuery = JSON.parse(JSON.stringify(searchQuery));
    newSearchQuery["$and"].push({ type: type })
    var q = '';

    if (searchAll) {
        q = Data.aggregate([
            { $match: newSearchQuery },
            { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } },
            { $lookup: { from: "tools", localField: "id", foreignField: "authors", as: "objects" } },
            { $lookup: { from: "reviews", localField: "id", foreignField: "toolID", as: "reviews" } }
        ]);
    }
    else {
        q = Data.aggregate([
            { $match: newSearchQuery },
            { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } },
            { $lookup: { from: "tools", localField: "id", foreignField: "authors", as: "objects" } },
            { $lookup: { from: "reviews", localField: "id", foreignField: "toolID", as: "reviews" } }
        ]).sort({ score: { $meta: "textScore" } });
    }

    return new Promise((resolve, reject) => {
        q.exec((err, data) => {
            if (typeof data === "undefined") resolve([]);
            else resolve(data);
        })
    })
}


function getObjectFilters(searchQueryStart, req, type) {
    var searchQuery = JSON.parse(JSON.stringify(searchQueryStart));
    var programmingLanguage = req.query.programmingLanguage || "";
    var toolcategories = req.query.toolcategories || "";
    var features = req.query.features || "";
    var tooltopics = req.query.tooltopics || "";

    var projectcategories = req.query.projectcategories || "";
    var projectfeatures = req.query.projectfeatures || "";
    var projecttopics = req.query.projecttopics || "";

    var paperfeatures = req.query.paperfeatures || "";
    var papertopics = req.query.papertopics || "";

    if (type === "tool") {
        if (programmingLanguage.length > 0) {
            var pl = [];
            if (!Array.isArray(programmingLanguage)) {
                pl = [{ "categories.programmingLanguage": programmingLanguage }];
            } else {
                for (var i = 0; i < programmingLanguage.length; i++) {
                    pl[i] = { "categories.programmingLanguage": programmingLanguage[i] };
                }
            }
            searchQuery["$and"].push({ "$or": pl });
        }

        if (toolcategories.length > 0) {
            var tc = [];
            if (!Array.isArray(toolcategories)) {
                tc = [{ "categories.category": toolcategories }];
            } else {
                for (var i = 0; i < toolcategories.length; i++) {
                    tc[i] = { "categories.category": toolcategories[i] };
                }
            }
            searchQuery["$and"].push({ "$or": tc });
        }

        if (features.length > 0) {
            var f = [];
            if (!Array.isArray(features)) {
                f = [{ "tags.features": features }];
            } else {
                for (var i = 0; i < features.length; i++) {
                    f[i] = { "tags.features": features[i] };
                }
            }
            searchQuery["$and"].push({ "$or": f });
        }

        if (tooltopics.length > 0) {
            var t = [];
            if (!Array.isArray(tooltopics)) {
                t = [{ "tags.topics": tooltopics }];
            } else {
                for (var i = 0; i < tooltopics.length; i++) {
                    t[i] = { "tags.topics": tooltopics[i] };
                }
            }
            searchQuery["$and"].push({ "$or": t });
        }
    }
    else if (type === "project") {
        if (projectcategories.length > 0) {
            var tc = [];
            if (!Array.isArray(projectcategories)) {
                tc = [{ "categories.category": projectcategories }];
            } else {
                for (var i = 0; i < projectcategories.length; i++) {
                    tc[i] = { "categories.category": projectcategories[i] };
                }
            }
            searchQuery["$and"].push({ "$or": tc });
        }

        if (projectfeatures.length > 0) {
            var t = [];
            if (!Array.isArray(projectfeatures)) {
                t = [{ "tags.features": projectfeatures }];
            } else {
                for (var i = 0; i < projectfeatures.length; i++) {
                    t[i] = { "tags.features": projectfeatures[i] };
                }
            }
            searchQuery["$and"].push({ "$or": t });
        }

        if (projecttopics.length > 0) {
            var t = [];
            if (!Array.isArray(projecttopics)) {
                t = [{ "tags.topics": projecttopics }];
            } else {
                for (var i = 0; i < projecttopics.length; i++) {
                    t[i] = { "tags.topics": projecttopics[i] };
                }
            }
            searchQuery["$and"].push({ "$or": t });
        }
    }
    else if (type === "paper") {
        if (paperfeatures.length > 0) {
            var t = [];
            if (!Array.isArray(paperfeatures)) {
                t = [{ "tags.features": paperfeatures }];
            } else {
                for (var i = 0; i < paperfeatures.length; i++) {
                    t[i] = { "tags.features": paperfeatures[i] };
                }
            }
            searchQuery["$and"].push({ "$or": t });
        }

        if (papertopics.length > 0) {
            var t = [];
            if (!Array.isArray(papertopics)) {
                t = [{ "tags.topics": papertopics }];
            } else {
                for (var i = 0; i < papertopics.length; i++) {
                    t[i] = { "tags.topics": papertopics[i] };
                }
            }
            searchQuery["$and"].push({ "$or": t });
        }
    }
    return searchQuery;
}

function getDatasetFilters(req) {
    var filterString = '';

    if (req.query.publisher) {
        if (typeof (req.query.publisher) == 'string') {
            filterString += '&publisher=' + req.query.publisher;
        }
        else if (typeof (req.query.publisher) == 'object') {
            req.query.publisher.map((pub) => {
                filterString += filterString + '&publisher=' + pub;
            })
        }
    }

    if (req.query.license) {
        if (typeof (req.query.license) == 'string') {
            filterString += '&license=' + req.query.license;
        }
        else if (typeof (req.query.license) == 'object') {
            req.query.license.map((lic) => {
                filterString += filterString + '&license=' + lic;
            })
        }
    }

    if (req.query.geographiccover) {
        if (typeof (req.query.geographiccover) == 'string') {
            filterString += '&geographicCoverage=' + req.query.geographiccover;
        }
        else if (typeof (req.query.geographiccover) == 'object') {
            req.query.geographiccover.map((geo) => {
                filterString += filterString + '&geographicCoverage=' + geo;
            })
        }
    }

    if (req.query.ageband) {
        if (typeof (req.query.ageband) == 'string') {
            filterString += '&ageBand=' + req.query.ageband.replace("+", "%2B");
        }
        else if (typeof (req.query.ageband) == 'object') {
            req.query.ageband.map((age) => {
                filterString += filterString + '&ageBand=' + age.replace("+", "%2B");
            })
        }
    }

    if (req.query.sampleavailability) {
        if (typeof (req.query.sampleavailability) == 'string') {
            filterString += '&physicalSampleAvailability=' + req.query.sampleavailability;
        }
        else if (typeof (req.query.sampleavailability) == 'object') {
            req.query.sampleavailability.map((samp) => {
                filterString += filterString + '&physicalSampleAvailability=' + samp;
            })
        }
    }

    if (req.query.keywords) {
        if (typeof (req.query.keywords) == 'string') {
            filterString += '&keywords=' + req.query.keywords;
        }
        else if (typeof (req.query.keywords) == 'object') {
            req.query.keywords.map((key) => {
                filterString += filterString + '&keywords=' + key;
            })
        }
    }
    return filterString;
}

function getFilterOptions(values) {
    var licenseFilterOptions = [];
    var sampleFilterOptions = [];
    var keywordsFilterOptions = [];
    var publisherFilterOptions = [];
    var ageBandFilterOptions = [];
    var geographicCoverageFilterOptions = [];

    var toolCategoriesFilterOptions = [];
    var programmingLanguageFilterOptions = [];
    var featuresFilterOptions = [];
    var toolTopicsFilterOptions = [];

    var projectCategoriesFilterOptions = [];
    var projectFeaturesFilterOptions = [];
    var projectTopicsFilterOptions = [];

    var paperFeaturesFilterOptions = [];
    var paperTopicsFilterOptions = [];

    values[0].results.forEach((dataset) => {
        if (dataset.license && dataset.license !== '' && !licenseFilterOptions.includes(dataset.license)) {
            licenseFilterOptions.push(dataset.license);
        }

        if (dataset.physicalSampleAvailability && dataset.physicalSampleAvailability !== '' && !sampleFilterOptions.includes(dataset.physicalSampleAvailability)) {
            /* var physicalSampleAvailabilitySplit = dataset.physicalSampleAvailability.split(',');
            physicalSampleAvailabilitySplit.forEach((psa) => {
                if (!sampleFilterOptions.includes(psa.trim()) && psa !== '') {
                    sampleFilterOptions.push(psa.trim());
                }
            }); */
            sampleFilterOptions.push(dataset.physicalSampleAvailability);
        }

        if (dataset.keywords && dataset.keywords !== '' && !keywordsFilterOptions.includes(dataset.keywords)) {
            /* var keywordsSplit = dataset.keywords.split(',');
            keywordsSplit.forEach((kw) => {
                if (!keywordsFilterOptions.includes(kw.trim()) && kw !== '') {
                    keywordsFilterOptions.push(kw.trim());
                }
            }); */
            keywordsFilterOptions.push(dataset.keywords);
        }

        if (dataset.publisher && dataset.publisher !== '' && !publisherFilterOptions.includes(dataset.publisher)) {
            publisherFilterOptions.push(dataset.publisher);
        }

        if (dataset.ageBand && dataset.ageBand !== '' && !ageBandFilterOptions.includes(dataset.ageBand)) {
            ageBandFilterOptions.push(dataset.ageBand);
        }

        if (dataset.geographicCoverage && dataset.geographicCoverage !== '' && !geographicCoverageFilterOptions.includes(dataset.geographicCoverage)) {
            geographicCoverageFilterOptions.push(dataset.geographicCoverage);
        }
    })

    values[1].forEach((tool) => {
        if (tool.categories && tool.categories.category && tool.categories.category !== '' && !toolCategoriesFilterOptions.includes(tool.categories.category)) {
            toolCategoriesFilterOptions.push(tool.categories.category);
        }

        if (tool.categories.programmingLanguage && tool.categories.programmingLanguage.length > 0) {
            tool.categories.programmingLanguage.forEach((pl) => {
                if (!programmingLanguageFilterOptions.includes(pl) && pl !== '') {
                    programmingLanguageFilterOptions.push(pl);
                }
            });
        }

        if (tool.tags.features && tool.tags.features.length > 0) {
            tool.tags.features.forEach((fe) => {
                if (!featuresFilterOptions.includes(fe) && fe !== '') {
                    featuresFilterOptions.push(fe);
                }
            });
        }

        if (tool.tags.topics && tool.tags.topics.length > 0) {
            tool.tags.topics.forEach((to) => {
                if (!toolTopicsFilterOptions.includes(to) && to !== '') {
                    toolTopicsFilterOptions.push(to);
                }
            });
        }
    })

    values[2].forEach((project) => {
        if (project.categories && project.categories.category && project.categories.category !== '' && !projectCategoriesFilterOptions.includes(project.categories.category)) {
            projectCategoriesFilterOptions.push(project.categories.category);
        }

        if (project.tags.features && project.tags.features.length > 0) {
            project.tags.features.forEach((pf) => {
                if (!projectFeaturesFilterOptions.includes(pf) && pf !== '') {
                    projectFeaturesFilterOptions.push(pf);
                }
            });
        }

        if (project.tags.topics && project.tags.topics.length > 0) {
            project.tags.topics.forEach((pto) => {
                if (!projectTopicsFilterOptions.includes(pto) && pto !== '') {
                    projectTopicsFilterOptions.push(pto);

                }
            });
        }
    })

    values[3].forEach((paper) => {
        if (paper.tags.features && paper.tags.features.length > 0) {
            paper.tags.features.forEach((pf) => {
                if (!paperFeaturesFilterOptions.includes(pf) && pf !== '') {
                    paperFeaturesFilterOptions.push(pf);
                }
            });
        }

        if (paper.tags.topics && paper.tags.topics.length > 0) {
            paper.tags.topics.forEach((pat) => {
                if (!paperTopicsFilterOptions.includes(pat) && pat !== '') {
                    paperTopicsFilterOptions.push(pat);
                }
            });
        }
    })

    return {
        licenseFilterOptions: licenseFilterOptions.sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
        sampleFilterOptions: sampleFilterOptions.sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
        keywordsFilterOptions: keywordsFilterOptions.sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
        publisherFilterOptions: publisherFilterOptions.sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
        ageBandFilterOptions: ageBandFilterOptions.sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
        geographicCoverageFilterOptions: geographicCoverageFilterOptions.sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
        
        toolCategoriesFilterOptions: toolCategoriesFilterOptions.sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
        programmingLanguageFilterOptions: programmingLanguageFilterOptions.sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
        featuresFilterOptions: featuresFilterOptions.sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
        toolTopicsFilterOptions: toolTopicsFilterOptions.sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
        
        projectCategoriesFilterOptions: projectCategoriesFilterOptions.sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
        projectFeaturesFilterOptions: projectFeaturesFilterOptions.sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
        projectTopicsFilterOptions: projectTopicsFilterOptions.sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
        
        paperFeaturesFilterOptions: paperFeaturesFilterOptions.sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
        paperTopicsFilterOptions: paperTopicsFilterOptions.sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; })
    };
}

module.exports = router;