import { model, Schema } from 'mongoose'

const DataRequestSchema = new Schema({
  id: Number,
  dataSetId: String,
  userId: Number,
  timeStamp: Date
},
{ 
  collection: 'data_requests',
});

export const DataRequestModel = model('DataRequest', DataRequestSchema)
