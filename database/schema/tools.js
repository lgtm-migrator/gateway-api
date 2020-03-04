import { model, Schema } from 'mongoose'

// this will be our data base's data structure 
const ToolSchema = new Schema(
  {
    id: String,
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
    lastname: Stringx
  },
  { 
    collection: 'tools',
    timestamps: true 
  }
);

// export the new Schema so we could modify it using Node.js
const Data = model('Data', ToolSchema)

export { Data }