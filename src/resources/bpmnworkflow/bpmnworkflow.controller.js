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
            "businessKey": businessKey
        }
        axios.post(`${process.env.BPMNBASEURL}/process-definition/key/GatewayWorkflowSimple/start`, data)
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
        axios.post(`${process.env.BPMNBASEURL}/task/${taskId}/complete`, data)
            .catch((err) => { 
                console.error(err);
            });
    },
    getProcess: async (businessKey) => {
        axios.get(`${process.env.BPMNBASEURL}/task?processInstanceBusinessKey=${businessKey}`)
            .then((response) => {
                let { id = '' } = response.data[0];
                if(_.isEmpty(id)) {
                    console.error('Camunda Workflow - Process not found by Data Access Request ID');
                }
                return id;
            })
            .catch((err) => { 
                console.error(err);
            });
    }

}