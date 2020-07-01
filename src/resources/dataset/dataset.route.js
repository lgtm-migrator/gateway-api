import express from 'express'
import axios from 'axios';
const router = express.Router();

/**
 * {get} /dataset/:id get a dataset
 * 
 * Pull data set from remote system
 */
router.get('/:id', async (req, res) => {
    var metadataCatalogue = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
    var metadataQuality = process.env.metadataQualityURL || 'https://europe-west1-hdruk-gateway.cloudfunctions.net/metadataqualityscore';
    var metadataCatalogueError = '';

    const reqMetadataCatalogue = axios.get(metadataCatalogue + '/api/dataModels/' + req.params.id).catch(err => {metadataCatalogueError = err.message} );
    const reqMetadataQuality = axios.get(metadataQuality + '/api/v1/' + req.params.id).catch(err => null);


    try {
        const [resMetadataCatalogue, resMetadataQuality] = await axios.all([reqMetadataCatalogue,reqMetadataQuality]);

        if (resMetadataQuality) {
            resMetadataCatalogue.data.quality = resMetadataQuality.data;
        }

        return res.json({ 'success': true, 'data': resMetadataCatalogue.data });

    }
    catch (err) {
        // handle error
        return res.json({ success: false, error: metadataCatalogueError + ' (raw message from metadata catalogue)' });
    }

  });


  router.get('/', async (req, res) => {
    let metadataCatalogue = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
    let searchString = "";
    let count = 5;
  
    if (req.query.search) {
      searchString = req.query.search;
    }
  
      axios.get(metadataCatalogue + '/api/catalogueItems/search?searchTerm=' + searchString + '&domainType=DataModel&limit=1')
      .then(function (response){
        count = response.data.count;
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
  });

  module.exports = router;