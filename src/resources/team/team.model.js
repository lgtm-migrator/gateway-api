import { model, Schema } from 'mongoose'

const TeamSchema = new Schema({
  id: {
    type: Number,
    unique: true
  },
  members: [{
      memberid: {type: Schema.Types.ObjectId,
        ref: 'User'},
      roles: [String]
    }],
  active: { 
      type: Boolean, 
      default: true 
  },
}, {
  toJSON:     { virtuals: true },
  toObject:   { virtuals: true }
});

TeamSchema.virtual('publisher', {
  ref: 'Publisher',
  foreignField: '_id',
  localField: '_id',
  justOne: true
});

export const TeamModel = model('Team', TeamSchema)