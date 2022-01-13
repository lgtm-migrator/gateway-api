import { model, Schema } from 'mongoose';

import DataUseRegisterClass from './dataUseRegister.entity';
import constants from './../../resources/utilities/constants.util';

const dataUseRegisterSchema = new Schema(
	{
		id: { type: Number, required: true },
		type: { type: String, required: true },
		activeflag: { type: String, required: true, enum: Object.values(constants.dataUseRegisterStatus) },
		updatedon: Date,
		counter: { type: Number, default: 0 },
		discourseTopicId: Number,
		relatedObjects: [
			{
				objectId: String,
				reason: String,
				objectType: String,
				pid: String,
				user: String,
				updated: String,
			},
		],
		keywords: [String],
		manualUpload: Boolean,

		lastActivity: Date,
		projectTitle: { type: String },
		projectId: { type: Schema.Types.ObjectId, ref: 'data_request' },
		projectIdText: String, //Project ID
		datasetTitles: [{ type: String }], //Dataset Name(s)
		gatewayDatasets: [{ type: String }], //Datasets on the Gateway
		nonGatewayDatasets: [{ type: String }], //Dataset Name(s)
		publisher: { type: Schema.Types.ObjectId, ref: 'Publisher', required: true },
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		organisationName: { type: String }, //Organisation Name
		organisationId: { type: String }, //Organisation ID
		organisationSector: String, //Organisation Sector
		gatewayApplicants: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		nonGatewayApplicants: [{ type: String }], //Applicant Name(s)
		applicantId: String, //Applicant ID
		fundersAndSponsors: [{ type: String }], // Funders/Sponsors
		accreditedResearcherStatus: String, //Accredited Researcher Status
		sublicenceArrangements: String, //Sub-Licence Arrangements (if any)?
		laySummary: String, //Lay Summary
		publicBenefitStatement: String, //Public Benefit Statement
		requestCategoryType: String, //Request Category Type
		technicalSummary: String, //Technical Summary
		otherApprovalCommittees: [{ type: String }], //Other Approval Committees
		projectStartDate: Date, //Project Start Date
		projectEndDate: Date, //Project End Date
		latestApprovalDate: Date, //Latest Approval Date
		dataSensitivityLevel: String, //Data Sensitivity Level
		legalBasisForDataArticle6: String, //Legal Basis For Provision Of Data (changed to 'Legal basis for provision of data under Article 6')
		legalBasisForDataArticle9: String, //Added 'Lawful conditions for provision of data under Article 9'
		dutyOfConfidentiality: String, //Common Law Duty Of Confidentiality
		nationalDataOptOut: String, //National Data Opt-Out Applied
		requestFrequency: String, //Request Frequency
		datasetLinkageDescription: String, //Description Of How The Data Will Be Processed (changed to 'For linked datasets, specify how the linkage will take place')
		confidentialDataDescription: String, //Description Of The Confidential Data Being Used
		accessDate: Date, //Release/Access Date
		accessType: String, //TRE Or Any Other Specified Location
		privacyEnhancements: String, //How Has Data Been Processed To Enhance Privacy
		gatewayOutputsTools: [{ type: Number }], //Link To Gateway Tool Research Outputs
		gatewayOutputsPapers: [{ type: Number }], //Link To Gateway Paper Research Outputs
		nonGatewayOutputs: [{ type: String }], //Link To NonGateway Research Outputs
		rejectionReason: String, //Reason For Rejecting A Data Use Register
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		strict: false,
	}
);

// Load entity class
dataUseRegisterSchema.loadClass(DataUseRegisterClass);

dataUseRegisterSchema.virtual('publisherInfo', {
	ref: 'Publisher',
	foreignField: '_id',
	localField: 'publisher',
	justOne: true,
});

dataUseRegisterSchema.virtual('publisherDetails', {
	ref: 'Publisher',
	foreignField: '_id',
	localField: 'publisher',
	justOne: true,
});

dataUseRegisterSchema.virtual('applicantDetails', {
	ref: 'User',
	foreignField: '_id',
	localField: 'gatewayApplicants',
});

dataUseRegisterSchema.virtual('gatewayDatasetsInfo', {
	ref: 'Data',
	foreignField: 'pid',
	localField: 'gatewayDatasets',
	options: { sort: { createdAt: -1 } },
});

dataUseRegisterSchema.virtual('gatewayOutputsToolsInfo', {
	ref: 'Data',
	foreignField: 'id',
	localField: 'gatewayOutputsTools',
});

dataUseRegisterSchema.virtual('gatewayOutputsPapersInfo', {
	ref: 'Data',
	foreignField: 'id',
	localField: 'gatewayOutputsPapers',
});

export const DataUseRegister = model('DataUseRegister', dataUseRegisterSchema);
