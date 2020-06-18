import express from 'express';
import passport from 'passport';
import { DataRequestModel } from './datarequest.model';
import { DataRequestSchemaModel } from './datarequest.schemas.model';
const notificationBuilder = require('../utilities/notificationBuilder');

const router = express.Router();

// @route   GET api/v1/data-access-request/:datasetId
// @desc    GET Access request for user
// @access  Private
router.get('/:dataSetId', passport.authenticate('jwt'), async (req, res) => {
   try {
      let data = {};
      // 1. Get dataSetId from params
      let {params: {dataSetId}} = req;
      console.log(req.params);
      // 2. Get the userId
      let {id: userId} = req.user;
      console.log(req.user);
      // 3. Find the matching record 
      const accessRecord = await DataRequestModel.findOne({dataSetId, userId});
      console.log(accessRecord);
      // 4. if no record create it and pass back
      if (!accessRecord) {
         // 1. GET the template from the custodian
         const accessRequestTemplate = await DataRequestSchemaModel.findOne({ dataSetId , status: 'active' });
         if(!accessRequestTemplate) {
            return res
            .status(400)
            .json({status: 'error', message: 'No Data Access request schema.' });
         }
         // 2. Build up the accessModel for the user
         let {jsonSchema, version} = accessRequestTemplate;
         // 4. create new DataRequestModel
         let record = new DataRequestModel({
            version,
            userId,
            dataSetId,
            jsonSchema,
            questionAnswers: "{}",
            applicationStatus: "inProgress"
         });
         // 3. save record
         await record.save();
         // 4. return record
         data = {...record._doc};
       } else {
         data = {...accessRecord._doc};
       }
       console.log(data);
      return res.status(200).json({status: 'success', data: {...data, jsonSchema: JSON.parse(data.jsonSchema), questionAnswers: JSON.parse(data.questionAnswers)}});
   }
   catch (err) {
      console.log(err.message);
      res.status(500).json({status: 'error', message: err});
   };
});

// @route   PATCH api/v1/data-access-request/:id
// @desc    Update request record answers
// @access  Private
router.patch('/:id', passport.authenticate('jwt'), async (req, res) => {
  try {
    // 1. id is the _id object in mongoo.db not the generated id or dataset Id
    const {
      params: { id },
    } = req;
    // 2. find data request by _id and update via body
    let accessRequestRecord = await DataRequestModel.findByIdAndUpdate(id, req.body, { new: true });
    // 3. check access record
    if (!accessRequestRecord) {
      return res.status(400).json({ status: 'error', message: 'Data Access Request not found.' });
    }

    // 4. return new data object
    return res.status(200).json({
      status: 'success',
      data: { ...accessRequestRecord._doc, questionAnswers: JSON.parse(accessRequestRecord.questionAnswers) },
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ status: 'error', message: err });
  }
});

// @route   POST api/v1/data-access-request/:id
// @desc    Update request record
// @access  Private
router.post('/:id', passport.authenticate('jwt'), async (req, res) => {
  // 1. id is the _id object in mongoo.db not the generated id or dataset Id
  let {
    params: { id },
  } = req;
  try {
    let accessRequest = await DataRequestModel.findOne({ _id: id });

    if (accessRequest) {
      let application = await DataRequestModel.findOneAndUpdate({ _id: id }, { $set: { applicationStatus: 'submitted' } }, { new: true });
      await notificationBuilder.triggerNotificationMessage(
        application.userId,
        `You have successfully submitted a Data Access Request for ${application.dataSetId}`,
        'data access request',
        application.dataSetId
      );
      return res.status(200).json({ status: 'success', data: application });
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ status: 'error', message: err });
  }
});

module.exports = router;