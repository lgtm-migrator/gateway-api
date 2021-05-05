import { model, Schema } from 'mongoose';

const statsSnapshotSchema = new Schema(
	{
		date: Date,
		entityCounts: {
			datasets: 200,
			datasetsWithMetadata: 100,
			tools: 143,
			papers: 378,
			projects: 41,
			persons: 599,
			courses: 60,
			accessRequests: 271
		}
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

export const StatsSnapshot = model('Stats_Snapshot', statsSnapshotSchema);
