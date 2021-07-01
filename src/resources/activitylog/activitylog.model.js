import { model, Schema } from 'mongoose';

const ActivityLogSchema = new Schema({
	eventType: { type: String, required: true },
	userTypes: [],
	timestamp: { type: Date, required: true },
	user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	versionId: { type: Schema.Types.ObjectId, required: true },
	version: { type: String, required: true },
	plainText: { type: String, required: true },
	detailedText: String,
	html: { type: String, required: true },
	detailedHtml: String,
});

export const ActivityLogModel = model('ActivityLog', ActivityLogSchema);
