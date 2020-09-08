import emailGenerator from '../utilities/emailGenerator.util';
import _ from 'lodash';

const notificationBuilder = require('../utilities/notificationBuilder');

module.exports = {
    createNotifications: async (type, context, accessRecord, user) => {
        let { firstname, lastname } = user;
        switch(type) {
            // DAR application status has been updated
            case 'StatusChange':
                // 1. Create notifications
                // Custodian team notifications
                let custodianUsers = [];
                let datasetTitles = accessRecord.datasets.map(dataset => dataset.name).join(', ');
                if(_.has(accessRecord.datasets[0].toObject(), 'publisher.team.users')) {
                // Retrieve all custodian user Ids to generate notifications
                custodianUsers = [...accessRecord.datasets[0].publisher.team.users];
                let custodianUserIds = custodianUsers.map(user => user.id);
                // Extract personal data from main applicant to personalise notification
                let { firstname: appFirstName, lastname: appLastName } = accessRecord.mainApplicant;
                await notificationBuilder.triggerNotificationMessage(custodianUserIds, `${appFirstName} ${appLastName}'s Data Access Request for ${datasetTitles} was ${context.applicationStatus} by ${firstname} ${lastname}`,'data access request', accessRecord._id);
                }
                // Create applicant notification
                let { datasetfields : { publisher }} = accessRecord.datasets[0]
                await notificationBuilder.triggerNotificationMessage([accessRecord.userId], `Your Data Access Request for ${datasetTitles} was ${context.applicationStatus} by ${publisher}`,'data access request', accessRecord._id);

                // 2. Send emails to relevant users
                // Aggregate objects for custodian and applicant
                const hdrukEmail = `enquiry@healthdatagateway.org`;
                let emailRecipients = [accessRecord.mainApplicant, ...custodianUsers].filter(function(user) {
                let { additionalInfo: { emailNotifications }} = user;
                return emailNotifications === true;
                });
                // Parse answers to pass through to email generator
                let answers = JSON.parse(accessRecord.questionAnswers);
                let { dateSubmitted } = accessRecord;
                if(!dateSubmitted)
                ({ updatedAt: dateSubmitted } = accessRecord);

                // Create object to pass through email data
                let options = { id: accessRecord._id, applicationStatus: context.applicationStatus, applicationStatusDesc: context.applicationStatusDesc, publisher, project: '', datasetTitles, dateSubmitted };
                // Create email body content
                let html = emailGenerator.generateDARStatusChangedEmail(answers, options);
                // Send email
                await emailGenerator.sendEmail(emailRecipients, hdrukEmail, `Data Access Request for ${datasetTitles} was ${context.applicationStatus} by ${publisher}`, html, true);
                break;
        }
    }
}
