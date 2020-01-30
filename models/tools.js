// /backend/data.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// this will be our data base's data structure 
const ToolSchema = new Schema(
  {
    id: Number,
    type: String,
    name: String,
    description: String,
    tags: [String],
    rating: Number,
    link: String
  },
  { collection: 'tools' },
  { timestamps: true }
);

// export the new Schema so we could modify it using Node.js
module.exports = mongoose.model("ToolModel", ToolSchema);