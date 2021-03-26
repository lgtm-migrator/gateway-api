import { model, Schema } from 'mongoose';

const TeamSchema = new Schema(
	{
		id: {
			type: Number,
			unique: true,
		},
		members: [
			{
				memberid: { type: Schema.Types.ObjectId, ref: 'User', required: true },
				roles: { type: [String], enum: ['reviewer', 'manager', 'metadata_manager'], required: true },
				dateCreated: Date,
				dateUpdated: Date,
			},
		],
		type: String,
		active: {
			type: Boolean,
			default: true,
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		timestamps: true,
	}
);

TeamSchema.virtual('publisher', {
	ref: 'Publisher',
	foreignField: '_id',
	localField: '_id',
	justOne: true,
});

TeamSchema.virtual('users', {
	ref: 'User',
	foreignField: '_id',
	localField: 'members.memberid',
});

export const TeamModel = model('Team', TeamSchema);
