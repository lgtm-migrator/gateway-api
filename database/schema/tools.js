import { model, Schema } from 'mongoose'

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
        reviewerID: Number,
        rating: Number, 
        projectName: String,
        review: String,
        date: Date
      }
    ],
    firstname: String,
    lastname: String,
    activeflag: String
  },
  { 
    collection: 'tools',
    timestamps: true 
  }
);

// export the new Schema so we could modify it using Node.js
const Data = model('Data', ToolSchema)

export { Data }