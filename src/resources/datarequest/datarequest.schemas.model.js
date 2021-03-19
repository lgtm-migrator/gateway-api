import { model, Schema } from 'mongoose';

const FormTypes = Object.freeze({
  Enquiry : 'enquiry',
  Extended5Safe : '5 safes'
});

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
  formType: {
    type: String,
    default: '5 safes',
    enum: Object.values(FormTypes),
  },
  jsonSchema: String,
}, {
  timestamps: true 
});

Object.assign(DataRequestSchemas.statics, {
  FormTypes,
});


export const DataRequestSchemaModel = model('data_request_schemas', DataRequestSchemas); 


