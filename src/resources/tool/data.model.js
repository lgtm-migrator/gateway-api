import { model, Schema } from 'mongoose';
//DO NOT DELETE publisher and team model below
import { PublisherModel } from '../publisher/publisher.model';
import { TeamModel } from '../team/team.model';

// this will be our data base's data structure
const DataSchema = new Schema(
	{
		id: Number,
		type: String,
		name: String,
		description: String,
		resultsInsights: String,
		link: String,
		categories: {
			category: { type: String },
			//tools related fields
			programmingLanguage: { type: [String] },
			programmingLanguageVersion: { type: String },
		},
		license: String,
		// Appears as Uploaders in the F/E for tools, projects, papers
		authors: [Number],
		// Original uploader of entity
		uploader: Number,
		// List of authors
		authorsNew: String,
		tags: {
			features: [String],
			topics: [String],
		},
		activeflag: String,
		updatedon: Date,
		counter: Number,
		discourseTopicId: Number,
		relatedObjects: [
			{
				objectId: String,
				reason: String,
				pid: String,
				objectType: String,
				user: String,
				updated: String,
			},
		],
		//tools related fields
		programmingLanguage: [
			{
				programmingLanguage: String,
				version: String,
			},
		],
		//paper related fields
		journal: String,
		journalYear: Number,
		isPreprint: Boolean,
		document_links: {
			doi: [String],
			pdf: [String],
			html: [String],
		},
		//project related fields
		leadResearcher: String,

		//person related fields
		firstname: String,
		lastname: String,
		bio: String, //institution
		showBio: Boolean,
		orcid: String,
		showOrcid: Boolean,
		emailNotifications: { type: Boolean, default: true },
		terms: Boolean,
		sector: String,
		showSector: Boolean,
		organisation: String,
		showOrganisation: { type: Boolean, default: false },
		showLink: Boolean,
		showDomain: Boolean,
		profileComplete: Boolean,

		//dataset related fields
		source: String,
		is5Safes: Boolean,
		hasTechnicalDetails: Boolean,
		commercialUse: Boolean,
		datasetid: String,
		pid: String,
		datasetVersion: String,
		datasetfields: {
			publisher: String,
			geographicCoverage: [String],
			physicalSampleAvailability: [String],
			abstract: String,
			releaseDate: String,
			accessRequestDuration: String,
			conformsTo: String,
			accessRights: String,
			jurisdiction: String,
			datasetStartDate: String,
			datasetEndDate: String,
			statisticalPopulation: String,
			ageBand: String,
			contactPoint: String,
			periodicity: String,
			populationSize: String,
			metadataquality: {},
			datautility: {},
			metadataschema: {},
			technicaldetails: [],
			versionLinks: [],
			phenotypes: [],
		},
		datasetv2: {},
		questionAnswers: {},
		structuralMetadata: [],
		percentageCompleted: {},
		applicationStatusDesc: String,
		timestamps: {
			updated: Date,
			created: Date,
			submitted: Date,
			published: Date,
			rejected: Date,
			archived: Date,
		},
		datasetVersionIsV1: { type: Boolean, default: false },

		//not used
		rating: Number,
		toolids: [Number],
		datasetids: [String],
	},
	{
		collection: 'tools',
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

DataSchema.virtual('publisher', {
	ref: 'Publisher',
	foreignField: 'name',
	localField: 'datasetfields.publisher',
	justOne: true,
});

DataSchema.virtual('reviews', {
	ref: 'Reviews',
	foreignField: 'reviewerID',
	localField: 'id',
});

DataSchema.virtual('tools', {
	ref: 'Data',
	foreignField: 'authors',
	localField: 'id',
});

DataSchema.virtual('persons', {
	ref: 'Data',
	foreignField: 'id',
	localField: 'authors',
});

DataSchema.virtual('user', {
	ref: 'User',
	foreignField: 'id',
	localField: 'id',
	justOne: true,
});

export const Data = model('Data', DataSchema);
