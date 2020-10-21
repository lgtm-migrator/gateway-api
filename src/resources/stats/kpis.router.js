import express from 'express';
import { RecordSearchData } from '../search/record.search.model';
import { Data } from '../tool/data.model';
import {DataRequestModel} from '../datarequests/datarequests.model';

const router = express.Router()

router.get('', async (req, res) => { 

    var selectedMonthStart = new Date(req.query.selectedDate);
    selectedMonthStart.setMonth(selectedMonthStart.getMonth());
    selectedMonthStart.setDate(1);
    selectedMonthStart.setHours(0,0,0,0);

    var selectedMonthEnd = new Date(req.query.selectedDate);
    selectedMonthEnd.setMonth(selectedMonthEnd.getMonth()+1);
    selectedMonthEnd.setDate(0); 
    selectedMonthEnd.setHours(23,59,59,999);

    console.log(`selectedMonthStart - ${selectedMonthStart}`)
    console.log(`selectedMonthEnd - ${selectedMonthEnd}`)

    switch (req.query.kpi) {
      case 'technicalmetadata':
        var totalDatasetsQuery = [
          {
            $facet: {
              TotalDataSets: [
                {
                  $match: {
                    $and: [
                      { activeflag: "active" },
                      { type: "dataset" },
                      { "datasetfields.publisher": { $ne: "HDR UK" } },
                    ],
                  },
                },
                { $count: "TotalDataSets" },
              ],
              TotalMetaData: [
                {
                  $match: {
                    activeflag: "active",
                    type: "dataset",
                    "datasetfields.technicaldetails": {
                      $exists: true,
                      $not: {
                        $size: 0,
                      },
                    },
                  },
                },
                {
                  $count: "TotalMetaData",
                },
              ],
            },
          },
        ];

        var q = Data.aggregate(totalDatasetsQuery);

        var result;
        q.exec((err, dataSets) => {
          if (err) return res.json({ success: false, error: err });

          if (typeof dataSets[0].TotalDataSets[0] === "undefined") {
            dataSets[0].TotalDataSets[0].TotalDataSets = 0;
          }
          if (typeof dataSets[0].TotalMetaData[0] === "undefined") {
            dataSets[0].TotalMetaData[0].TotalMetaData = 0;
          }

          result = res.json({
            success: true,
            data: {
              totalDatasets: dataSets[0].TotalDataSets[0].TotalDataSets,
              datasetsMetadata: dataSets[0].TotalMetaData[0].TotalMetaData,
            },
          });
        });

        return result;
      break;

      case 'searchanddar':
        var result;

        var aggregateQuerySearches = [
          {
            $facet: {
              "totalMonth": [
                { "$match": { "datesearched": {"$gte": selectedMonthStart, "$lt": selectedMonthEnd} } },

                {
                  $group: {
                    _id: 'totalMonth',
                    count: { $sum: 1 }
                  },
                }
              ],
              "noResultsMonth": [
                { "$match": { $and: [{"datesearched": {"$gte": selectedMonthStart, "$lt": selectedMonthEnd} }, {"returned.dataset": 0}, {"returned.tool": 0}, {"returned.project": 0}, {"returned.paper": 0}, {"returned.person": 0} ] } },
                {
                  $group: {
                    _id: 'noResultsMonth',
                    count: { $sum: 1 }
                  }, 
                }
              ],
              "accessRequestsMonth": [
                //used only createdAt first { "$match": { "createdAt": {"$gte": selectedMonthStart, "$lt": selectedMonthEnd} } },
                // some older fields only have timeStamp --> only timeStamp in the production db
                //checking for both currently
                { $match: {
                    $and: [
                      { 
                        $or: [  
                          { "createdAt": {"$gte": selectedMonthStart, "$lt": selectedMonthEnd} },
                          { "timeStamp": {"$gte": selectedMonthStart, "$lt": selectedMonthEnd} } 
                        ] 
                      },
                      {
                        $or: [
                          {"applicationStatus":"submitted"}, 
                          {"applicationStatus":"approved"}, 
                          {"applicationStatus":"rejected"}
                        ]
                      }
                    ] 
                  }
                },
                {
                  $lookup: {
                    from: "tools",
                    localField: "dataSetId",
                    foreignField: "datasetid",
                    as: "publisher",
                  },
                },
                { $match: { "publisher.datasetfields.publisher": { $ne: "HDR UK" } } },
                { $group: { _id: 'accessRequestsMonth', count: { $sum: 1 } }, }
              ],
            }
          }];

          var q = RecordSearchData.aggregate(aggregateQuerySearches);

          var y = DataRequestModel.aggregate(aggregateQuerySearches);

          q.exec((err, dataSearches) => {
            if (err) return res.json({ success: false, error: err });

            if (typeof dataSearches[0].totalMonth[0] === "undefined") {
              dataSearches[0].totalMonth[0] = { count: 0 };
            }
            if (typeof dataSearches[0].noResultsMonth[0] === "undefined") {
              dataSearches[0].noResultsMonth[0] = { count: 0 };
            }

          y.exec((err, accessRequests) => {
            if (err) return res.json({ success: false, error: err });

            if (typeof accessRequests[0].accessRequestsMonth[0] === "undefined") {
              accessRequests[0].accessRequestsMonth[0] = { count: 0 };
            }

              result = res.json(
                {
                  'success': true, 'data':
                  {
                      'totalMonth': dataSearches[0].totalMonth[0].count,
                      'noResultsMonth': dataSearches[0].noResultsMonth[0].count,
                      'accessRequestsMonth': accessRequests[0].accessRequestsMonth[0].count      
                    }
                  }
              )
          });
        });
  
        return result;
      break;

      case 'uptime':
        const monitoring = require('@google-cloud/monitoring');
        const projectId = 'hdruk-gateway';
        const client = new monitoring.MetricServiceClient();

        var result;
      
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

            result = res.json(
              {
                'success': true, 'data': averageUptime
                }
            )
        });
      
        return result;
      break; 

      case 'topdatasets':

        let datasetIds = DataRequestModel.find(
          {
            // VALUES YOU ARE CHECKING MATCH SPECIFIED CRITERIA IE. WHERE
            $and: [
              {
                $or: [
                  {
                    createdAt: {
                      $gte: selectedMonthStart,
                      $lt: selectedMonthEnd
                    }
                  },
                  {
                    timeStamp: {
                      $gte: selectedMonthStart,
                      $lt: selectedMonthEnd
                    }
                  }
                ]
              },
              {
                $or: [
                  { applicationStatus: "submitted" },
                  { applicationStatus: "approved" },
                  { applicationStatus: "rejected" }
                ]
              }
            ]
          },
          {
            // THE FIELDS YOU WANT TO RETURN
            _id: 0,
            dataSetId: 1, 
            datasetIds: 1
          }
        );




        let tempData = [
          {
            "datasetIds": [
              "7f125091-12ba-464d-af7d-9a88179b0b95",
              "0cfe60cd-038d-4c03-9a95-894c52135922",
              // "9e798632-442a-427b-8d0e-456f754d28dc"
            ]
          },
          {
            "datasetIds": [
              
            ],
            "dataSetId": "0cfe60cd-038d-4c03-9a95-894c52135922"
          },
          {
            "datasetIds": [
              "9e798632-442a-427b-8d0e-456f754d28dc"
            ]
          },
          {
            "datasetIds": [
              "9e798632-442a-427b-8d0e-456f754d28dc"
            ]
          }
        ];

        // console.log(`tempData - ${JSON.stringify(tempData, null, 2)}`)

        // TRY MAP OBJECTS 
        
        let thisMap = new Map()
        console.log(`start thisMap: ${JSON.stringify(thisMap,null,2)}`)
        console.log(`start thisMap size - ${thisMap.size}`) 

        // tempData.forEach(console.log('item'))
        for (const x in tempData) {
          console.log(`DAR - ${JSON.stringify(tempData[x])}`);

          let datasetIdObject = tempData[x];

          if(datasetIdObject.datasetIds && datasetIdObject.datasetIds.length > 0){
            //ARRAY WITH 1+ VALUE(S)

            datasetIdObject.datasetIds.map((datasetId) => {
              // console.log(`datasetId: ${datasetId}`)
              console.log(`type of datasetId: ${typeof datasetId}`)
              if(thisMap.has(datasetId)){
               console.log('array string is there')
              } else {
                thisMap.set(datasetId, 1)
              }
            })

          } 
          //UPDATE TO LODASH IS NOT EMPTY CHECK?
          else if(datasetIdObject.dataSetId && datasetIdObject.dataSetId.length > 0){
              //STRING
              // console.log(`type of datasetIdObject: ${typeof datasetIdObject}`)

              datasetIdObject = datasetIdObject.toString();
              console.log(`type of datasetIdObject: ${typeof datasetIdObject}`)


              if (thisMap.has(datasetIdObject)){
               console.log('string is there')
              } else {
                // thisMap = {...thisMap, {datasetIdObject, 1}}
                thisMap.set(datasetIdObject, 1)
                // console.log(`thisMap: ${JSON.stringify(thisMap, null, 2)}`)

              }
          }
          else { console.log('no') }
        }

        console.log(`thisMap: ${JSON.stringify(thisMap, null, 2)}`)
        console.log(`thisMap size - ${thisMap.size}`) 


        // var q = DataRequestModel.find({ counter: { $gt : 0} }).sort({ counter: -1 }).limit(10);

        // let singleDatasetApplications = await DataRequestModel.find({
        //   $and: [
        //     {
        //       $or: [{ userId: parseInt(userId) }, { authorIds: userId }],
        //     },
        //     { dataSetId: { $ne: null } },
        //   ],
        // }).populate('dataset mainApplicant');

        
        datasetIds.exec((err, data) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({ success: true, data: data, thisMap: thisMap });
          });

      break;
    }
  });

module.exports = router
