import express from 'express'
import axios from 'axios';
import { UserModel } from '../user/user.model';

const router = express.Router()

/**
 * {get} /dataset/:id get a dataset
 * 
 * Pull data set from remote system
 */
router.get('/:id', async (req, res) => {
    var metadataCatalogue = process.env.metadataURL || 'https://metadata-catalogue.org/hdruk';
  
    axios.get(metadataCatalogue + '/api/dataModels/' + req.params.id)
      .then(function (response) {
        // handle success
        return res.json({ 'success': true, 'data': response.data });
      })
      .catch(function (err) {
        // handle error
        return res.json({ success: false, error: err.message + ' (raw message from metadata catalogue)' });
      })
  
  });


  router.post('/sendgrid', async (req, res) => {
    // desctructure req obj
    const {
      userId,
      researchAim,
      linkedDataSets,
      namesOfDataSets,
      dataRequirements,
      dataSetParts,
      startDate,
      icoRegistration,
      researchBenefits,
      ethicalProcessingEvidence,
      contactNumber,
    } = req;

    try {
      const user = UserModel.findById({id: userId});
      console.log(user);
    }
    catch(err){
      console.error(err);
      res.status(500).json({ error: err });
    }
  });

  module.exports = router