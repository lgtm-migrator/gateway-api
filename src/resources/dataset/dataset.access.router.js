import express from 'express'
import { UserModel } from '../user/user.model';
import { DataRequestModel } from '../datarequests/datarequests.model';
const sgMail = require('@sendgrid/mail');
const router = express.Router();


// @router   POST /api/v1/dataset/access/request
// @desc     Request Access for Datasets 
// @access   Private
  router.post('/request', async (req, res) => {
    const {
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
      title,
      userId,
      dataSetId,
      custodianEmail
    } = req.body;
    const sendSuccess = {type: 'success', message: 'Done! Your request for data access has been sent to the data custodian.'};
    const hdrukEmail = `enquiry@healthdatagateway.org`;
    try {
      // 1. get the current user requesting access
      const user = await UserModel.findOne({id: userId});
      // 2. handle event if no user present in db
      if (!user) {
        return res
          .status(400)
          .json({ message: { type:'danger', message: 'User not found' } });
      }
      // 3. email to requestor
      const msg = {
        to: user.email,
        from: `${hdrukEmail}`,
        subject: `Enquires for ${title} dataset healthdatagateway.org`,
        html: `Thank you for enquiring about access to the ${title} dataset through the 
        Health Data Research UK Innovation Gateway. The Data Custodian for this dataset 
        has been notified and they will contact you directly in due course.<br /><br />
        In order to facilitate the next stage of the request process, please make yourself 
        aware of the technical data terminology used by the NHS Data Dictionary 
        on the following link: <a href="https://www.datadictionary.nhs.uk/">https://www.datadictionary.nhs.uk/</a><br /><br />
        Please reply to this email, if you would like to provide feedback to the 
        Data Enquiry process facilitated by the Health Data Research 
        Innovation Gateway - <a href="mailto:support@healthdatagateway.org">support@healthdatagateway.org(opens in new tab)</a>`,
      };
      // 4. email to custodian of the data
      const msgCustodian = {
        to: `${custodianEmail}`,
        from: `${hdrukEmail}`,
        subject: `Enquires for ${title} dataset healthdatagateway.org`,
        html: `
            An enquiry to access the ${title} dataset has been made. Please see the details of the enquiry below:<br /><br /><br />
            ${researchAim ? `<strong>Research Aim</strong>: ${researchAim} <br /><br />` : ''}
            ${linkedDataSets ? `<strong>Linked Datasets</strong>: ${namesOfDataSets} <br /><br />` : ''}
            ${dataRequirements ? `<strong>Data Field Requirements</strong>: ${dataSetParts}<br /><br />` : ''}
            ${startDate ? `<strong>Start date</strong>: ${startDate}<br /><br />`: ''}
            ${icoRegistration ? `<strong>ICO Registration number</strong>: ${icoRegistration}<br /><br />`: ''}
            ${researchBenefits ? `<strong>Research benefits</strong>: ${researchBenefits}<br /><br />`: ''}
            ${researchBenefits ? `<strong>Research benefits</strong>: ${researchBenefits}<br /><br />`: ''}
            ${ethicalProcessingEvidence ? `<strong>Ethical processing evidence</strong>: ${ethicalProcessingEvidence}<br /><br />`: ''}
            ${contactNumber ? `<strong>Contact number</strong>: ${contactNumber}<br /><br />`: ''}
            The person requesting the data is: ${user.firstname} ${user.lastname}`
      };
      // 5. sendgrid config and email processing
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send(msg); 
      await sgMail.send(msgCustodian); 
      // 6. log access request to data_requests
      let dataAccessLog = new DataRequestModel();
      dataAccessLog.id = parseInt(Math.random().toString().replace(`0.`, ``));
      dataAccessLog.dataSetId = dataSetId;
      dataAccessLog.userId = userId;
      dataAccessLog.timeStamp = Date.now();
      dataAccessLog.save((err) => {
        if (err) return res.json({message: {type: 'danger', message: err}});

        return res.json({message: {...sendSuccess}});
      });

    }
    catch(error) {
      console.log(error);
      res.status(500).json({message: {type: 'danger', message: 'Something went wrong and your request could not be sent.'}});
    }

  });

  module.exports = router;