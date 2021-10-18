import { model, Schema } from 'mongoose';

const UserSchema = new Schema(
	{
		id: {
			type: Number,
			unique: true,
		},
		email: String,
		feedback: { type: Boolean, default: false }, 	//email subscription
		news: { type: Boolean, default: false }, 		//email subscription
		password: String,
		businessName: String,
		firstname: String,
		lastname: String,
		displayname: String,
		providerId: { type: String, required: true },
		provider: String,
		affiliation: String,
		role: String,
		redirectURL: String,
		discourseUsername: String,
		discourseKey: String,
		isServiceAccount: { type: Boolean, default: false },
		clientID: String,
		clientSecret: String,
		advancedSearchRoles: [],
		acceptedAdvancedSearchTerms: Boolean,
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

UserSchema.virtual('additionalInfo', {
	ref: 'Data',
	foreignField: 'id',
	localField: 'id',
	justOne: true,
	options: { select: 'bio link orcid activeflag organisation emailNotifications terms -id -_id' },
});

UserSchema.virtual('teams', {
	ref: 'Team',
	foreignField: 'members.memberid',
	localField: '_id',
});

export const UserModel = model('User', UserSchema);
