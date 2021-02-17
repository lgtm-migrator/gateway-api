import { model, Schema } from 'mongoose';

import PaperClass from './paper.entity';

const paperSchema = new Schema(
	{
		id: Number,
		type: String,
		name: String,
		description: String,
		resultsInsights: String,
		link: String,
		categories: {
			category: { type: String }
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
		journal: String,
		journalYear: Number,
		isPreprint: Boolean,
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
paperSchema.pre('find', function() {
    this.where({type: 'paper'});
});

paperSchema.pre('findOne', function() {
    this.where({type: 'paper'});
});

// Load entity class
paperSchema.loadClass(PaperClass);

export const Paper = model('Paper', paperSchema, 'tools');