import express from 'express'
import axios from 'axios';
const router = express.Router();


//   get schema detail on a dataset by using the MDC dataset id
  router.get('/:id', async (req, res) => {
    var metadataCatalogue = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';


    axios.get(metadataCatalogue + '/api/profiles/uk.ac.hdrukgateway/HdrUkProfilePluginService/schema.org/'+ req.params.id,{ timeout:5000 })
    .then (data => {
        return res.json({ 'success': true, 'data': data.data });
    })
    .catch(err => {
        const metadataCatalogueError = err.message;
        return res.json({ success: false, error: metadataCatalogueError + ' (raw message from metadata catalogue)' });
    });

  });

module.exports = router;