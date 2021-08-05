import { model, Schema } from 'mongoose';

import CohortClass from './cohort.entity';

const cohortSchema = new Schema(
	{
		id: Number,
		pid: String,
		name: String,
		status: String,
		userId: Number,
		uploaders: [],
		isPublic: Boolean,
		version: Number,
		changeLog: String,
		updatedAt: Date,
		lastRefresh: Date,

		// fields from RQuest
		request_id: String,
		cohort: {},
		items: [],
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Load entity class
cohortSchema.loadClass(CohortClass);

export const Cohort = model('Cohort', cohortSchema);
