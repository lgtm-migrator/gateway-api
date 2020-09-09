import emailGenerator from '../utilities/emailGenerator.util';
import { DataRequestModel } from './datarequest.model';
import { Data as ToolModel } from '../tool/data.model';
import { DataRequestSchemaModel } from './datarequest.schemas.model';
import _ from 'lodash';

const notificationBuilder = require('../utilities/notificationBuilder');

module.exports = {
    //GET api/v1/data-access-request
    getAccessRequestsByUser: async (req, res) => {
        try {
        // 1. Deconstruct the 
        let { id: userId } = req.user; 
        // 2. Find all data access request applications created with single dataset version
        let singleDatasetApplications = await DataRequestModel.find( { $and: [{ userId: parseInt(userId) }, { "dataSetId":{$ne:null} }] } ).populate('dataset');
        let formattedApplications = singleDatasetApplications.map(app => {
          return { ...app.toObject(), datasetIds: [app.dataset.datasetid], datasets: [app.dataset.toObject()]};
        });
        // 3. Find all data access request applications created with multi dataset version
        //let multiDatasetApplications = await DataRequestModel.find( { $and: [{ userId: parseInt(userId) }, { "datasetIds":{$ne:[]} }] } ).populate('datasets');
        let multiDatasetApplications = await DataRequestModel.find( { $and: [{ userId: parseInt(userId) }, { $and: [{datasetIds:{$ne:[]}}, {datasetIds:{$ne:null}}]}] } ).populate('datasets');
        multiDatasetApplications = multiDatasetApplications.map(app => {
            return { ...app.toObject()};
        });
        // 4. Return all users applications combined
        let applications = [...formattedApplications, ...multiDatasetApplications].sort((a, b) => b.updatedAt - a.updatedAt);
        return res.status(200).json({ success: true, data: applications });
        } catch {
          return res.status(500).json({ success: false, message: 'An error occurred searching for user applications' });
        }
    },

    //GET api/v1/data-access-request/:requestId
    getAccessRequestById: async (req, res) => {
        try {
           // 1. Get dataSetId from params
           let {params: {requestId}} = req;
           // 2. Get the userId
           let {id: userId, _id} = req.user;
           // 3. Find the matching record and include attached datasets records with publisher details
           let accessRecord = await DataRequestModel.findOne({_id: requestId}).populate({ path: 'datasets dataset', populate: { path: 'publisher', populate: { path: 'team'}}});
           // 4. If no matching application found, return 404
           if (!accessRecord) {
                 return res
                 .status(404)
                 .json({status: 'error', message: 'Application not found.' });
           }
           // 5. Ensure single datasets are mapped correctly into array
           if (_.isEmpty(accessRecord.datasets)) {
             accessRecord.datasets = [accessRecord.dataset];
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
    },

    //GET api/v1/data-access-request/dataset/:datasetId
    getAccessRequestByUserAndDataset: async (req, res) => {
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
    },

    //GET api/v1/data-access-request/datasets/:datasetIds
    getAccessRequestByUserAndMultipleDatasets: async (req, res) => {
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
    },
    
    //PATCH api/v1/data-access-request/:id 
    updateAccessRequestDataElement: async (req, res) => {
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
    },

    //PUT api/v1/data-access-request/:id
    updateAccessRequestById: async (req, res) => {
        try {
          // 1. Id is the _id object in MongoDb not the generated id or dataset Id
          const {
            params: { id },
          } = req;
          // 2. Get the userId
          let { _id } = req.user;
          // 3. Find the relevant data request application
          let accessRecord = await DataRequestModel
          .findOne({_id: id})
          .populate({ 
              path: 'datasets dataset mainApplicant', 
                populate: { 
                  path: 'publisher additionalInfo', 
                  populate: { 
                    path: 'team', 
                    populate: { 
                      path: 'users', 
                      populate: {
                        path: 'additionalInfo'
                      }
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
            accessRecord.datasets = [accessRecord.dataset];
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
          let isDirty = false;
          if(applicationStatus && applicationStatus !== accessRecord.applicationStatus) {
            accessRecord.applicationStatus = applicationStatus;
            isDirty = true;
          }
          if(applicationStatusDesc && applicationStatusDesc !== accessRecord.applicationStatusDesc) {
            accessRecord.applicationStatusDesc = applicationStatusDesc;
            isDirty = true;
          }
      
          // 7. If a change has been made, notify custodian and main applicant
          if(isDirty) {
            accessRecord.save();
            await module.exports.createNotifications('StatusChange', { applicationStatus, applicationStatusDesc }, accessRecord, req.user);
          }
      
          // 8. Return application
          return res.status(200).json({
            status: 'success',
            data: accessRecord._doc,
          });
        } catch (err) {
          console.error(err.message);
          res.status(500).json({ status: 'error', message: 'An error occurred updating the application status' });
        }
    },

    //POST api/v1/data-access-request/:id
    submitAccessRequestById: async (req, res) => {
        try {
            // 1. id is the _id object in mongoo.db not the generated id or dataset Id
            let { params: { id }} = req;
            // 2. Find the relevant data request application
            let accessRecord = await DataRequestModel
            .findOne({_id: id})
            .populate({ 
                path: 'datasets dataset mainApplicant', 
                    populate: { 
                    path: 'publisher additionalInfo', 
                    populate: { 
                        path: 'team', 
                        populate: { 
                        path: 'users', 
                        populate: {
                            path: 'additionalInfo'
                        }
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
            // 3. Ensure single datasets are mapped correctly into array (backward compatibility for single dataset applications)
            if (_.isEmpty(accessRecord.datasets)) {
                accessRecord.datasets = [accessRecord.dataset];
            }

            // 4. Update application to submitted status
            accessRecord.applicationStatus = 'submitted';
            accessRecord.submittedDate = Date.now();
            await accessRecord.save();

            // 5. Send notifications and emails to custodian team and main applicant
            await module.exports.createNotifications('Submitted', { }, accessRecord, req.user);

            // 6. Return aplication and successful response
            return res.status(200).json({ status: 'success', data: accessRecord._doc });
        } catch (err) {
          console.log(err.message);
          res.status(500).json({ status: 'error', message: err });
        }
    },

    createNotifications: async (type, context, accessRecord, user) => {
        const hdrukEmail = `enquiry@healthdatagateway.org`;
        let answers = JSON.parse(accessRecord.questionAnswers);
        let { datasetfields : { contactPoint, publisher }} = accessRecord.datasets[0];
        let datasetTitles = accessRecord.datasets.map(dataset => dataset.name).join(', ');
        let { firstname: appFirstName, lastname: appLastName, email: appEmail } = accessRecord.mainApplicant;
        let { firstname, lastname } = user;
        let custodianUsers = [], emailRecipients = [];
        let options = {};
        let html = '';

        switch(type) {
            // DAR application status has been updated
            case 'StatusChange':
                // 1. Create notifications
                // Custodian team notifications
                if(_.has(accessRecord.datasets[0].toObject(), 'publisher.team.users')) {
                // Retrieve all custodian user Ids to generate notifications
                custodianUsers = [...accessRecord.datasets[0].publisher.team.users];
                let custodianUserIds = custodianUsers.map(user => user.id);
                await notificationBuilder.triggerNotificationMessage(custodianUserIds, `${appFirstName} ${appLastName}'s Data Access Request for ${datasetTitles} was ${context.applicationStatus} by ${firstname} ${lastname}`,'data access request', accessRecord._id);
                }
                // Create applicant notification
                await notificationBuilder.triggerNotificationMessage([accessRecord.userId], `Your Data Access Request for ${datasetTitles} was ${context.applicationStatus} by ${publisher}`,'data access request', accessRecord._id);

                // 2. Send emails to relevant users
                // Aggregate objects for custodian and applicant
                emailRecipients = [accessRecord.mainApplicant, ...custodianUsers].filter(function(user) {
                    let { additionalInfo: { emailNotifications }} = user;
                    return emailNotifications === true;
                });
                let { dateSubmitted } = accessRecord;
                if(!dateSubmitted)
                ({ updatedAt: dateSubmitted } = accessRecord);
                // Create object to pass through email data
                options = { id: accessRecord._id, applicationStatus: context.applicationStatus, applicationStatusDesc: context.applicationStatusDesc, publisher, project: '', datasetTitles, dateSubmitted };
                // Create email body content
                html = emailGenerator.generateDARStatusChangedEmail(answers, options);
                // Send email
                await emailGenerator.sendEmail(emailRecipients, hdrukEmail, `Data Access Request for ${datasetTitles} was ${context.applicationStatus} by ${publisher}`, html, true);
                break;
            case 'Submitted':
                // 1. Prepare data for notifications
                const emailRecipientTypes = ['requester', 'dataCustodian'];
                // Destructure the application
                let { jsonSchema } = accessRecord;
                // Parse the schema
                let { pages, questionPanels, questionSets: questions } = JSON.parse(jsonSchema);

                // 2. Create notifications
                // Custodian notification
                if(_.has(accessRecord.datasets[0].toObject(), 'publisher.team.users')) {
                    // Retrieve all custodian user Ids to generate notifications
                    custodianUsers = [...accessRecord.datasets[0].publisher.team.users];
                    let custodianUserIds = custodianUsers.map(user => user.id);
                    await notificationBuilder.triggerNotificationMessage(custodianUserIds, `A Data Access Request has been submitted to ${publisher} for ${datasetTitles} by ${appFirstName} ${appLastName}`,'data access request', accessRecord._id);
                }
                // Applicant notification
                await notificationBuilder.triggerNotificationMessage([accessRecord.userId], `Your Data Access Request for ${datasetTitles} was successfully submitted to ${publisher}`,'data access request', accessRecord._id);

                // 3. Send emails to custodian and applicant
                // Create object to pass to email generator
                options = { userType: '', userEmail: appEmail, userName: `${appFirstName} ${appLastName}`, custodianEmail: contactPoint, publisher, datasetTitles };
                // Iterate through the recipient types
                for (let emailRecipientType of emailRecipientTypes) {
                    // Send emails to custodian team members who have opted in to email notifications
                    if(emailRecipientType === 'dataCustodian') { 
                        emailRecipients = [...custodianUsers].filter(function(user) {
                            let { additionalInfo: { emailNotifications }} = user;
                            return emailNotifications === true;
                        });
                    } else {
                        // Send email to main applicant if they have opted in to email notifications
                        emailRecipients = [accessRecord.mainApplicant].filter(function(user) {
                            let { additionalInfo: { emailNotifications }} = user;
                            return emailNotifications === true;
                        });;
                    }
                    // Establish email context object
                    options = {...options, userType: emailRecipientType};
                    // Build email template 
                    html = await emailGenerator.generateEmail(questions, pages, questionPanels, answers, options);
                    // Send email
                    if(!_.isEmpty(emailRecipients)) {
                        await emailGenerator.sendEmail(emailRecipients, hdrukEmail, `Data Access Request has been submitted to ${publisher} for ${datasetTitles}`, html, true);
                    }
                }
                break;
        }
    }
}
