import { model, Schema } from 'mongoose';

const DataRequestSchema = new Schema({
  version: Number,
  userId: Number,
  dataSetId: String,
  datasetIds: [{ type: String}],
  applicationStatus: {
    type: String,
    default: 'inProgress',
    enum: ['inProgress' , 'submitted', 'approved', 'rejected', 'approved with conditions']
  },
  applicationStatusDesc : String,
  jsonSchema: {
    type: String,
    default: "{}"
  },
  questionAnswers: {
    type: String,
    default: "{}"
  },
  aboutApplication: {
    type: String,
    default: "{}"
  }
}, {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true }
});

DataRequestSchema.virtual('datasets', {
  ref: 'Data',
  foreignField: 'datasetid',
  localField: 'datasetIds',
  justOne: false
});

DataRequestSchema.virtual('dataset', {
  ref: 'Data',
  foreignField: 'datasetid',
  localField: 'dataSetId',
  justOne: true
});

DataRequestSchema.virtual('mainApplicant', {
  ref: 'User',
  foreignField: 'id',
  localField: 'userId',
  justOne: true
});

export const DataRequestModel = model('data_request', DataRequestSchema)
