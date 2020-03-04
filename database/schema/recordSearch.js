import { model, Schema } from 'mongoose'


// this will be our data base's data structure 
const RecordSearchSchema = new Schema(
  {
    searched: String,
    returned: Number,
    datesearched: Date
  },
  { 
    collection: 'recorded_search',
    timestamps: true 
  }
);

// export the new Schema so we could modify it using Node.js
// export the new Schema so we could modify it using Node.js
const RecordSearchData = model('RecordSearchModel', RecordSearchSchema)

export { RecordSearchData }
