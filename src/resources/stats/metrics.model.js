import { model, Schema } from 'mongoose'

const MetricsSchema = new Schema(
  {
    uptime: Number
  },
  { 
    collection: 'metrics',
    timestamps: true 
  }
);

export const MetricsData = model('MetricsModel', MetricsSchema);