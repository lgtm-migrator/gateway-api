import express from 'express'
import axios from 'axios';

const router = express.Router();


//   search for additional detail on a dataset by using the MDC dataset id
  router.get('/:id', async (req, res) => {
    var metadataCatalogue = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
  
    axios.get(metadataCatalogue + '/api/facets/' + req.params.id + '/profile/uk.ac.hdrukgateway/HdrUkProfilePluginService')
      .then(function (response) {
        // handle success
        return res.json({ 'success': true, 'data': response.data });
      })
      .catch(function (err) {
        // handle error
        return res.json({ success: false, error: err.message + ' (raw message from metadata catalogue)' });
      })
  
  });

module.exports = router;
