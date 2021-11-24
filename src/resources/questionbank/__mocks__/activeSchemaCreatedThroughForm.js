export const dataRequestSchema = {
	_id: { $oid: '619e3176135ebd6de948f3dc' },
	version: { $numberInt: '3' },
	dataSetId: '',
	publisher: 'ALLIANCE > SAIL',
	formType: '5 safe',
	countOfChanges: 0,
	status: 'active',
	isCloneable: true,
	questionStatus: {
		safedatadataflowdiagramenclosed: 1,
		safeoutputsoutputsdisseminationplansproposalfindings: 0,
		safeoutputsoutputsdisseminationplansmilestones: 0,
		safeoutputsoutputsdisseminationplansdisclosurecontrolpolicy: 0,
		'safeoutputs-dataretention-retaindatadate': 0,
		safeoutputsdataretentionretaindatadatereason: 1,
		safeoutputsdataretentionretaindataextensionpermissions: 0,
	},
	createdAt: { $date: { $numberLong: '1637757303647' } },
	updatedAt: { $date: { $numberLong: '1637757380701' } },
	__v: 0,
	guidance: {
		safedatadataflowdiagramenclosed: 'This is the guidance for safedatadataflowdiagramenclosed',
		'safeoutputs-dataretention-retaindatadate': 'This is the guidance for safeoutputs-dataretention-retaindatadate',
	},
};

export const expectedQuestionStatus = {
	safedatadataflowdiagramenclosed: 1,
	safeoutputsoutputsdisseminationplansproposalfindings: 0,
	safeoutputsoutputsdisseminationplansmilestones: 0,
	safeoutputsoutputsdisseminationplansdisclosurecontrolpolicy: 0,
	'safeoutputs-dataretention-retaindatadate': 0,
	safeoutputsdataretentionretaindatadatereason: 1,
	safeoutputsdataretentionretaindataextensionpermissions: 0,
	safepeopleprimaryapplicantfullname: 0,
	safepeopleprimaryapplicantjobtitle: 1,
	safepeopleprimaryapplicanttelephone: 0,
	safepeopleprimaryapplicantorcid: 1,
	safepeopleprimaryapplicantemail: 0,
	safepeopleotherindividualsfullname: 1,
	safepeopleotherindividualsjobtitle: 0,
	safepeopleotherindividualsorganisation: 0,
	safepeopleotherindividualsrole: 0,
	safepeopleotherindividualsaccessdata: 1,
	safepeopleotherindividualsaccreditedresearcher: 0,
	safepeopleotherindividualstraininginformationgovernance: 0,
	safepeopleotherindividualsexperience: 1,
};

export const expectedGuidance = {
	safedatadataflowdiagramenclosed: 'This is the guidance for safedatadataflowdiagramenclosed',
	'safeoutputs-dataretention-retaindatadate': 'This is the guidance for safeoutputs-dataretention-retaindatadate',
};

export const expectedCountOfChanges = 0;
