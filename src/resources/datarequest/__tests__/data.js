const accessRecord = {
	applicationStatus: 'inReview',
	jsonSchema: {
		pages: [
			{
				pageId: 'preSubmission',
				title: 'Pre-submission',
				description:
					'Make sure you have everything you need before you start the application process!!',
				active: true,
			},
			{
				pageId: 'safePeople',
				title: 'Safe People',
				description:
					'Please identify any persons or organisations who will have access to the data',
				active: false,
			},
			{
				pageId: 'safeProject',
				title: 'Safe Project',
				description: 'Something else...',
				active: false,
			},
			{
				pageId: 'safeData',
				title: 'Safe Data',
				description: 'Something else...',
				active: false,
			},
			{
				pageId: 'safeSettings',
				title: 'Safe Settings',
				description: 'Something else...',
				active: false,
			},
			{
				pageId: 'safeOutputs',
				title: 'Safe outputs',
				description: 'Something else...',
				active: false,
			},
			{
				pageId: 'postSubmission',
				title: 'Post-submission',
				description: 'Something else...',
				active: false,
			},
		],
		formPanels: [
			{
				index: 1,
				panelId: 'mrcHealthDataToolkit',
				pageId: 'preSubmission',
			},
			{
				index: 2,
				panelId: 'adviceFromPublisher',
				pageId: 'preSubmission',
			},
			{
				index: 3,
				panelId: 'applicant',
				pageId: 'safePeople',
			},
			{
				index: 4,
				panelId: 'principleInvestigator',
				pageId: 'safePeople',
			},
			{
				index: 5,
				panelId: 'safeProject',
				pageId: 'safeProject',
			},
		],
		questionPanels: [
			{
				panelId: 'mrcHealthDataToolkit',
				panelHeader: 'MRC Health Data Access toolkit',
				navHeader: 'MRC Health Data Toolkit',
				questionPanelHeaderText: 'Test',
				pageId: 'preSubmission',
				textareaInput: 'mrcHealthDataToolkit',
			},
			{
				panelId: 'adviceFromPublisher',
				panelHeader: 'Advice from Publisher',
				navHeader: 'Advice from Publisher',
				questionPanelHeaderText: 'Test',
				pageId: 'preSubmission',
				textareaInput: 'adviceFromPublisher',
			},
			{
				panelId: 'applicant',
				panelHeader: 'Applicant Details',
				navHeader: 'Applicant',
				questionPanelHeaderText: 'Test',
				pageId: 'safePeople',
				questionSets: [
					{
						index: 1,
						questionSetId: 'applicant',
					},
				],
			},
			{
				panelId: 'principleInvestigator',
				panelHeader: 'Principle Investigator',
				navHeader: 'Principle Investigator',
				pageId: 'safePeople',
				questionSets: [
					{
						index: 2,
						questionSetId: 'principleInvestigator',
					},
				],
			},
			{
				panelId: 'safeProject',
				panelHeader: 'Safe Project',
				navHeader: 'Safe Project',
				pageId: 'safeProject',
				questionSets: [
					{
						index: 1,
						questionSetId: 'safeProject',
					},
				],
			},
		],
		questionSets: [
			{
				questionSetId: 'applicant',
				questionSetHeader: 'Applicant details tests',
				questions: [
					{
						questionId: 'applicantName',
						question: 'Applicant name',
						input: {
							type: 'textInput',
						},
						validations: [
							{
								type: 'isLength',
								params: [1, 90],
							},
						],
						guidance:
							'Guidance information for applicant name, please insert your fullname.',
					},
					{
						questionId: 'passportNumber',
						question: 'Passport number',
						input: {
							type: 'textInput',
						},
						validations: [
							{
								type: 'isLength',
								params: [18],
							},
						],
						guidance: 'A valid passport number is needed.',
					},
					{
						questionId: 'principleInvestigator',
						question: 'Are you the principe investigator?',
						input: {
							type: 'radioOptionsInput',
							options: [
								{
									text: 'Yes',
									value: 'true',
								},
								{
									text: 'No',
									value: 'false',
									conditionalQuestions: [
										{
											questionId: 'principleInvestigatorReason',
											question: 'Reason for requesting data?',
											input: {
												type: 'textareaInput',
											},
											validations: [
												{
													type: 'isLength',
													params: [18],
												},
											],
											guidance:
												'A reason for requesting this information, we will use this to monitor.',
										},
									],
								},
							],
						},
						guidance:
							'A reason for requesting this information, we will use this to monitor.',
					},
				],
			},
			{
				questionSetId: 'principleInvestigator',
				questionSetHeader: 'Principle Investigator details',
				questions: [
					{
						questionId: 'regICONumber',
						question: 'ICO number',
						input: {
							type: 'textInput',
						},
						validations: [
							{
								type: 'isLength',
								params: [1, 8],
							},
						],
						guidance: 'Some principle investigator.',
					},
				],
			},
			{
				questionSetId: 'safeProject',
				questionSetHeader: 'SafeProject',
				questions: [
					{
						questionId: 'firstName',
						question: 'First name',
						input: {
							type: 'textInput',
						},
						validations: [
							{
								type: 'isLength',
								params: [1, 20],
							},
						],
						guidance: 'Some safe project guidance.',
					},
				],
			},
		],
	},
	questionAnswers: {
		firstName: 'ra',
		passportNumber: '223458340957032498570234785',
		principleInvestigator: 'true',
		regICONumber: '333',
		firstName: 'adsf',
	},
	dateSubmitted: '2020-10-23T10:55:47.231+00:00',
	amendmentIterations: [
		{
			dateCreated: '2020-10-03T11:14:01.843+00:00',
			createdBy: '5f03530178e28143d7af2eb1',
			questionAnswers: {
				firstName: {
					questionSetId: 'applicant',
					requested: true,
					reason: 'test reason',
					requestedBy: 'Robin Kavanagh',
					requestedByUser: '5f03530178e28143d7af2eb1',
					dateRequested: '2020-11-03T11:14:01.840+00:00',
        },
        lastName: {
					questionSetId: 'applicant',
					requested: true,
					reason: 'test reason',
					requestedBy: 'Robin Kavanagh',
					requestedByUser: '5f03530178e28143d7af2eb1',
					dateRequested: '2020-11-03T11:14:01.840+00:00',
				},
			},
    },
    {
			dateCreated: '2020-11-03T11:14:01.843+00:00',
			createdBy: '5f03530178e28143d7af2eb1',
			questionAnswers: {
				lastName: {
					questionSetId: 'applicant',
					requested: true,
					reason: 'test reason',
					requestedBy: 'Robin Kavanagh',
					requestedByUser: '5f03530178e28143d7af2eb1',
					dateRequested: '2020-11-03T11:14:01.840+00:00',
				},
			},
    }
	],
};

module.exports = {
	accessRecord,
};
