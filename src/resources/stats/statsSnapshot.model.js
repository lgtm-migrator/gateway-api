import { model, Schema } from 'mongoose';

const statsSnapshotSchema = new Schema(
	{
		date: Date,
		entityCounts: {
			dataset: Number,
			datasetWithMetadata: Number,
			tool: Number,
			paper: Number,
			project: Number,
			person: Number,
			course: Number,
			accessRequest: Number
		},
		searchCounts: {
			day: Number,
			month: Number,
			week: Number,
			year: Number
		}
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

export const StatsSnapshot = model('Stats_Snapshot', statsSnapshotSchema);
