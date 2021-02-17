export const dataAccessRequests = [{ 
    "_id" : "6021b437da9a2332004cde73", 
    "authorIds" : [

    ], 
    "datasetIds" : [
        "dfb21b3b-7fd9-40c4-892e-810edd6dfc25"
    ], 
    "datasetTitles" : [
        "Admitted Patient Care Dataset"
    ], 
    "applicationStatus" : "submitted", 
    "jsonSchema" : " {\"classes\":{\"form\":\"login-form\",\"select\":\"form-control\",\"typeaheadCustom\":\"form-control\",\"datePickerCustom\":\"form-control\",\"question\":\"form-group\",\"input\":\"form-control\",\"radioListItem\":\"dar__radio--item\",\"radioList\":\"dar__radio--list list-group\",\"checkboxInput\":\"checkbox list-group\",\"checkboxListItem\":\"dar__check--item\",\"checkboxList\":\"dar__check list-group\",\"controlButton\":\"btn btn-primary pull-right\",\"backButton\":\"btn btn-default pull-left\",\"errorMessage\":\"alert alert-danger\",\"buttonBar\":\"button-bar hidden\"},\"pages\":[{\"pageId\":\"applicant\",\"title\":\"Make an enquiry\",\"description\":\"Give details about your project and the data you're interested\",\"active\":true}],\"formPanels\":[{\"index\":1,\"panelId\":\"applicant\",\"pageId\":\"applicant\"}],\"questionPanels\":[{\"panelId\":\"applicant\",\"panelHeader\":\"Project Details\",\"navHeader\":\"Applicant\",\"questionPanelHeaderText\":\"Test\",\"pageId\":\"applicant\",\"questionSets\":[{\"index\":1,\"questionSetId\":\"applicant\"}]}],\"questionSets\":[{\"questionSetId\":\"applicant\",\"questionSetHeader\":\"\",\"questions\":[{\"questionId\":\"applicantName\",\"question\":\"Applicant name\",\"input\":{\"type\":\"textInput\"},\"validations\":[{\"type\":\"isLength\",\"params\":[1,90]}],\"guidance\":\"Guidance information for applicant name, please insert your fullname.\"},{\"questionId\":\"researchAim\",\"question\":\"Research Aim\",\"input\":{\"type\":\"textareaInput\"},\"validations\":[{\"type\":\"isLength\",\"params\":[5]}],\"guidance\":\"Please briefly explain the purpose of your research and why you require this dataset.\"},{\"questionId\":\"linkedDatasets\",\"question\":\"Do you have any datasets you would like to link with this one?\",\"input\":{\"type\":\"radioOptionsInput\",\"options\":[{\"text\":\"Yes\",\"value\":\"true\",\"conditionalQuestions\":[{\"questionId\":\"linkeDatasetsParts\",\"question\":\"Please identify the names of the datasets.\",\"input\":{\"type\":\"textareaInput\"},\"validations\":[{\"type\":\"isLength\",\"params\":[5]}]}]},{\"text\":\"No\",\"value\":\"false\"}]}},{\"questionId\":\"dataRequirements\",\"question\":\"Do you know which parts of the dataset you are interested in?\",\"input\":{\"type\":\"radioOptionsInput\",\"options\":[{\"text\":\"Yes\",\"value\":\"true\",\"conditionalQuestions\":[{\"questionId\":\"dataRequirementsReason\",\"question\":\"Please explain which parts of the dataset.\",\"input\":{\"type\":\"textareaInput\"},\"validations\":[{\"type\":\"isLength\",\"params\":[5]}]}]},{\"text\":\"No\",\"value\":\"false\"}]}},{\"questionId\":\"projectStartDate\",\"question\":\"Proposed project start date (optional)\",\"input\":{\"type\":\"datePickerCustom\",\"value\":\"02/12/2020\"},\"validations\":[{\"type\":\"isCustomDate\",\"format\":\"dd/MM/yyyy\"}],\"guidance\":\"Please select a date for the proposed start date.\"},{\"questionId\":\"regICONumber\",\"question\":\"ICO number\",\"input\":{\"type\":\"textInput\"},\"validations\":[{\"type\":\"isLength\",\"params\":[1,8]}],\"guidance\":\"ICO registration number.\"},{\"questionId\":\"researchBenefits\",\"question\":\"Research benefits(optional)\",\"input\":{\"type\":\"textareaInput\"},\"guidance\":\"Please provide evidence of how your research will benefit the health and social care system.\"},{\"questionId\":\"ethicalProcessingEvidence\",\"question\":\"Ethical processing evidence (optional)\",\"input\":{\"type\":\"textareaInput\"},\"guidance\":\"Please provide a link(s) to relevant sources that showcase evidence of thee fair processing of data by your organisation.\"},{\"questionId\":\"contactNumber\",\"question\":\"Contact Number (optional)\",\"input\":{\"type\":\"textInput\"},\"guidance\":\"Please provide a telephone or mobile contact point.\"}]}]}", 
    "questionAnswers" : "{\"applicantName\":\"Robin Kavanagh\",\"researchAim\":\"Testing\",\"linkedDatasets\":\"false\",\"dataRequirements\":\"false\",\"projectStartDate\":\"22/02/2021\",\"regICONumber\":\"fsssfdf\"}", 
    "publisher" : "Oxford University Hospitals NHS Foundation Trust", 
    "version" : 1, 
    "userId" : 6689395059831886.0, 
    "dataSetId" : "dfb21b3b-7fd9-40c4-892e-810edd6dfc25", 
    "schemaId" : "5f0346914eaf3eba7e4f9237", 
    "files" : [

    ], 
    "amendmentIterations" : [
        {
            "_id" : "6021b46cda9a2332004cde7a", 
            "dateReturned" : "2021-02-08T22:00:12.386+0000", 
            "returnedBy" : "5f03530178e28143d7af2eb1", 
            "dateCreated" : "2021-02-08T22:00:12.386+0000", 
            "createdBy" : "5f03530178e28143d7af2eb1", 
            "questionAnswers" : {
                "projectStartDate" : {
                    "_id" : "6021b46cda9a2332004cde79", 
                    "questionSetId" : "", 
                    "requested" : false, 
                    "reason" : "", 
                    "answer" : "", 
                    "updatedBy" : "Alistair Kavanagh", 
                    "updatedByUser" : "5f03530178e28143d7af2eb1", 
                    "dateUpdated" : "2021-02-08T22:00:12.383+0000"
                }
            }
        }
    ], 
    "createdAt" : "2021-02-08T21:59:19.776+0000", 
    "updatedAt" : "2021-02-08T21:59:43.143+0000", 
    "__v" : 0, 
    "projectId" : "6021-B437-DA9A-2332-004C-DE73", 
    "dateSubmitted" : "2021-02-08T21:59:43.842+0000"
}]
