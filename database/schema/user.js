import { model, Schema } from 'mongoose'

const UserSchema = new Schema({
  id: String,
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

const UserModel = model('User', UserSchema)

export { UserModel }