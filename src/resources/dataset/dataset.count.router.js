import express from 'express'
import axios from 'axios';

const router = express.Router();


//search for a dataset based on MDC "searchterm"

router.get('/', async (req, res) => {
    var metadataCatalogue = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
      
      axios.get(metadataCatalogue + '/api/catalogueItems/search?searchTerm=&domainType=DataModel&limit=1')
      .then(function (response){
        return res.json({'success': true, 'data': response.data.count});
      })
      .catch(function (err) {
        // handle error
        return res.json({ success: false, error: err.message + ' (raw message from metadata catalogue)' });
      })   
  
  });
  
  module.exports = router;