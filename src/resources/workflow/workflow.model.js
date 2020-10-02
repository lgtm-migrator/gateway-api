import { model, Schema } from 'mongoose';

const minReviewers = (val) => {
  return val.length > 0;
}

const minSteps = (val) => {
  return val.length > 0;
}

const minSections = (val) => {
  return val.length > 0;
}

const StepSchema = new Schema({
  stepName: { type: String, required: true },
  reviewers: { type: [{ type : Schema.Types.ObjectId, ref: 'User' }], validate:[minReviewers, 'There must be at least one reviewer per phase'] },
  sections: { type: [String], validate:[minSections, 'There must be at least one section assigned to a phase'] },
  deadline: { type: Number, required: true }
});

const WorkflowSchema = new Schema({
  id: { type: Number, required: true },
  workflowName: { type: String, required: true },
  version: Number,
  publisher: { type : Schema.Types.ObjectId, ref: 'Publisher', required: true },
  steps: { type: [ StepSchema ], validate:[minSteps, 'There must be at least one phase in a workflow']},
  active: { 
      type: Boolean, 
      default: true 
  },
  createdBy: { type : Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type : Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON:     { virtuals: true },
  toObject:   { virtuals: true }
});

const WorkflowModel = model('Workflow', WorkflowSchema)

module.exports = {
  WorkflowSchema: WorkflowSchema,
  WorkflowModel: WorkflowModel
}