import { model, Schema } from 'mongoose';

const GlobalSchema = new Schema(
	{
		languageCode: {
			type: String,
			require: true,
		},
		localeId: {
			type: String,
			require: true,
			unique: true,
		},
		entry: {
			type: Object,
			default: {},
		},
		aridhiaToken: {
			type: String,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

export const GlobalModel = model('Global', GlobalSchema);
