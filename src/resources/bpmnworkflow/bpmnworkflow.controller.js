import axios from 'axios';
import axiosRetry from 'axios-retry';
import _ from 'lodash';

axiosRetry(axios, { retries: 3, retryDelay: () => {
    return 3000;
  }});

module.exports = {
    postCreateProcess: async (bmpContext) => {
        // Create Axios requet to start Camunda process
        let { applicationStatus, dateSubmitted, publisher, actioner, businessKey } = bmpContext;
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
        await axios.post(`${process.env.BPMNBASEURL}/engine-rest/process-definition/key/GatewayWorkflowSimple/start`, data)
            .catch((err) => { 
                console.error(err);
            });
    },
    postUpdateProcess: async (bmpContext) => {
        // Create Axios requet to start Camunda process
        let { taskId, applicationStatus, dateSubmitted, publisher, actioner, archived } = bmpContext;
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
        await axios.post(`${process.env.BPMNBASEURL}/engine-rest/task/${taskId}/complete`, data)
            .catch((err) => { 
                console.error(err);
            });
    },
    getProcess: async (businessKey) => {
        return await axios.get(`${process.env.BPMNBASEURL}/engine-rest/task?processInstanceBusinessKey=${businessKey.toString()}`);
    }
}