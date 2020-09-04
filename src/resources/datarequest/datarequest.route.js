import express from 'express';
import passport from 'passport';
import { DataRequestModel } from './datarequest.model';
import { Data as ToolModel } from '../tool/data.model';
import { DataRequestSchemaModel } from './datarequest.schemas.model';
import emailGenerator from '../utilities/emailGenerator.util';
import _ from 'lodash';

const sgMail = require('@sendgrid/mail');
const notificationBuilder = require('../utilities/notificationBuilder');

const router = express.Router();

// @route   GET api/v1/data-access-request
// @desc    GET Access requests for user
// @access  Private
router.get('/', passport.authenticate('jwt'), async (req, res) => {
    try {
    // 1. Deconstruct the 
    let { id: userId } = req.user;
    // 2. Find all data access request applications created with single dataset version
    let singleDatasetApplications = await DataRequestModel.find( { $and: [{ userId: parseInt(userId) }, { "dataSetId":{$ne:null} }] } ).populate('dataset');
    let formattedApplications = singleDatasetApplications.map(app => {
      return { ...app.toObject(), datasetIds: [app.dataset.datasetid], datasets: [app.dataset.toObject()]};
    });
    // 3. Find all data access request applications created with multi dataset version
    let multiDatasetApplications = await DataRequestModel.find( { $and: [{ userId: parseInt(userId) }, { "datasetIds":{$ne:[]} }] } ).populate('datasets');
    // 4. Return all users applications combined
    let applications = [...formattedApplications, ...multiDatasetApplications];
    return res.status(200).json({ success: true, data: applications });
    } catch {
      return res.status(500).json({ success: false, message: 'An error occurred searching for user applications' });
    }
});

// @route   GET api/v1/data-access-request/:requestId
// @desc    GET a single data access request by Id
// @access  Private
router.get('/:requestId', passport.authenticate('jwt'), async (req, res) => {
   try {
      // 1. Get dataSetId from params
      let {params: {requestId}} = req;
      // 2. Get the userId
      let {id: userId, _id} = req.user;
      // 3. Find the matching record and include attached datasets records with publisher details
      let accessRecord = await DataRequestModel.findOne({_id: requestId}).populate({ path: 'datasets dataset', populate: { path: 'publisher', populate: { path: 'team'}}});
      //TODO check user is owner of DAR or is a member of the publisher team (return 401 if not)
      // 4. If no matching application found, return 404
      if (!accessRecord) {
            return res
            .status(404)
            .json({status: 'error', message: 'Application not found.' });
      }
      // 5. Ensure single datasets are mapped correctly into array
      if (_.isEmpty(accessRecord.datasets)) {
        accessRecord.datasets = [...accessRecord.dataset];
      }
      // 6. Check if requesting user is custodian member or applicant/collaborator
      let found = false, userType = '', readOnly = true;
      if(_.has(accessRecord.datasets[0].toObject(), 'publisher.team.members')) {
        let { members } = accessRecord.datasets[0].publisher.team.toObject();
        found = members.some(el => el.memberid.toString() === _id.toString());
      }

      if(!found && accessRecord.userId !== userId) {
        return res.status(401).json({status: 'failure', message: 'Unauthorised'});
      }

      if(found) {
        userType = 'Custodian'
      } else {
        userType = 'Applicant'
      }

      if(userType === 'Applicant' && (accessRecord.applicationStatus === 'inProgress' || accessRecord.applicationStatus === 'submitted' )) {
        readOnly = false;
      }

      // 7. Return application form
      return res.status(200).json({
        status: 'success', 
        data: {
          ...accessRecord._doc, 
          jsonSchema: JSON.parse(accessRecord.jsonSchema), 
          questionAnswers: JSON.parse(accessRecord.questionAnswers), 
          aboutApplication: JSON.parse(accessRecord.aboutApplication), 
          datasets: accessRecord.datasets,
          readOnly,
          userType 
        }});
   }
   catch (err) {
      console.error(err.message);
      res.status(500).json({status: 'error', message: err});
   };
});

// @route   GET api/v1/data-access-request/dataset/:datasetId
// @desc    GET Access request for user
// @access  Private
router.get('/dataset/:dataSetId', passport.authenticate('jwt'), async (req, res) => {
  let accessRecord;
  let data = {};
  let dataset;
   try {
      // 1. Get dataSetId from params
      let {params: {dataSetId}} = req;
      // 2. Get the userId
      let {id: userId} = req.user;
      // 3. Find the matching record 
      accessRecord = await DataRequestModel.findOne({dataSetId, userId, applicationStatus: 'inProgress'});
      // 4. Get dataset
      dataset = await ToolModel.findOne({ datasetid: dataSetId }).populate('publisher');  
      // 5. If no record create it and pass back
      if (!accessRecord) {
          if(!dataset) {
            return res
            .status(500)
            .json({status: 'error', message: 'No dataset available.' });
         }
        let {datasetfields: {publisher = ''}} = dataset;

         // 1. GET the template from the custodian
         const accessRequestTemplate = await DataRequestSchemaModel.findOne({ $or: [{dataSetId}, {publisher}, {dataSetId: 'default'}] , status: 'active' }).sort({createdAt: -1});
         
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
            publisher,
            questionAnswers: "{}",
            aboutApplication: "{}",
            applicationStatus: "inProgress"
         });
         // 3. save record
         await record.save();
         // 4. return record
         data = {...record._doc};
       } else {
         data = {...accessRecord._doc};
       }

       return res.status(200).json({
         status: 'success', 
         data: {
           ...data, 
           jsonSchema: JSON.parse(data.jsonSchema), 
           questionAnswers: JSON.parse(data.questionAnswers), 
           aboutApplication: JSON.parse(data.aboutApplication),
           dataset
        }});
   }
   catch (err) {
      console.log(err.message);
      res.status(500).json({status: 'error', message: err});
   };
});

// @route   GET api/v1/data-access-request/datasets/:datasetIds
// @desc    GET Access request with multiple datasets for user
// @access  Private
router.get('/datasets/:datasetIds', passport.authenticate('jwt'), async (req, res) => {
  let accessRecord;
  let data = {};
  let datasets = [];
   try {
      // 1. Get datasetIds from params
      let {params: {datasetIds}} = req;
      let arrDatasetIds = datasetIds.split(',');
      // 2. Get the userId
      let {id: userId} = req.user;
      // 3. Find the matching record 
      accessRecord = await DataRequestModel.findOne({datasetIds: { $all: arrDatasetIds }, userId, applicationStatus: 'inProgress'}).sort({createdAt: 1});
      // 4. Get datasets
      datasets = await ToolModel.find({ datasetid: { $in: arrDatasetIds } }).populate('publisher');  
      // 5. If no record create it and pass back
      if (!accessRecord) {
          if(_.isEmpty(datasets)) {
            return res
            .status(500)
            .json({status: 'error', message: 'No datasets available.' });
         }
        let {datasetfields: {publisher = ''}} = datasets[0];

         // 1. GET the template from the custodian or take the default (Cannot have dataset specific question sets for multiple datasets)
         const accessRequestTemplate = await DataRequestSchemaModel.findOne({ $or: [{publisher}, {dataSetId: 'default'}] , status: 'active' }).sort({createdAt: -1});
         // 2. Ensure a question set was found
         if(!accessRequestTemplate) {
            return res
            .status(400)
            .json({status: 'error', message: 'No Data Access request schema.' });
         }
         // 3. Build up the accessModel for the user
         let {jsonSchema, version} = accessRequestTemplate;
         // 4. Create new DataRequestModel
         let record = new DataRequestModel({
            version,
            userId,
            datasetIds: arrDatasetIds,
            jsonSchema,
            publisher,
            questionAnswers: "{}",
            aboutApplication: "{}",
            applicationStatus: "inProgress"
         });
         // 3. save record
         await record.save();
         // 4. return record
         data = {...record._doc};
       } else {
         data = {...accessRecord._doc};
       }

       return res.status(200).json({
         status: 'success', 
         data: {
           ...data, 
           jsonSchema: JSON.parse(data.jsonSchema), 
           questionAnswers: JSON.parse(data.questionAnswers), 
           aboutApplication: JSON.parse(data.aboutApplication), 
           datasets
        }});
   }
   catch (err) {
      console.log(err.message);
      res.status(500).json({status: 'error', message: err});
   };
});

// @route   PATCH api/v1/data-access-request/:id
// @desc    Update application passing single object to update database entry with specified key
// @access  Private
router.patch('/:id', passport.authenticate('jwt'), async (req, res) => {
  try {
    // 1. Id is the _id object in mongoo.db not the generated id or dataset Id
    const {
      params: { id },
    } = req;
    // 2. Destructure body and update only specific fields by building a segregated non-user specified update object
    let updateObj;
    let { aboutApplication, questionAnswers } = req.body;
    if(aboutApplication) {
      let parsedObj = JSON.parse(aboutApplication);
      let updatedDatasetIds = parsedObj.selectedDatasets.map(dataset => dataset.datasetId);
      updateObj = { aboutApplication,  datasetIds: updatedDatasetIds };
    }
    if(questionAnswers) {
      updateObj = { ...updateObj, questionAnswers };
    }
    // 3. Find data request by _id and update via body
    let accessRequestRecord = await DataRequestModel.findByIdAndUpdate(id, updateObj, { new: true });
    // 4. Check access record
    if (!accessRequestRecord) {
      return res.status(400).json({ status: 'error', message: 'Data Access Request not found.' });
    }
    // 5. Return new data object
    return res.status(200).json({
      status: 'success',
      data: { ...accessRequestRecord._doc, questionAnswers: JSON.parse(accessRequestRecord.questionAnswers) },
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ status: 'error', message: err });
  }
});

// @route   PUT api/v1/data-access-request/:id
// @desc    Update request record by Id for status changes
// @access  Private
router.put('/:id', passport.authenticate('jwt'), async (req, res) => {
  try {
    // 1. Id is the _id object in MongoDb not the generated id or dataset Id
    const {
      params: { id },
    } = req;
    // 2. Get the userId
    let { _id, firstname, lastname } = req.user;
    // 3. Find the relevant data request application
    let accessRecord = await DataRequestModel
    .findOne({_id: id})
    .populate({ 
        path: 'datasets dataset mainApplicant', 
          populate: { 
            path: 'publisher', 
            populate: { 
              path: 'team', 
              populate: { 
                path: 'users' 
              }
            }
          }
        }
      );
    if (!accessRecord) {
      return res
      .status(404)
      .json({status: 'error', message: 'Application not found.' });
    }
    // 4. Ensure single datasets are mapped correctly into array (backward compatibility for single dataset applications)
    if (_.isEmpty(accessRecord.datasets)) {
      accessRecord.datasets = [...accessRecord.dataset];
    }

    // 5. Check if the user is permitted to perform update to application (should be custodian)
    let permitted = false, members = [];
    if(_.has(accessRecord.datasets[0].toObject(), 'publisher.team.members')) {
      ({ members } = accessRecord.datasets[0].publisher.team.toObject());
      permitted = members.some(el => el.memberid.toString() === _id.toString());
    }

    if(!permitted) {
      return res.status(401).json({status: 'failure', message: 'Unauthorised to perform this update'});
    }

    // 6. Extract new application status and desc to save updates
    const { applicationStatus, applicationStatusDesc } = req.body;
    if(applicationStatus) {
      accessRecord.applicationStatus = applicationStatus;
    }
    if(applicationStatusDesc) {
      accessRecord.applicationStatusDesc = applicationStatusDesc;
    }
    accessRecord.save();

    // 7. Create notifications
    // Custodian team notifications
    let datasetTitles = accessRecord.datasets.map(dataset => dataset.name).join(', ');
    if(!_.isEmpty(members)) {
      // Retrieve all custodian user Ids to generate notifications
      let custodianUsers = [...accessRecord.datasets[0].publisher.team.users];
      let custodianUserIds = custodianUsers.map(user => user.id);
      // Extract personal data from main applicant to personalise notification
      let { firstname: appFirstName, lastname: appLastName } = accessRecord.mainApplicant;
      await notificationBuilder.triggerNotificationMessage(custodianUserIds, `${appFirstName} ${appLastName}'s Data Access Request for ${datasetTitles} was ${applicationStatus} by ${firstname} ${lastname}`,'data access request', accessRecord._id);
    }

    // Applicant notification
    let { datasetfields : { publisher }} = accessRecord.datasets[0]
    await notificationBuilder.triggerNotificationMessage([accessRecord.userId], `Your Data Access Request for ${datasetTitles} was ${applicationStatus} by ${publisher}`,'data access request', accessRecord._id);

    // 8. Send emails to relevant users

    // 9. Return updated application
    return res.status(200).json({
      status: 'success',
      data: accessRecord,
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
  // declare recipientTypes, static until otherwise
  const emailRecipientTypes = ['requester', 'dataCustodian'];
  // 1. id is the _id object in mongoo.db not the generated id or dataset Id
  let { params: { id }} = req;
  try {
    // 2. Find application in MongoDb
    const application = await DataRequestModel.findOne({ _id: id });
    if (application) {
      // 3. Destructure the application
      let {questionAnswers, jsonSchema, dataSetId, datasetIds} = application;
      // 4. Parse the schema
      let {pages, questionPanels, questionSets: questions} = JSON.parse(jsonSchema);
      // 5. Parse the questionAnswers
      let answers = JSON.parse(questionAnswers);
      // 6. Destructure the submitting user's details
      let { firstname, lastname, email } = req.user
      // 7. Define query to fetch single or multiple datasets depending on context
      let query = {};
      if(dataSetId) {
        query = { datasetid: dataSetId };
      } else if(datasetIds) {
        query = { datasetid: { $in: datasetIds } };
      } else {
        return res.status(500).json({ success: false, message: 'No datasets were found attached to this submission' });
      }
      // 8. Find single or multiple datasets
      let datasets = await ToolModel.find(query); 
      // 9. Extract the properties we need to construct email
      let { datasetfields: { contactPoint, publisher } } = datasets[0];
      let datasetTitles = datasets.map(dataset => dataset.name).join(', ');
      // 10. Set options object to pass to email generator
      let options = { userType: '', userEmail: email, userName: `${firstname} ${lastname}`, custodianEmail: contactPoint, publisher, datasetTitles };
      // 11. Send email to each recipient type
      for (let emailRecipientType of emailRecipientTypes) {
        let msg = {};
        options = {...options, userType: emailRecipientType};
        // Build email template
        msg = await emailGenerator.generateEmail(questions, pages, questionPanels, answers, options);
        // If unsubscribe is allowed, pass single user object recipient to generate and append unsub link
        if(msg.allowUnsubscribe) {
          msg.to = [ req.user ];
        } else {
          // If unsubscribe not allowed, pass email in mock user object
          msg.to = [{ email: msg.to }];
        }
        // Send email
        await emailGenerator.sendEmail(
          msg.to, 
          msg.from, 
          msg.subject, 
          msg.html, 
          msg.allowUnsubscribe);
      }
      // 12. Update application to submitted status
      application.applicationStatus = 'submitted';
      await application.save();
      // 13. Create new notification for submitting user
      await notificationBuilder.triggerNotificationMessage([application.userId], `You have successfully submitted a Data Access Request for ${datasetTitles}`,'data access request', application._id);
      // 14. Return aplication and successful response
      return res.status(200).json({ status: 'success', data: application });
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ status: 'error', message: err });
  }
});

module.exports = router;