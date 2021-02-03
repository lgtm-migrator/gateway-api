import { model, Schema } from 'mongoose';

const PublisherSchema = new Schema(
	{
		id: {
			type: Number,
			unique: true,
		},
		name: String,
		active: {
			type: Boolean,
			default: true,
		},
		imageURL: String,
		allowsMessaging: {
			type: Boolean,
			default: false,
		},
		dataRequestModalContent: {
			header: String,
			body: String,
			footer: String,
		},
		workflowEnabled: {
			type: Boolean,
			default: false,
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

PublisherSchema.virtual('team', {
	ref: 'Team',
	foreignField: '_id',
	localField: '_id',
	justOne: true,
});

export const PublisherModel = model('Publisher', PublisherSchema);
