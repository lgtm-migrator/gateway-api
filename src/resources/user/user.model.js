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
})

export const UserModel = model('User', UserSchema)
