import { model, Schema } from 'mongoose'

const RecordSearchSchema = new Schema(
  {
    searched: String,
    returned: 
      {
        tool: Number, 
        project: Number, 
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