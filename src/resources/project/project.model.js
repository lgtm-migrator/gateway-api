import { model, Schema } from 'mongoose';

import ProjectClass from './project.entity';

const projectSchema = new Schema(
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
projectSchema.pre('find', function() {
    this.where({type: 'project'});
});

projectSchema.pre('findOne', function() {
    this.where({type: 'project'});
});

// Load entity class
projectSchema.loadClass(ProjectClass);

export const Project = model('Project', projectSchema, 'tools');