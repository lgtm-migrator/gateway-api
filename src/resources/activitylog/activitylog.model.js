import { model, Schema } from 'mongoose';
import constants from '../utilities/constants.util';

const ActivityLogSchema = new Schema({
	eventType: { type: String, required: true, enum: Object.values(constants.activityLogEvents) },
	logType: { type: String, required: true, enum: Object.values(constants.activityLogTypes) },
	userTypes: [],
	timestamp: { type: Date, required: true },
	user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	versionId: { type: Schema.Types.ObjectId, required: true },
	version: { type: String, required: true },
	plainText: { type: String, required: true },
	detailedText: String,
	html: { type: String, required: true },
	detailedHtml: String,
	isPresubmission: Boolean
});

export const ActivityLog = model('ActivityLog', ActivityLogSchema);
