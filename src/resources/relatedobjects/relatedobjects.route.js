import express from 'express'
import { Data } from '../tool/data.model'
import axios from 'axios';

const router = express.Router();

/**
 * {get} /relatedobjects/:id
 * 
 * Return the details on the relatedobject based on the ID.
 */
router.get('/:id', async (req, res) => {
    var id = req.params.id;
    if (!isNaN(id)) {
        var q = Data.aggregate([
            { $match: { $and: [{ id: parseInt(id) }] } },
            { $lookup: { from: "tools", localField: "authors", foreignField: "id", as: "persons" } }
        ]);
        q.exec((err, data) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({ success: true, data: data });
        });
    }
    else {
        var metadataCatalogue = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
        var metadataQuality = process.env.metadataQualityURL || 'https://europe-west1-hdruk-gateway.cloudfunctions.net/metadataqualityscore';
        var metadataCatalogueError = '';

        const reqMetadataCatalogue = axios.get(metadataCatalogue + '/api/facets/' + req.params.id + '/profile/uk.ac.hdrukgateway/HdrUkProfilePluginService').catch(err => {metadataCatalogueError = err.message} );
    
        const reqMetadataCatalogue2 = axios.get(metadataCatalogue + '/api/dataModels/' + req.params.id).catch(err => {metadataCatalogueError = err.message} );
        console.log(reqMetadataCatalogue2)
        const reqMetadataQuality = axios.get(metadataQuality + '/api/v1/' + req.params.id).catch(err => null);

        try {
            const [resMetadataCatalogue, resMetadataQuality] = await axios.all([reqMetadataCatalogue,reqMetadataQuality]);

            if (resMetadataQuality) {
                resMetadataCatalogue.data.quality = resMetadataQuality.data;
            }

            return res.json({ 'success': true, data: [resMetadataCatalogue.data] });

        }
        catch (err) {
            // handle error
            return res.json({ success: false, error: metadataCatalogueError + ' (raw message from metadata catalogue)' });
        }
    }
});

module.exports = router;