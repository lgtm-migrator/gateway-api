import axios from 'axios';
import axiosRetry from 'axios-retry';
import _ from 'lodash';

axiosRetry(axios, { retries: 3, retryDelay: () => {
    return 3000;
  }});

const bpmnBaseUrl = process.env.BPMNBASEURL;

module.exports = {
    //Generic Get Task Process Endpoints
    getProcess: async (businessKey) => {
        return await axios.get(`${bpmnBaseUrl}/engine-rest/task?processInstanceBusinessKey=${businessKey.toString()}`);
    },

    //Simple Workflow Endpoints
    postCreateProcess: async (bpmContext) => {
        // Create Axios requet to start Camunda process
        let { applicationStatus, dateSubmitted, publisher, actioner, businessKey } = bpmContext;
        let data = {
            "variables": {
                "applicationStatus": {
                    "value": applicationStatus,
                    "type": "String"
                },
                "dateSubmitted": {
                    "value": dateSubmitted,
                    "type": "String"
                },
                "publisher": {
                    "value": publisher,
                    "type": "String"
                },
                "actioner" : {
                    "value": actioner,
                    "type": "String"
                }
            },
            "businessKey": businessKey.toString()
        }
        await axios.post(`${bpmnBaseUrl}/engine-rest/process-definition/key/GatewayWorkflowSimple/start`, data)
            .catch((err) => { 
                console.error(err);
            });
    },
    postUpdateProcess: async (bpmContext) => {
        // Create Axios requet to start Camunda process
        let { taskId, applicationStatus, dateSubmitted, publisher, actioner, archived } = bpmContext;
        let data = {
            "variables": {
                "applicationStatus": {
                    "value": applicationStatus,
                    "type": "String"
                },
                "dateSubmitted": {
                    "value": dateSubmitted,
                    "type": "String"
                },
                "publisher": {
                    "value": publisher,
                    "type": "String"
                },
                "actioner" : {
                    "value": actioner,
                    "type": "String"
                },
                "archived" :{
                    "value": archived,
                    "type": "Boolean"
                }
            }
        }
        await axios.post(`${bpmnBaseUrl}/engine-rest/task/${taskId}/complete`, data)
            .catch((err) => { 
                console.error(err);
            });
    },

    //Complex Workflow Endpoints
    postStartPreReview: async (bpmContext) => {
        //Start pre-review process
        let { applicationStatus, dateSubmitted, publisher, businessKey } = bpmContext;
        let data = {
            "variables": {
                "applicationStatus": {
                    "value": applicationStatus,
                    "type": "String"
                },
                "dateSubmitted": {
                    "value": dateSubmitted,
                    "type": "String"
                },
                "publisher": {
                    "value": publisher,
                    "type": "String"
                }
            },
            "businessKey": businessKey.toString()
        }
        await axios.post(`${bpmnBaseUrl}/engine-rest/process-definition/key/GatewayReviewWorkflowComplex/start`, data)
            .catch((err) => {
                console.error(err);
            });
    },
    postStartManagerReview: async (bpmContext) => {
        // Start manager-review process
        let { applicationStatus, managerId, publisher, notifyManager } = bpmContext;
        let data = {
            "variables": {
                "applicationStatus": {
                    "value": applicationStatus,
                    "type": "String"
                },
                "userId": {
                    "value": managerId,
                    "type": "String"
                },
                "publisher": {
                    "value": publisher,
                    "type": "String"
                },
                "notifyManager": {
                    "value": notifyManager,
                    "type": "String"
                }
            }
        }
        await axios.post(`${bpmnBaseUrl}/engine-rest/task/${taskId}/complete`, data)
            .catch((err) => { 
                console.error(err);
            });
    },
    postManagerApproval: async (bpmContext) => {
        // Manager has approved sectoin
        let { applicationStatus, managerId, publisher } = bpmContext;
        let data = {
            "dataRequestStatus": applicationStatus,
            "dataRequestManagerId": managerId,
            "dataRequestPublisher": publisher,
            "managerApproved": true
        }
        await axios.post(`${bpmnBaseUrl}/api/gateway/workflow/v1/manager/completed/${businessKey}`)
        .catch((err) => {
            console.error(err);
        })
    },
    postStartStepReview: async (bpmContext) => {
        //Start Step-Review process
        let { applicationStatus, actioner, publisher, stepName, reminderDateTime, reviewers, businessKey } = bpmContext;
        let data = {
            "dataRequestStatus": applicationStatus,
            "dataRequestUserId": actioner,
            "dataRequestPublisher": publisher,
            "dataRequestStepName": stepName,
            "notifyReviewerSLA": reminderDateTime,
            "reviewerList": reviewers
        }
        await axios.post(`${bpmnBaseUrl}/api/gateway/workflow/v1/complete/review/${businessKey}`, data)
            .catch((err) => {
                console.error(err);
            });
    },
    postStartNextStep: async (bpmContext) => {
        //Start Next-Step process
        let { userId, publisher = "", stepName = "", notifyReviewerSLA = "", phaseApproved = false, reviewerList = [], businessKey } = bpmContext;
        let data = {
            "dataRequestUserId": userId,
            "dataRequestPublisher": publisher,
            "dataRequestStepName": stepName,
            "notifyReviewerSLA": notifyReviewerSLA,
            "phaseApproved": phaseApproved,
            "reviewerList": reviewerList
        }
        await axios.post(`${bpmnBaseUrl}/api/gateway/workflow/v1/reviewer/complete/${businessKey}`, data)
        .catch((err) => {
            console.error(err);
        });
    }
}