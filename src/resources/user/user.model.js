import { model, Schema } from 'mongoose'

const UserSchema = new Schema({
  id: Number,
  email: String,
  password: String,
  businessName: String,
  firstname: String,
  lastname: String,
  displayname: String,
  providerId: String,
  provider: String,
  role: String
})

export const UserModel = model('User', UserSchema)
