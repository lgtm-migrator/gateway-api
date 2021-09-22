import { model, Schema } from 'mongoose';

import DataUseRegisterClass from './dataUseRegister.entity';
import constants from './../../resources/utilities/constants.util';

const dataUseRegisterSchema = new Schema(
	{
		lastActivity: Date,
		projectTitle: String,
		projectId: { type: Schema.Types.ObjectId, ref: 'data_request' },
		datasetTitles: [{ type: String }],
		datasetIds: [{ type: String }],
		publisher: { type: Schema.Types.ObjectId, ref: 'Publisher', required: true },
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		userID: Number,
		keywords: [{ type: String }],
		fiveSafeFormAnswers: [{ type: String }],
		status: { type: String, required: true, enum: Object.values(constants.dataUseRegisterStatus) },
	},

	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Load entity class
dataUseRegisterSchema.loadClass(DataUseRegisterClass);

export const DataUseRegister = model('DataUseRegister', dataUseRegisterSchema);
