import { model, Schema } from 'mongoose'

// this will be our data base's data structure 
const DataSchema = new Schema(
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
    authors: [Number],
    tags: {
      features: [String],
      topics: [String],
    },
    firstname: String,
    lastname: String,
    bio: String,
    link: String,
    orcid: String,
    activeflag: String,
    updatedon: Date,
    counter: Number,
    toolids: [Number],
    discourseTopicId: Number
  },
  { 
    collection: 'tools',
    timestamps: true 
  }
);

export const Data = model('Data', DataSchema)