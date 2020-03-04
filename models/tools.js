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
    rating: Number,
    link: String,
    categories: {
      category: {type: String},
      programmingLanguage: {type: [String]},
      programmingLanguageVersion: {type: String},
    },
    license: String,
    authors: [String],
    tags: {
      features: [String],
      topics: [String],
    },
    reviews: [
      {
        rating: Number,
        project: Boolean,
        projectName: String,
        review: String,
      }
    ],
    firstname: String,
    surname: String,
  },
  { 
    collection: 'tools',
    timestamps: true 
  }
);

// export the new Schema so we could modify it using Node.js
module.exports = mongoose.model("ToolModel", ToolSchema);