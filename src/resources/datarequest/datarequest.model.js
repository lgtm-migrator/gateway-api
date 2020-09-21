import { model, Schema } from 'mongoose';

const DataRequestSchema = new Schema({
  version: Number,
  userId: Number, // Main applicant
  authors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  dataSetId: String,
  datasetIds: [{ type: String}],
  projectId: String,
  applicationStatus: {
    type: String,
    default: 'inProgress',
    enum: ['inProgress' , 'submitted', 'inReview', 'approved', 'rejected', 'approved with conditions', 'withdrawn']
  },
  archived: { 
    Boolean, 
    default: false 
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
  },
  dateSubmitted: {
    type: Date
  },
  dateFinalStatus: {
    type: Date
  },
  publisher: {
    type: String,
    default: ""
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

DataRequestSchema.virtual('publisherObj', {
  ref: 'Publisher',
  foreignField: 'name',
  localField: 'publisher',
  justOne: true
});

export const DataRequestModel = model('data_request', DataRequestSchema)
