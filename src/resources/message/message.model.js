import { model, Schema } from 'mongoose';

const MessageSchema = new Schema(
	{
		messageID: Number,
		messageTo: Number,
		messageObjectID: Number,
		messageDataRequestID: {
			type: Schema.Types.ObjectId,
			ref: 'data_request',
		},
		messageDescription: String,
		messageType: {
			type: String,
			enum: [
				'message',
				'add',
				'approved',
				'archive',
				'author',
				'rejected',
				'added collection',
				'review',
				'data access request',
				'data access request received',
				'data access request unlinked',
				'team',
				'team unlinked',
				'edit',
				'workflow',
				'data access message sent',
				'dataset submitted',
				'dataset approved',
				'dataset rejected',
				'draft dataset deleted',
			],
		},
		publisherName: {
			type: String,
			default: '',
			trim: true,
		},
		datasetID: {
			type: String,
			default: '',
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		userType: {
			type: String,
			enum: ['applicant', 'custodian'],
		},
		createdDate: {
			type: Date,
			default: Date.now,
		},
		isRead: {
			type: String,
			enum: ['true', 'false'],
			default: 'false',
		},
		topic: {
			type: Schema.Types.ObjectId,
			ref: 'Topic',
		},
		readBy: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		createdByName: {
			type: Object,
		},
		firstMessage: {
			type: Object,
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

export const MessagesModel = model('Messages', MessageSchema);
