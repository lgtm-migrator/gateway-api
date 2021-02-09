import { model, Schema } from 'mongoose';

import DatasetClass from './dataset.entity';

//DO NOT DELETE publisher and team model below
import { PublisherModel } from '../publisher/publisher.model';
import { TeamModel } from '../team/team.model';
import { DataRequestModel } from '../datarequest/datarequest.model';

const datasetSchema = new Schema(
	{
		id: Number,
		name: String,
		description: String,
		resultsInsights: String,
		link: String,
		type: String,
		categories: {
			category: { type: String },
		},
		license: String,
		authors: [Number],
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
		uploader: Number,
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
	},
	{
		timestamps: true,
		collection: 'tools',
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

datasetSchema.virtual('publisher', {
	ref: 'Publisher',
	foreignField: 'name',
	localField: 'datasetfields.publisher',
	justOne: true,
});

datasetSchema.virtual('reviews', {
	ref: 'Reviews',
	foreignField: 'reviewerID',
	localField: 'id',
	justOne: false,
});

datasetSchema.virtual('tools', {
	ref: 'Data',
	foreignField: 'authors',
	localField: 'id',
	justOne: false,
});

datasetSchema.virtual('submittedDataAccessRequests', {
	ref: 'data_request',
	foreignField: 'datasetIds',
	localField: 'datasetid',
	count: true,
	match: {
		applicationStatus: { $in: ['submitted', 'approved', 'inReview', 'rejected', 'approved with conditions'] },
	},
	justOne: false,
});


// TODO Add virtual for Related Objects connected to this dataset

datasetSchema.loadClass(DatasetClass);

export const Dataset = model('Dataset', datasetSchema, 'tools');
export const type = 'dataset';