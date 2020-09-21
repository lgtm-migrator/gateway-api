const createProcess = (data) => {
    const process = {
        "variables": {
            "applicationStatus": {
                "value": "{ApplicationStatus}",
                "type": "String"
            },
            "dateSubmitted": {
                "value": "{DateTimeNow}",
                "type": "String"
            },
            "publisher": {
                "value": "{UserId}",
                "type": "String"
            }
        },
        "businessKey": "{DataRequestId}"
    };

    
}

export default createProcess;