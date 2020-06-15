import { model, Schema } from 'mongoose';

const DataRequestSchema = new Schema({
  id: String,
  version: Number,
  userId: Number,
  dataSetId: String,
  applicationStatus: {
    type: String,
    default: "inProgress"
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
