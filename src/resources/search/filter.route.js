import express from 'express'
import { getObjectFilters, getFilter } from './search.repository';

const router = express.Router();


// @route   GET api/v1/search/filter
// @desc    GET Get filters
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

// @route   GET api/v1/search/filter/topic/:type
// @desc    GET Get list of topics by entity type
// @access  Public
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

// @route   GET api/v1/search/filter/feature/:type
// @desc    GET Get list of features by entity type
// @access  Public
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

// @route   GET api/v1/search/filter/language/:type
// @desc    GET Get list of languages by entity type
// @access  Public
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

// @route   GET api/v1/search/filter/category/:type
// @desc    GET Get list of categories by entity type
// @access  Public
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

// @route   GET api/v1/search/filter/license/:type
// @desc    GET Get list of licenses by entity type
// @access  Public
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

module.exports = router;