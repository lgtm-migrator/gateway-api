import express from 'express'
import { Data } from '../tool/data.model'

const router = express.Router();


// @route   GET api/v1/search/filter
// @desc    GET Get all filters
// @access  Public
router.get('/:searchString', async (req, res) => {
    //get all filters
    await Promise.all([
        licenseFilter(req, 'dataset', req.params.searchString),
        sampleFilter(req, req.params.searchString),
        featureFilter(req, 'dataset', req.params.searchString),
        publisherFilter(req, req.params.searchString),
        ageBandFilter(req, req.params.searchString),
        geographicCoverageFilter(req, req.params.searchString),

        topicFilter(req, 'tool', req.params.searchString),
        featureFilter(req, 'tool', req.params.searchString),
        languageFilter(req, 'tool', req.params.searchString),
        categoryFilter(req, 'tool', req.params.searchString),

        topicFilter(req, 'project', req.params.searchString),
        featureFilter(req, 'project', req.params.searchString),
        categoryFilter(req, 'project', req.params.searchString),

        topicFilter(req, 'paper', req.params.searchString),
        featureFilter(req, 'paper', req.params.searchString)
        
    ]).then((values) => {
        return res.json({
            success: true, 
            allFilters: {
                licenseFilter: values[0].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                sampleFilter: values[1].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                datasetFeatureFilter: values[2].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                publisherFilter: values[3].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                ageBandFilter: values[4].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                geographicCoverageFilter: values[5].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),

                toolTopicFilter: values[6].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                toolFeatureFilter: values[7].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                toolLanguageFilter: values[8].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                toolCategoryFilter: values[9].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),

                projectTopicFilter: values[10].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                projectFeatureFilter: values[11].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                projectCategoryFilter: values[12].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),

                paperTopicFilter: values[13].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                paperFeatureFilter: values[14].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; })
            }
        });
    });
});

//To be refactored and moved to its own filter.repository :)

router.get('/', async (req, res) => {
    //get all filters
    await Promise.all([
        licenseFilter(req, 'dataset', ''),
        sampleFilter(req, ''),
        featureFilter(req, 'dataset', ''),
        publisherFilter(req, ''),
        ageBandFilter(req, ''),
        geographicCoverageFilter(req, ''),

        topicFilter(req, 'tool', ''),
        featureFilter(req, 'tool', ''),
        languageFilter(req, 'tool', ''),
        categoryFilter(req, 'tool', ''),

        topicFilter(req, 'project', ''),
        featureFilter(req, 'project', ''),
        categoryFilter(req, 'project', ''),

        topicFilter(req, 'paper', ''),
        featureFilter(req, 'paper', '')
        
    ]).then((values) => {
        return res.json({
            success: true, 
            allFilters: {
                licenseFilter: values[0].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                sampleFilter: values[1].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                datasetFeatureFilter: values[2].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                publisherFilter: values[3].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                ageBandFilter: values[4].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                geographicCoverageFilter: values[5].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),

                toolTopicFilter: values[6].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                toolFeatureFilter: values[7].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                toolLanguageFilter: values[8].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                toolCategoryFilter: values[9].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),

                projectTopicFilter: values[10].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                projectFeatureFilter: values[11].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                projectCategoryFilter: values[12].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),

                paperTopicFilter: values[13].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; }),
                paperFeatureFilter: values[14].sort(function (a, b) { return (a.toUpperCase() < b.toUpperCase()) ? -1 : (a.toUpperCase() > b.toUpperCase()) ? 1 : 0; })
            }
        });
    });
});




router.get('/topic/:type',
    async (req, res) => {
      await topicFilter(req)
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
      await featureFilter(req)
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
      await languageFilter(req)
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
      await categoryFilter(req)
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
      await licenseFilter(req)
        .then(data => {
          return res.json({success: true, data});
        })
        .catch(err => {
          return res.json({success: false, err});
        });
    }
);


  



const sampleFilter = async (req, searchString) => {
    return new Promise(async (resolve, reject) => {
        var q = '';
        if (searchString) q = Data.aggregate([{ $match: { $and: [{ $text: { $search: searchString } }, { type: 'dataset' }, { activeflag: 'active' }] } }])
        else q = Data.aggregate([{ $match: { $and: [{ type: 'dataset' }, { activeflag: 'active' }] } }])

        q.exec((err, data) => {
            if (err) return resolve({})
            
            var tempSample = [];
            if (data.length) {
                data.map((dat) => {
                    if (dat.datasetfields.physicalSampleAvailability !== null) {
                        dat.datasetfields ? dat.datasetfields.physicalSampleAvailability.map((sample) => {
                            sample.length <= 0 ? tempSample = tempSample : tempSample.push(sample.trim());
                        }) : ''
                    }
                });
            }

            const combinedSample = [];
            tempSample.map(temp => {
                if (combinedSample.indexOf(temp) === -1) {
                    combinedSample.push(temp)
                }
            });
            
            resolve(combinedSample);
        });
    })
}

const publisherFilter = async (req, searchString) => {
    return new Promise(async (resolve, reject) => {
        var q = '';
        if (searchString) q = Data.aggregate([{ $match: { $and: [{ $text: { $search: searchString } }, { type: 'dataset' }, { activeflag: 'active' }] } }])
        else q = Data.aggregate([{ $match: { $and: [{ type: 'dataset' }, { activeflag: 'active' }] } }])

        q.exec((err, data) => {
            if (err) return resolve({})
            
            var tempPublisher = [];
            if (data.length) {
                data.map((dat) => {
                    if (dat.datasetfields.publisher !== null) {
                        tempPublisher.push(dat.datasetfields.publisher.trim());
                    }
                });
            }

            const combinedPublisher = [];
            tempPublisher.map(temp => {
                if (combinedPublisher.indexOf(temp) === -1) {
                    combinedPublisher.push(temp)
                }
            });
            
            resolve(combinedPublisher);
        });
    })
}

const ageBandFilter = async (req, searchString) => {
    return new Promise(async (resolve, reject) => {
        var q = '';
        if (searchString) q = Data.aggregate([{ $match: { $and: [{ $text: { $search: searchString } }, { type: 'dataset' }, { activeflag: 'active' }] } }])
        else q = Data.aggregate([{ $match: { $and: [{ type: 'dataset' }, { activeflag: 'active' }] } }])

        q.exec((err, data) => {
            if (err) return resolve({})
            
            var tempAgeBand = [];
            if (data.length) {
                data.map((dat) => {
                    if (dat.datasetfields.ageBand && dat.datasetfields.ageBand !== null) {
                        tempAgeBand.push(dat.datasetfields.ageBand.trim());
                    }
                });
            }

            const combinedAgeBand = [];
            tempAgeBand.map(temp => {
                if (combinedAgeBand.indexOf(temp) === -1) {
                    combinedAgeBand.push(temp)
                }
            });
            
            resolve(combinedAgeBand);
        });
    })
}

const geographicCoverageFilter = async (req, searchString) => {
    return new Promise(async (resolve, reject) => {
        var q = '';
        if (searchString) q = Data.aggregate([{ $match: { $and: [{ $text: { $search: searchString } }, { type: 'dataset' }, { activeflag: 'active' }] } }])
        else q = Data.aggregate([{ $match: { $and: [{ type: 'dataset' }, { activeflag: 'active' }] } }])

        q.exec((err, data) => {
            if (err) return resolve({})
            
            var tempGeographicCoverage = [];
            if (data.length) {
                data.map((dat) => {
                    if (dat.datasetfields.geographicCoverage && dat.datasetfields.geographicCoverage !== null) {
                        tempGeographicCoverage.push(dat.datasetfields.geographicCoverage.trim());
                    }
                });
            }

            const combinedGeographicCoverage = [];
            tempGeographicCoverage.map(temp => {
                if (combinedGeographicCoverage.indexOf(temp) === -1) {
                    combinedGeographicCoverage.push(temp)
                }
            });
            
            resolve(combinedGeographicCoverage);
        });
    })
}

const topicFilter = async (req, type, searchString) => {
    return new Promise(async (resolve, reject) => {
        var typeIs = req.params.type
        if (type) typeIs = type

        var q = '';
        if (searchString) q = Data.aggregate([{ $match: { $and: [{ $text: { $search: searchString } }, { type: typeIs }, { activeflag: 'active' }] } }])
        else q = Data.aggregate([{ $match: { $and: [{ type: typeIs }, { activeflag: 'active' }] } }])

        q.exec((err, data) => {
            if (err) return resolve({})
            var tempTopics = [];
            if (data.length) {
                data.map((dat) => {
                    if (dat.tags.topics !== null) {
                        dat.tags ? dat.tags.topics.map((topic) => {
                            topic.length <= 0 ? tempTopics = tempTopics : tempTopics.push(topic.trim());
                        }) : ''
                    }
                });
            }

            const combinedTopics = [];
            tempTopics.map(temp => {
                if (combinedTopics.indexOf(temp) === -1) {
                    combinedTopics.push(temp)
                }
            });
            
            resolve(combinedTopics);
        });
    })
};

const featureFilter = async (req, type, searchString) => {
    return new Promise(async (resolve, reject) => {
        var typeIs = req.params.type
        if (type) typeIs = type

        var q = '';
        if (searchString) q = Data.aggregate([{ $match: { $and: [{ $text: { $search: searchString } }, { type: typeIs }, { activeflag: 'active' }] } }])
        else q = Data.aggregate([{ $match: { $and: [{ type: typeIs }, { activeflag: 'active' }] } }])

        q.exec((err, data) => {
            if (err) return resolve({})
            var tempFeatures = [];
            if (data.length) {
                data.map((dat) => {
                    if (typeof dat.tags.features !== 'undefined' && dat.tags.features !== null && dat.tags.features.length > 0) {
                        dat.tags.features.map((feature) => {
                            feature.length <= 0 ? tempFeatures = tempFeatures : tempFeatures.push(feature.trim());
                        });
                    }
                });
            }

            const combinedFeatures = [];
            if (tempFeatures.length) {
                tempFeatures.map(temp => {
                    if (combinedFeatures.indexOf(temp) === -1) {
                        combinedFeatures.push(temp)
                    }
                });
            }

            resolve(combinedFeatures);
        });
    })
};

const languageFilter = async (req, type, searchString) => {
    return new Promise(async (resolve, reject) => {
        var typeIs = req.params.type
        if (type) typeIs = type

        var q = '';
        if (searchString) q = Data.aggregate([{ $match: { $and: [{ $text: { $search: searchString } }, { type: typeIs }, { activeflag: 'active' }] } }])
        else q = Data.aggregate([{ $match: { $and: [{ type: typeIs }, { activeflag: 'active' }] } }])

        q.exec((err, data) => {
            if (err) return resolve({})
            var tempLanguages = [];
            data.map((dat) => {
                dat.categories.programmingLanguage ? dat.categories.programmingLanguage.map((language) => {
                    language.length <= 0 ? tempLanguages = tempLanguages : tempLanguages.push(language.trim());
                }) : ''
            });

            const combinedLanguages = [];
            tempLanguages.map(temp => {
                if (combinedLanguages.indexOf(temp) === -1) {
                    combinedLanguages.push(temp)
                }
            });

            resolve(combinedLanguages);
        });
    })
};

const categoryFilter = async (req, type, searchString) => {
    return new Promise(async (resolve, reject) => {
        var typeIs = req.params.type
        if (type) typeIs = type

        var q = '';
        if (searchString) q = Data.aggregate([{ $match: { $and: [{ $text: { $search: searchString } }, { type: typeIs }, { activeflag: 'active' }] } }])
        else q = Data.aggregate([{ $match: { $and: [{ type: typeIs }, { activeflag: 'active' }] } }])

        q.exec((err, data) => {
            if (err) return resolve({})
            var tempCategories = [];
            data.map((dat) => {
                !dat.categories.category || dat.categories.category.length <= 0 ? tempCategories = tempCategories : tempCategories.push(dat.categories.category.trim());
            });

            const combinedCategories = [];
            tempCategories.map(temp => {
                if (combinedCategories.indexOf(temp) === -1) {
                    combinedCategories.push(temp)
                }
            });

            resolve(combinedCategories);
        });
    })
};

const licenseFilter = async (req, type, searchString) => {
    return new Promise(async (resolve, reject) => {
        var typeIs = req.params.type
        if (type) typeIs = type

        var q = '';
        if (searchString) q = Data.aggregate([{ $match: { $and: [{ $text: { $search: searchString } }, { type: typeIs }, { activeflag: 'active' }] } }])
        else q = Data.aggregate([{ $match: { $and: [{ type: typeIs }, { activeflag: 'active' }] } }])

        q.exec((err, data) => {
            if (err) return resolve({})
            var tempLicenses = [];
            data.map((dat) => {
                if (dat.license)
                    dat.license.length <= 0 ? tempLicenses = tempLicenses : tempLicenses.push(dat.license.trim());
            });

            const combinedLicenses = [];
            tempLicenses.map(temp => {
                if (combinedLicenses.indexOf(temp) === -1) {
                    combinedLicenses.push(temp)
                }
            });

            resolve(combinedLicenses);
        });
    })
};

module.exports = router;