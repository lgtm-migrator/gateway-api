import { model, Schema } from 'mongoose';

const DataRequestSchemas = new Schema({
  id: Number,
  status: String,
  version: Number,
  dataSetId: String,
  jsonSchema: String,
});

export const DataRequestSchemaModel = model('data_request_schemas', DataRequestSchemas);
