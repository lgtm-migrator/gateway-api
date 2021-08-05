import { model, Schema } from 'mongoose';

import CohortClass from './cohort.entity';

const cohortSchema = new Schema(
	{
		id: Number,
		pid: String,
		description: String,
		status: String,
		userId: Number,
		uploaders: [],
		isPublic: Boolean,
		version: Number,
		changeLog: String,
		updatedAt: Date,

		// fields from RQuest
		request_id: String,
		cohort: {},
		items: [],
		access_duration: {},
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
