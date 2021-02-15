import { model, Schema } from 'mongoose';

import ToolClass from './tool.entity';

const toolSchema = new Schema(
	{
		id: Number,
		type: String,
		name: String,
		description: String,
		resultsInsights: String,
		link: String,
		categories: {
			category: { type: String },
			programmingLanguage: { type: [String] },
			programmingLanguageVersion: { type: String },
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
		programmingLanguage: [
			{
				programmingLanguage: String,
				version: String,
			},
		],
	},
	{
		timestamps: true,
		collection: 'tools',
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Virtuals

// Pre hook query middleware
toolSchema.pre('find', function() {
    this.where({type: 'tool'});
});

toolSchema.pre('findOne', function() {
    this.where({type: 'tool'});
});

// Load entity class
toolSchema.loadClass(ToolClass);

export const Tool = model('Tool', toolSchema, 'tools');