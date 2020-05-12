import express from 'express'
import axios from 'axios';
import { DataRequestModel } from '../datarequests/datarequests.model';

const router = express.Router();


//   search for additional detail on a dataset by using the MDC dataset id
  router.get('/:id', async (req, res) => {
    var metadataCatalogue = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
  
    axios.get(metadataCatalogue + '/api/facets/' + req.params.id + '/profile/uk.ac.hdrukgateway/HdrUkProfilePluginService')
      .then(function (response) {
        
        var result;
        if (req.query.id && req.query.id !== null && req.query.id !== 'null') {
          console.log(req.query.id)
          var p = DataRequestModel.find({ $and: [{ userId: req.query.id }, { dataSetId: req.params.id }]});
          p.exec((datarequestErr, datarequest) => {
            if (datarequestErr) return res.json({ success: false, error: datarequestErr });
            console.log(datarequest)
            result = res.json({ 'success': true, 'data': response.data, 'datarequest': datarequest });
          });
        }
        else {
          result = res.json({ 'success': true, 'data': response.data, 'datarequest': [] });
        }
      console.log(response.data)
        // handle success
        return result;
      })
      .catch(function (err) {
        // handle error
        return res.json({ success: false, error: err.message + ' (raw message from metadata catalogue)' });
      })
  
  });

module.exports = router;
