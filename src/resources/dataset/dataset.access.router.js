import express from 'express'
import { UserModel } from '../user/user.model';
import { DataRequestModel } from '../datarequests/datarequests.model';
const emailBuilder = require('../utilities/emailBuilder');
const sgMail = require('@sendgrid/mail');
const router = express.Router();

// @router   POST /api/v1/datasets/access/request
// @desc     Request Access for Datasets 
// @access   Private
router.post('/request', async (req, res) => {
  const {
    userId,
    dataSetId,
  } = req.body;
  const sendSuccess = { type: 'success', message: 'Done! Your request for data access has been sent to the data custodian.' };
  try {
    // 1. get the current user requesting access
    const user = await UserModel.findOne({ id: userId });
    // 2. handle event if no user present in db
    if (!user) {
      return res
        .status(400)
        .json({ message: { type: 'danger', message: 'User not found' } });
    }

    // 3. send email to requester and custodian of the data
    const emailRecipientTypes = ['requester', 'dataCustodian'];

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    for (let emailRecipientType of emailRecipientTypes) {
      let msg = emailBuilder.setMessageProperties(emailRecipientType, req.body, user);
      await sgMail.send(msg);
    }

    // 4. log access request to data_requests
    let dataAccessLog = new DataRequestModel();
    dataAccessLog.id = parseInt(Math.random().toString().replace(`0.`, ``));
    dataAccessLog.dataSetId = dataSetId;
    dataAccessLog.userId = userId;
    dataAccessLog.timeStamp = Date.now();
    dataAccessLog.save((err) => {
      if (err) return res.json({ message: { type: 'danger', message: err } });

      return res.json({ message: { ...sendSuccess } });
    });

  }
  catch (error) {
    console.log(error);
    res.status(500).json({ message: { type: 'danger', message: 'Something went wrong and your request could not be sent.' } });
  }
})

module.exports = router;