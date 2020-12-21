import { model, Schema } from 'mongoose';

const CourseSchema = new Schema(
	{
		id: Number,
		type: String,
		creator: Number,
		activeflag: String,
		//updatedon: Date,
		counter: Number,
		discourseTopicId: Number,
		relatedObjects: [
			{
				objectId: String,
				reason: String,
				objectType: String,
				user: String,
				updated: String,
			},
		],

		title: String,
		link: String,
		provider: String,
		description: String,
		courseDelivery: String,
		location: String,
		keywords: [String],
		domains: [String],
		courseOptions: [
			{
				flexibleDates: { type: Boolean, default: false },
				startDate: Date,
				studyMode: String,
				studyDurationNumber: Number,
				studyDurationMeasure: String,
				fees: [
					{
						feeDescription: String,
						feeAmount: Number,
						feePer: String,
					},
				],
			},
		],
		entries: [
			{
				level: String,
				subject: String,
			},
		],
		restrictions: String,
		award: [String],
		competencyFramework: String,
		nationalPriority: String,
	},
	{
		collection: 'course',
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

export const Course = model('Course', CourseSchema);
