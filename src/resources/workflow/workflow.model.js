import { model, Schema } from 'mongoose'

const WorkflowSchema = new Schema({
  id: {
    type: Number
  },
  workflowName: String,
  version: Number,
  publisher: { type : Schema.Types.ObjectId, ref: 'Publisher' },
  steps: [
    {
      stepName: String,
      reviewers: [{ type : Schema.Types.ObjectId, ref: 'User' }],
      sections: [String],
      deadline: Number
    }
  ],
  active: { 
      type: Boolean, 
      default: true 
  },
  createdBy: { type : Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type : Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON:     { virtuals: true },
  toObject:   { virtuals: true }
});

export const WorkflowModel = model('Workflow', WorkflowSchema)