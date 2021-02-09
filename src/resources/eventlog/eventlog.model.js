import { model, Schema } from 'mongoose';

const EventLogSchema = new Schema( 
  {
    userId: Number,
    event: String, 
    timestamp: Date,
  }
);

export const EventLogModel = model('eventlog', EventLogSchema)
