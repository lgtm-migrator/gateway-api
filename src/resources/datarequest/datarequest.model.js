import { model, Schema } from 'mongoose';

const DataRequestSchema = new Schema({
  version: Number,
  userId: Number,
  dataSetId: String,
  applicationStatus: {
    type: String,
    default: 'inProgress',
    enum: ['inProgress' , 'submitted', 'accepted']
  },
  jsonSchema: {
    type: String,
    default: "{}"
  },
  questionAnswers: {
    type: String,
    default: "{}"
  }
}, {
    timestamps: true 
});

export const DataRequestModel = model('data_request', DataRequestSchema)
