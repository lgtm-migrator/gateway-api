import { model, Schema } from 'mongoose'

const RecordSearchSchema = new Schema(
  {
    searched: String,
    returned: 
      {
        dataset: Number,  
        tool: Number, 
        project: Number, 
        paper: Number,
        person: Number
      },
    datesearched: Date
  },
  { 
    collection: 'recorded_search',
    timestamps: true 
  }
);

export const RecordSearchData = model('RecordSearchModel', RecordSearchSchema);