import { model, Schema } from 'mongoose';

const CohortProfilingSchema = new Schema(
	{
		id: {
			type: Number,
			unique: true,
		},
		tableName: String,
		pids: [], // pids of gateway datasets that use this table
		variables: [
			{
				maxLength: Number,
				completeness: Number,
				numRows: Number,
				name: String,
				values: [{ value: String, frequency: Number }],
			},
		],
	},
	{
		collection: 'cohort_profiling',
	}
);

export const CohortProfiling = model('cohortprofiling', CohortProfilingSchema);
