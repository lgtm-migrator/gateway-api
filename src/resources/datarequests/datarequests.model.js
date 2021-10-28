import { model, Schema } from 'mongoose' 

const DataRequestSchema = new Schema({
  id: Number,
  dataSetId: String,
  datasetIds: Array,
  userId: Number,
  timeStamp: Date
});

export const DataRequestModel = model('data_requests', DataRequestSchema)
