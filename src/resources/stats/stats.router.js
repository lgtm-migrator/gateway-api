import express from 'express';
import axios from 'axios';
import { RecordSearchData } from '../search/record.search.model';
import { Data } from '../tool/data.model';
import {DataRequestModel} from '../datarequests/datarequests.model';

const router = express.Router()

/**
 * {get} /stats get some basic high level stats
 * 
 * This will return a JSON document to show high level stats
 */
router.get('/', async (req, res) => {
    var result;
  
    //get some dates for query
    var lastDay = new Date();
    lastDay.setDate(lastDay.getDate() - 1);
  
    var lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
  
    var lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
  
    var lastYear = new Date();
    lastYear.setYear(lastYear.getYear() - 1);
  
    var aggregateQuerySearches = [
      {
        $facet: {
          "lastDay": [
            { "$match": { "datesearched": { "$gt": lastDay } } },
            {
              $group: {
                _id: 'lastDay',
                count: { $sum: 1 }
              },
            }
          ],
          "lastWeek": [
            { "$match": { "datesearched": { "$gt": lastWeek } } },
            {
              $group: {
                _id: 'lastWeek',
                count: { $sum: 1 }
              },
            }
          ],
          "lastMonth": [
            { "$match": { "datesearched": { "$gt": lastMonth } } },
            {
              $group: {
                _id: 'lastMonth',
                count: { $sum: 1 }
              },
            }
          ],
          "lastYear": [
            { "$match": { "datesearched": { "$gt": lastYear } } },
            {
              $group: {
                _id: 'lastYear',
                count: { $sum: 1 }
              },
            }
          ],
        }
      }];
  
    //set the aggregate queries
    var aggregateQueryTypes = [{ $match: { activeflag: "active" } },{ $group: { _id: "$type", count: { $sum: 1 } } }];
  
    var q = RecordSearchData.aggregate(aggregateQuerySearches);

    var aggregateAccessRequests = [{ $match: { applicationStatus: "submitted" } }, { $group: {_id: "accessRequests", count: { $sum: 1 } } }];

    var y = DataRequestModel.aggregate(aggregateAccessRequests);

    var metadataCatalogue = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
    
    q.exec((err, dataSearches) => {
      if (err) return res.json({ success: false, error: err });
  
      var x = Data.aggregate(aggregateQueryTypes);
      x.exec((errx, dataTypes) => {
        if (errx) return res.json({ success: false, error: errx });
  
        var counts = {}; //hold the type (i.e. tool, person, project, access requests) counts data
        for (var i = 0; i < dataTypes.length; i++) { //format the result in a clear and dynamic way
          counts[dataTypes[i]._id] = dataTypes[i].count;
        }

      y.exec((err, accessRequests) => {
        if (err) return res.json({ success: false, error: err });
  
        if (typeof accessRequests[0] === "undefined") {
          counts["accessRequests"] = 0;
        }
        else if(accessRequests && accessRequests.length){
          counts[accessRequests[0]._id] = accessRequests[0].count;
        }

      axios.get(metadataCatalogue + '/api/catalogueItems/search?searchTerm=&domainType=DataModel&limit=1')
      .catch(function (err) {
        // handle error
        return res.json({ success: false, error: err.message + ' (raw message from metadata catalogue)' });
      })
      .then(function (response){
          counts["datasets"] = response.data.count;
  
        if (typeof dataSearches[0].lastDay[0] === "undefined") {
          dataSearches[0].lastDay[0] = { count: 0 };
        }
        if (typeof dataSearches[0].lastWeek[0] === "undefined") {
          dataSearches[0].lastWeek[0] = { count: 0 };
        }
        if (typeof dataSearches[0].lastMonth[0] === "undefined") {
          dataSearches[0].lastMonth[0] = { count: 0 };
        }
        if (typeof dataSearches[0].lastYear[0] === "undefined") {
          dataSearches[0].lastYear[0] = { count: 0 };
        }

        result = res.json(
          {
            'success': true, 'data':
            {
              'typecounts': counts,
              'daycounts': {
                'day': dataSearches[0].lastDay[0].count,
                'week': dataSearches[0].lastWeek[0].count,
                'month': dataSearches[0].lastMonth[0].count,
                'year': dataSearches[0].lastYear[0].count,
  
              },
            }
          }
        );
      });
      });
      });
    });
  
    return result;
  });

  /**
   * {get} /stats/recent Recent Searches
   * 
   * Return the details on the recent searches.
   */
  router.get('/recent', async (req, res) => {
    var q = RecordSearchData.aggregate([
      { $match: { $or: [ { "returned.tool": { $gt : 0}}, { "returned.project": { $gt : 0}}, { "returned.person": { $gt : 0}} ] }},
      {
        $group: {
          _id: {$toLower: "$searched"},
          count: { $sum: 1 },
          returned: { $first: "$returned" }
        }
      },
      {$sort:{ datesearched : 1}}
    ]).limit(10);
  
    q.exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, data: data });
    });
  });

  
  /**
   * {get} /stats/unmet Unmet Searches
   * 
   * Return the details on the unmet searches.
   */
  router.get('/unmet', async (req, res) => {
    var q = RecordSearchData.aggregate([
      
      { $match: { returned: null}},
      {
        $group: {
          _id: { $toLower: "$searched"},
          count: { $sum: 1 }
        }
      },
      {$sort:{ count : -1}}
    ]).limit(10);
  
    q.exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, data: data });
    });
  });

  /**
   * {get} /stats/unmet Unmet Searches
   * 
   * Return the details on the unmet searches.
   */
  router.get('/unmetDatasets', async (req, res) => {
    req.entity = "dataset";
    await getUnmetSearches(req)
      .then((data) =>{
        return res.json({ success: true, data: data });
      })
      .catch((err) => {
        return res.json({ success: false, error: err });
      });
  });

  router.get('/unmetTools', async (req, res) => {
    req.entity = "tool";
    await getUnmetSearches(req)
      .then((data) =>{
        return res.json({ success: true, data: data });
      })
      .catch((err) => {
        return res.json({ success: false, error: err });
      });
  });

  router.get('/unmetProjects', async (req, res) => {
    req.entity = "project";
    await getUnmetSearches(req)
      .then((data) =>{
        return res.json({ success: true, data: data });
      })
      .catch((err) => {
        return res.json({ success: false, error: err });
      });
  });
  
  router.get('/unmetPapers', async (req, res) => {
    req.entity = "paper";
    await getUnmetSearches(req)
      .then((data) =>{
        return res.json({ success: true, data: data });
      })
      .catch((err) => {
        return res.json({ success: false, error: err });
      });
  });

  router.get('/unmetPeople', async (req, res) => {
    req.entity = "person";
    await getUnmetSearches(req)
      .then((data) =>{
        return res.json({ success: true, data: data });
      })
      .catch((err) => {
        return res.json({ success: false, error: err });
      });
  });
  /**
   * {get} /stats/popular Popular Objects
   * 
   * Return the details on the popular objects.
   */
  router.get('/popular', async (req, res) => {
    var q = Data.find({ counter: { $gt : 0} }).sort({ counter: -1 }).limit(10);
  
    if (req.query.type) {
      q = Data.find({ $and:[ {type : req.query.type, counter: { $gt : 0} }]}).sort({ counter: -1 }).limit(10);
    }
  
    q.exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, data: data });
    });
  });
  
  /**
   * {get} /stats/popular Updated Objects
   * 
   * Return the details on the updated objects.
   */
  router.get('/updates', async (req, res) => {
    var q = Data.find({activeflag: "active", counter: { $gt : 0} }).sort({ updatedon: -1 }).limit(10);
  
    if (req.query.type) {
      q = Data.find({ $and:[ {type : req.query.type, activeflag: "active", updatedon: { $gt : 0} }]}).sort({ counter: -1 }).limit(10);
    }
  
    q.exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, data: data });
    });
  });
  
  module.exports = router

  const getUnmetSearches = async(req, res) => {
    return new Promise(async (resolve, reject) => {

      let searchMonth = parseInt(req.query.month);
      let searchYear = parseInt(req.query.year);
      let entitySearch = { ["returned." + req.entity] : {$lte : 0}  };
      let q = RecordSearchData.aggregate([
        
        { $addFields: { "month": {$month: '$createdAt'},
                        "year": {$year: '$createdAt'}}},
        {$match:{
            $and: [
            { month: searchMonth },
            { year: searchYear },
            entitySearch, 
            { "searched": {$ne :""}}
            ]
          }
        },
        {
          $group: {
            _id: { $toLower: "$searched"},
            count: { $sum: 1 },
            maxDatasets: { $max: "$returned.dataset" },
            maxProjects: { $max: "$returned.project"  },
            maxTools: {  $max: "$returned.tool" },
            maxPapers: {  $max: "$returned.paper" },
            maxPeople: {  $max: "$returned.people" },
            entity: { $max: req.entity}
          }
        },
        {$sort:{ count : -1}}
      ]).limit(10);
    
      q.exec((err, data) => {
        if (err) reject(err);
        return resolve(data);
      });
    });
}