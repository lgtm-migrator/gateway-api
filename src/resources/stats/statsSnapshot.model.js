import { model, Schema } from 'mongoose';

const statsSnapshotSchema = new Schema(
	{
		date: Date,
		entityCounts: {
			datasets: Number,
			datasetsWithMetadata: Number,
			tools: Number,
			papers: Number,
			projects: Number,
			persons: Number,
			courses: Number,
			accessRequests: Number
		}
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

export const StatsSnapshot = model('Stats_Snapshot', statsSnapshotSchema);
