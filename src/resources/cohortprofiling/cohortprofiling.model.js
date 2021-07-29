import { model, Schema } from 'mongoose';

const CohortProfilingSchema = new Schema(
	{
		pid: String,
		dataClasses: [
			{
				_id: false,
				name: String,
				dataElements: [
					{
						_id: false,
						field: String,
						length: Number,
						completeness: Number,
						rows: Number,
						frequencies: [
							{
								_id: false,
								value: String,
								frequency: Number,
								frequencyAsPercentage: Number,
							},
						],
					},
				],
			},
		],
	},
	{
		collection: 'cohort_profiling',
	}
);

export const CohortProfiling = model('cohortprofiling', CohortProfilingSchema);
