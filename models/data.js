// /backend/data.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// this will be our data base's data structure 
const DataSchema = new Schema(
  {
    id: Number,
    message: String
  },
  { 
    collection: 'testCollection',
    timestamps: true
  }
);


DataSchema.statics.test = function () {
    console.log("test");
}


// export the new Schema so we could modify it using Node.js
const dataModel = mongoose.model("Data", DataSchema); //creating model


module.exports = dataModel;