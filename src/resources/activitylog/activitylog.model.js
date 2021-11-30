import { model, Schema } from 'mongoose';
import constants from '../utilities/constants.util';

const ActivityLogSchema = new Schema({
	eventType: {
		type: String,
		required: true,
		enum: Object.values({ ...constants.activityLogEvents.dataset, ...constants.activityLogEvents.data_access_request }),
	},
	logType: { type: String, required: true, enum: Object.values(constants.activityLogTypes) },
	userTypes: { type: Array, required: false, default: void 0 },
	timestamp: { type: Date, required: true },
	user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	userDetails: {
		firstName: { type: String },
		lastName: { type: String },
		role: { type: String },
	},
	versionId: { type: Schema.Types.ObjectId, required: true },
	version: { type: String, required: true },
	plainText: { type: String, required: false },
	detailedText: String,
	html: { type: String, required: false },
	detailedHtml: String,
	isPresubmission: Boolean,
	datasetUpdates: {},
	adminComment: String,
});

export const ActivityLog = model('ActivityLog', ActivityLogSchema);
