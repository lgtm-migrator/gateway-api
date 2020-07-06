import express from 'express'
import axios from 'axios';
import { DataRequestModel } from '../datarequests/datarequests.model';

const router = express.Router();


//   search for additional detail on a dataset by using the MDC dataset id
  router.get('/:id', async (req, res) => {
    var metadataCatalogue = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
    var metadataQuality = process.env.metadataQualityURL || 'https://europe-west1-hdruk-gateway.cloudfunctions.net/metadataqualityscore';
    var metadataCatalogueError = '';

    const reqMetadataCatalogue = axios.get(metadataCatalogue + '/api/facets/' + req.params.id + '/profile/uk.ac.hdrukgateway/HdrUkProfilePluginService').catch(err => {metadataCatalogueError = err.message} );
    const reqMetadataQuality = axios.get(metadataQuality + '/api/v1/' + req.params.id, { timeout:5000 }).catch(err => { console.log('Unable to get metadata quality value'+err.message) });

    try {
        const [resMetadataCatalogue, resMetadataQuality] = await axios.all([reqMetadataCatalogue,reqMetadataQuality]);

        var result;

        if (resMetadataQuality) {
            resMetadataCatalogue.data.quality = resMetadataQuality.data;
        }
    
        if (req.query.id && req.query.id !== null && req.query.id !== 'null') {
          var p = DataRequestModel.find({ $and: [{ userId: req.query.id }, { dataSetId: req.params.id }]});
          p.exec((datarequestErr, datarequest) => {
            if (datarequestErr) return res.json({ success: false, error: datarequestErr });
            result = res.json({ 'success': true, 'data': resMetadataCatalogue.data, 'datarequest': datarequest });
          });
        }
        else {
          result = res.json({ 'success': true, 'data': resMetadataCatalogue.data, 'datarequest': [] });
        }

        return result;
    }
    catch (err) {
        // handle error
        return res.json({ success: false, error: metadataCatalogueError + ' (raw message from metadata catalogue)' });
    }
  
  });

module.exports = router;