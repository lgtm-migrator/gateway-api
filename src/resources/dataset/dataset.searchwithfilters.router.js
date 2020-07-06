import express from 'express'
import axios from 'axios';

const router = express.Router();

 
//search for a dataset based on MDC "searchterm" and filters applied

router.get('/', async (req, res) => {
    var metadataCatalogue = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
    var searchString = "";
    var publisher = [];
    var license = [];
    var geographicCoverage = [];
    var ageBand = [];
    var physicalSampleAvailability = [];
    var keywords = [];
    var count = 5;

    if (req.query.search) {
      searchString = req.query.search;
    }

    if(req.query.publisher){
        if (typeof(req.query.publisher) == 'string'){
            publisher = '&publisher=' + req.query.publisher;
        }
        else if(typeof(req.query.publisher) == 'object'){
            req.query.publisher.map((pub) => {
                publisher = publisher + '&publisher=' + pub;
            })
        }
    }


    if(req.query.license){
        if (typeof(req.query.license) == 'string'){
            license = '&license=' + req.query.license;
        }
        else if(typeof(req.query.license) == 'object'){
            req.query.license.map((lic) => {
                license = license + '&license=' + lic;
            })
        }
    }

    if(req.query.geographicCoverage){
        if (typeof(req.query.geographicCoverage) == 'string'){
            geographicCoverage = '&geographicCoverage=' + req.query.geographicCoverage;
        }
        else if(typeof(req.query.geographicCoverage) == 'object'){
            req.query.geographicCoverage.map((geo) => {
                geographicCoverage = geographicCoverage + '&geographicCoverage=' + geo;
            })
        }
    }

    if(req.query.ageBand){
        if (typeof(req.query.ageBand) == 'string'){
            ageBand = '&ageBand=' + req.query.ageBand.replace("+", "%2B");
        }
        else if(typeof(req.query.ageBand) == 'object'){
            req.query.ageBand.map((age) => {
                ageBand = ageBand + '&ageBand=' + age.replace("+", "%2B");
            })
        }
    }

    if(req.query.physicalSampleAvailability){
        if (typeof(req.query.physicalSampleAvailability) == 'string'){
            physicalSampleAvailability = '&physicalSampleAvailability=' + req.query.physicalSampleAvailability;
        }
        else if(typeof(req.query.physicalSampleAvailability) == 'object'){
            req.query.physicalSampleAvailability.map((samp) => {
                physicalSampleAvailability = physicalSampleAvailability + '&physicalSampleAvailability=' + samp;
            })
        }
    }

    if(req.query.keywords){
        if (typeof(req.query.keywords) == 'string'){
            keywords = '&keywords=' + req.query.keywords;
        }
        else if(typeof(req.query.keywords) == 'object'){
            req.query.keywords.map((key) => {
                keywords = keywords + '&license=' + key;
            })
        }
    }
      axios.post(metadataCatalogue + '/api/profiles/uk.ac.hdrukgateway/HdrUkProfilePluginService/customSearch?searchTerm=' + searchString + '&domainType=DataModel&limit=1' + publisher + license + geographicCoverage + ageBand + physicalSampleAvailability + keywords)
      
      .then(function (response){
        count = response.data.count;
      })
      .then(function(){
        axios.post(metadataCatalogue + '/api/profiles/uk.ac.hdrukgateway/HdrUkProfilePluginService/customSearch?searchTerm=' + searchString + '&domainType=DataModel&limit=' + count + publisher + license + geographicCoverage + ageBand + physicalSampleAvailability + keywords)
        
        .then(function (response) {
          // handle success
          return res.json({ 'success': true, 'data': response.data });
        })
        .catch(function (err) {
          // handle error
          return res.json({ success: false, error: err.message + ' (raw message from metadata catalogue)' });
        })
      })
  
  });
  
  module.exports = router;