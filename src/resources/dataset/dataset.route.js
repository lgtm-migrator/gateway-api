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
        console.log(err.message);
        return res.json({ success: false, error: metadataCatalogueError + ' (raw message from metadata catalogue)' });
    }

  });

  module.exports = router;