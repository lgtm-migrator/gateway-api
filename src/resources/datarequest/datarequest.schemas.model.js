import { model, Schema } from 'mongoose';

const DataRequestSchemas = new Schema({
  id: Number,
  status: String,
  version: {
    type: Number,
    default: 1
  },
  dataSetId: {
    type: String,
    default: '',
  },
  publisher: {
    type: String,
    default: ''
  },
  jsonSchema: String,
}, {
  timestamps: true 
});

export const DataRequestSchemaModel = model('data_request_schemas', DataRequestSchemas); 
