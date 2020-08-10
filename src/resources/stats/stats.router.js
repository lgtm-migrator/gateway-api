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
router.get('', async (req, res) => { 

  switch (req.query.rank) {

    case undefined:

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
    
      return result;
    break;

  case 'recent':
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
  break;

  case 'popular':
    var q = Data.find({ counter: { $gt : 0} }).sort({ counter: -1 }).limit(10);

    if (req.query.type) {
      q = Data.find({ $and:[ {type : req.query.type, counter: { $gt : 0} }]}).sort({ counter: -1 }).limit(10);
    }
  
    q.exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, data: data });
    });
  break;
  

  case 'updates':
    var q = Data.find({activeflag: "active", counter: { $gt : 0} }).sort({ updatedon: -1 }).limit(10);

    if (req.query.type) {
      q = Data.find({ $and:[ {type : req.query.type, activeflag: "active", updatedon: { $gt : 0} }]}).sort({ counter: -1 }).limit(10);
    }
  
    q.exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, data: data });
    });
  break;

  case 'unmet':
    switch (req.query.type) {
      case 'Datasets':
        req.entity = "dataset";
        await getUnmetSearches(req)
          .then((data) =>{
            return res.json({ success: true, data: data });
          })
          .catch((err) => {
            return res.json({ success: false, error: err });
          });
      break;

      case 'Tools':
        req.entity = "tool";
        await getUnmetSearches(req)
          .then((data) =>{
            return res.json({ success: true, data: data });
          })
          .catch((err) => {
            return res.json({ success: false, error: err });
          });
      break;

      case 'Projects':
        req.entity = "project";
        await getUnmetSearches(req)
          .then((data) =>{
            return res.json({ success: true, data: data });
          })
          .catch((err) => {
            return res.json({ success: false, error: err });
          });
      break;

      case 'Papers':
        req.entity = "paper";
        await getUnmetSearches(req)
          .then((data) =>{
            return res.json({ success: true, data: data });
          })
          .catch((err) => {
            return res.json({ success: false, error: err });
          });
      break;

      case 'People':
        req.entity = "person";
        await getUnmetSearches(req)
          .then((data) =>{
            return res.json({ success: true, data: data });
          })
          .catch((err) => {
            return res.json({ success: false, error: err });
          });
      break;
    }

  }      
});




//   router.get('/type', async (req, res) => { 

//     switch (req.query.rank) {

//     case 'recent':
//         var q = RecordSearchData.aggregate([
//           { $match: { $or: [ { "returned.tool": { $gt : 0}}, { "returned.project": { $gt : 0}}, { "returned.person": { $gt : 0}} ] }},
//           {
//             $group: {
//               _id: {$toLower: "$searched"},
//               count: { $sum: 1 },
//               returned: { $first: "$returned" }
//             }
//           },
//           {$sort:{ datesearched : 1}}
//         ]).limit(10);
      
//         q.exec((err, data) => {
//           if (err) return res.json({ success: false, error: err });
//           return res.json({ success: true, data: data });
//         });
//       break;

//     case 'popular':
//         var q = Data.find({ counter: { $gt : 0} }).sort({ counter: -1 }).limit(10);

//         if (req.query.type) {
//           q = Data.find({ $and:[ {type : req.query.type, counter: { $gt : 0} }]}).sort({ counter: -1 }).limit(10);
//         }
      
//         q.exec((err, data) => {
//           if (err) return res.json({ success: false, error: err });
//           return res.json({ success: true, data: data });
//         });
//     break;
      

//     case 'updates':
//         var q = Data.find({activeflag: "active", counter: { $gt : 0} }).sort({ updatedon: -1 }).limit(10);

//         if (req.query.type) {
//           q = Data.find({ $and:[ {type : req.query.type, activeflag: "active", updatedon: { $gt : 0} }]}).sort({ counter: -1 }).limit(10);
//         }
      
//         q.exec((err, data) => {
//           if (err) return res.json({ success: false, error: err });
//           return res.json({ success: true, data: data });
//         });
//     break;
    
//   }        
// });




 
  // router.get('/kpis', async (req, res) => { 

  //   var selectedMonthStart = new Date(req.query.selectedDate);
  //   selectedMonthStart.setMonth(selectedMonthStart.getMonth());
  //   selectedMonthStart.setDate(1);
  //   selectedMonthStart.setHours(0,0,0,0);

  //   var selectedMonthEnd = new Date(req.query.selectedDate);
  //   selectedMonthEnd.setMonth(selectedMonthEnd.getMonth()+1);
  //   selectedMonthEnd.setDate(0);
  //   selectedMonthEnd.setHours(23,59,59,999);

  //   switch (req.query.kpi) {

  //     case 'technicalmetadata':
  //       var result = [];
  //       var totalDatasets = 0;
  //       var datasetsMetadata = 0;

  //       axios.get('https://raw.githubusercontent.com/HDRUK/datasets/master/datasets.csv')
  //       .then(function (csv) {
  //           var lines=csv.data.split("\r\n");
      
  //           var commaRegex = /,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/g
            
  //           var quotesRegex = /^"(.*)"$/g

  //           var headers = lines[0].split(commaRegex).map(h => h.replace(quotesRegex, "$1"));


  //           for(var i=1;i<lines.length-1;i++){
  //               var obj = {};
  //               var currentline=lines[i].split(commaRegex);

  //               for(var j=0;j<headers.length;j++){
  //                   obj[headers[j]] = currentline[j].replace(quotesRegex, "$1");
  //               }

  //               result.push(obj); 
  //           }

  //           result.map((res) => {
  //             if(res.dataClassesCount !== '0') {
  //                 datasetsMetadata++
  //             }
  //           })

  //           totalDatasets = result.length;

  //           return res.json({ 
  //             'success': true, 
  //             'data': {
  //               'totalDatasets': totalDatasets,
  //               'datasetsMetadata': datasetsMetadata 
  //           }
  //           });
  //         })
  //     break;

  //     case 'searchanddar':
  //       var result;

  //       var aggregateQuerySearches = [
  //         {
  //           $facet: {
  //             "totalMonth": [
  //               { "$match": { "datesearched": {"$gte": selectedMonthStart, "$lt": selectedMonthEnd} } },

  //               {
  //                 $group: {
  //                   _id: 'totalMonth',
  //                   count: { $sum: 1 }
  //                 },
  //               }
  //             ],
  //             "noResultsMonth": [
  //               { "$match": { $and: [{"datesearched": {"$gte": selectedMonthStart, "$lt": selectedMonthEnd} }, {"returned.dataset": 0}, {"returned.tool": 0}, {"returned.project": 0}, {"returned.paper": 0}, {"returned.person": 0} ] } },
  //               {
  //                 $group: {
  //                   _id: 'noResultsMonth',
  //                   count: { $sum: 1 }
  //                 }, 
  //               }
  //             ],
  //             "accessRequestsMonth": [
  //               //used only createdAt first { "$match": { "createdAt": {"$gte": selectedMonthStart, "$lt": selectedMonthEnd} } },
  //               // some older fields only have timeStamp --> only timeStamp in the production db
  //               //checking for both currently
  //               { "$match": {$and: [
  //                   { $or: [ 
  //                     { "createdAt": {"$gte": selectedMonthStart, "$lt": selectedMonthEnd} },
  //                     { "timeStamp": {"$gte": selectedMonthStart, "$lt": selectedMonthEnd} } 
  //                   ]
  //                 },
  //                 { "applicationStatus": "submitted" } 
  //               ]} },
  //               {
  //                 $group: {
  //                   _id: 'accessRequestsMonth',
  //                   count: { $sum: 1 }
  //                 }, 
  //               }
  //             ],
  //           }
  //         }];

  //         var q = RecordSearchData.aggregate(aggregateQuerySearches);

  //         var y = DataRequestModel.aggregate(aggregateQuerySearches);

  //         q.exec((err, dataSearches) => {
  //           if (err) return res.json({ success: false, error: err });

  //           if (typeof dataSearches[0].totalMonth[0] === "undefined") {
  //             dataSearches[0].totalMonth[0] = { count: 0 };
  //           }
  //           if (typeof dataSearches[0].noResultsMonth[0] === "undefined") {
  //             dataSearches[0].noResultsMonth[0] = { count: 0 };
  //           }

  //         y.exec((err, accessRequests) => {
  //           if (err) return res.json({ success: false, error: err });

  //           if (typeof accessRequests[0].accessRequestsMonth[0] === "undefined") {
  //             accessRequests[0].accessRequestsMonth[0] = { count: 0 };
  //           }

  //             result = res.json(
  //               {
  //                 'success': true, 'data':
  //                 {
  //                     'totalMonth': dataSearches[0].totalMonth[0].count,
  //                     'noResultsMonth': dataSearches[0].noResultsMonth[0].count,
  //                     'accessRequestsMonth': accessRequests[0].accessRequestsMonth[0].count      
  //                   }
  //                 }
  //             )
  //         });
  //       });
  
  //       return result;
  //     break;

  //     case 'uptime':
  //       const monitoring = require('@google-cloud/monitoring');
  //       const projectId = 'hdruk-gateway';
  //       const client = new monitoring.MetricServiceClient();

  //       var result;
      
  //       const request = {
  //         name: client.projectPath(projectId),
  //         filter: 'metric.type="monitoring.googleapis.com/uptime_check/check_passed" AND resource.type="uptime_url" AND metric.label."check_id"="check-production-web-app-qsxe8fXRrBo" AND metric.label."checker_location"="eur-belgium"',
          
  //         interval: {
  //           startTime: {
  //             seconds: selectedMonthStart.getTime() / 1000,
  //           },
  //           endTime: {
  //             seconds: selectedMonthEnd.getTime() / 1000,
  //           },
  //         },
  //         aggregation: {
  //           alignmentPeriod: {
  //             seconds: '86400s',
  //           },
  //           crossSeriesReducer: 'REDUCE_NONE',
  //           groupByFields: [
  //             'metric.label."checker_location"',
  //             'resource.label."instance_id"'
  //           ],
  //           perSeriesAligner: 'ALIGN_FRACTION_TRUE',
  //         },

  //       };

  //       // Writes time series data
  //       const [timeSeries] = await client.listTimeSeries(request);
  //       var dailyUptime = [];
  //       var averageUptime;

  //       timeSeries.forEach(data => {
        
  //           data.points.forEach(data => {
  //             dailyUptime.push(data.value.doubleValue)
  //           })

  //           averageUptime = (dailyUptime.reduce((a, b) => a + b, 0) / dailyUptime.length) * 100;

  //           result = res.json(
  //             {
  //               'success': true, 'data': averageUptime
  //               }
  //           )
  //       });
      
  //       return result;
  //     break;
  //   }
  // });





  // router.get('/type', async (req, res) => { 

  //     switch (req.query.rank) {

  //     case 'recent':
  //         var q = RecordSearchData.aggregate([
  //           { $match: { $or: [ { "returned.tool": { $gt : 0}}, { "returned.project": { $gt : 0}}, { "returned.person": { $gt : 0}} ] }},
  //           {
  //             $group: {
  //               _id: {$toLower: "$searched"},
  //               count: { $sum: 1 },
  //               returned: { $first: "$returned" }
  //             }
  //           },
  //           {$sort:{ datesearched : 1}}
  //         ]).limit(10);
        
  //         q.exec((err, data) => {
  //           if (err) return res.json({ success: false, error: err });
  //           return res.json({ success: true, data: data });
  //         });
  //       break;

  //     case 'popular':
  //         var q = Data.find({ counter: { $gt : 0} }).sort({ counter: -1 }).limit(10);
  
  //         if (req.query.type) {
  //           q = Data.find({ $and:[ {type : req.query.type, counter: { $gt : 0} }]}).sort({ counter: -1 }).limit(10);
  //         }
        
  //         q.exec((err, data) => {
  //           if (err) return res.json({ success: false, error: err });
  //           return res.json({ success: true, data: data });
  //         });
  //     break;
        

  //     case 'updates':
  //         var q = Data.find({activeflag: "active", counter: { $gt : 0} }).sort({ updatedon: -1 }).limit(10);
  
  //         if (req.query.type) {
  //           q = Data.find({ $and:[ {type : req.query.type, activeflag: "active", updatedon: { $gt : 0} }]}).sort({ counter: -1 }).limit(10);
  //         }
        
  //         q.exec((err, data) => {
  //           if (err) return res.json({ success: false, error: err });
  //           return res.json({ success: true, data: data });
  //         });
  //     break;
      
  //   }
          
  // });
  




  /**
   * {get} /stats/unmet Unmet Searches
   * 
   * Return the details on the unmet searches.
   */
  // router.get('/unmetDatasets', async (req, res) => {
  //   req.entity = "dataset";
  //   await getUnmetSearches(req)
  //     .then((data) =>{
  //       return res.json({ success: true, data: data });
  //     })
  //     .catch((err) => {
  //       return res.json({ success: false, error: err });
  //     });
  // });

  // router.get('/unmetTools', async (req, res) => {
  //   req.entity = "tool";
  //   await getUnmetSearches(req)
  //     .then((data) =>{
  //       return res.json({ success: true, data: data });
  //     })
  //     .catch((err) => {
  //       return res.json({ success: false, error: err });
  //     });
  // });

  // router.get('/unmetProjects', async (req, res) => {
  //   req.entity = "project";
  //   await getUnmetSearches(req)
  //     .then((data) =>{
  //       return res.json({ success: true, data: data });
  //     })
  //     .catch((err) => {
  //       return res.json({ success: false, error: err });
  //     });
  // });
  
  // router.get('/unmetPapers', async (req, res) => {
  //   req.entity = "paper";
  //   await getUnmetSearches(req)
  //     .then((data) =>{
  //       return res.json({ success: true, data: data });
  //     })
  //     .catch((err) => {
  //       return res.json({ success: false, error: err });
  //     });
  // });

  // router.get('/unmetPeople', async (req, res) => {
  //   req.entity = "person";
  //   await getUnmetSearches(req)
  //     .then((data) =>{
  //       return res.json({ success: true, data: data });
  //     })
  //     .catch((err) => {
  //       return res.json({ success: false, error: err });
  //     });
  // });
  
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