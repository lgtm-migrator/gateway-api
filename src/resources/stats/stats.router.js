import express from 'express';
import { Data, RecordSearchData } from '../../../database/schema';

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
  
    //set the aggregate queries
    var aggregateQueryTypes = [{ $group: { _id: "$type", count: { $sum: 1 } } }];
  
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
  
  
    var q = RecordSearchData.aggregate(aggregateQuerySearches);
  
    q.exec((err, dataSearches) => {
      if (err) return res.json({ success: false, error: err });
  
      var x = Data.aggregate(aggregateQueryTypes);
      x.exec((errx, dataTypes) => {
        if (errx) return res.json({ success: false, error: errx });
  
        var counts = {}; //hold the type (i.e. tool, person, project) counts data
        for (var i = 0; i < dataTypes.length; i++) { //format the result in a clear and dynamic way
          counts[dataTypes[i]._id] = dataTypes[i].count;
        }
  
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
    var q = Data.find({ counter: { $gt : 0} }).sort({ updatedon: -1 }).limit(10);
  
    if (req.query.type) {
      q = Data.find({ $and:[ {type : req.query.type, updatedon: { $gt : 0} }]}).sort({ counter: -1 }).limit(10);
    }
  
    q.exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, data: data });
    });
  });
  
  module.exports = router