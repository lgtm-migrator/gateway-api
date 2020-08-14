import { model, Schema } from 'mongoose'

const UserSchema = new Schema({
  id: {
    type: Number,
    unique: true
  },
  email: String,
  password: String,
  businessName: String,
  firstname: String,
  lastname: String,
  displayname: String,
  providerId: String,
  provider: String,
  role: String,
  redirectURL: String,
  discourseUsername: String,
  discourseKey: String
}, {
  toJSON:     { virtuals: true },
  toObject:   { virtuals: true }
});

UserSchema.virtual('additionalInfo', {
  ref: 'Data',
  foreignField: 'id',
  localField: 'id',
  justOne: true,
  options: { select: 'bio link orcid activeflag emailNotifications terms -id -_id' }
});

export const UserModel = model('User', UserSchema)
