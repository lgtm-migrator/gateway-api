import express from 'express'
import axios from 'axios';

const router = express.Router();


//search for a dataset based on MDC "searchterm"

router.get('/', async (req, res) => {
    var metadataCatalogue = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
    var searchString = "";
    var count = 5;
  
    if (req.query.search) {
      searchString = req.query.search;
    }
  
      axios.get(metadataCatalogue + '/api/catalogueItems/search?searchTerm=' + searchString + '&domainType=DataModel&limit=1')
      .then(function (response){
        count = response.data.count
      })
      .then(function(){
        axios.get(metadataCatalogue + '/api/catalogueItems/search?searchTerm=' + searchString + '&domainType=DataModel&limit=' + count )
        .then(function (response) {
          // handle success
          return res.json({ 'success': true, 'data': response.data });
        })
        .catch(function (err) {
          // handle error
          return res.json({ success: false, error: err.message + ' (raw message from metadata catalogue)' });
        })
      })

      console.log('in base search')
  
  });
  
  module.exports = router;

  

  