// /backend/data.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// this will be our data base's data structure 
const RecordSearchSchema = new Schema(
  {
    searched: String,
    returned: Number,
    datesearched: Date
  },
  { collection: 'recorded_search' },
  { timestamps: true }
);

// export the new Schema so we could modify it using Node.js
module.exports = mongoose.model("RecordSearchModel", RecordSearchSchema);