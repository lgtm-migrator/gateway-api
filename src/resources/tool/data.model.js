import { model, Schema } from 'mongoose'

// this will be our data base's data structure 
const DataSchema = new Schema(
  {
    id: Number,
    type: String,
    name: String,
    description: String,
    link: String,
    categories: {
      category: {type: String},
      //tools related fields
      programmingLanguage: {type: [String]},
      programmingLanguageVersion: {type: String},
    },
    license: String,
    authors: [Number],
    tags: {
      features: [String],
      topics: [String],
    },
    activeflag: String,
    updatedon: Date,
    counter: Number,
    discourseTopicId: Number,
    relatedObjects: [{
        objectId: String,
        reason: String,
        objectType: String,
        user: String,
        updated: String
    }],
    uploader: Number,

    //paper related fields
    journal: String,
    journalYear: Number,

    //person related fields
    firstname: String,
    lastname: String,
    bio: String, //institution
    orcid: String,
    emailNotifications: Boolean,
    terms: Boolean,

    //dataset related fields
    datasetid: String,
    datasetfields: {
        publisher: String,
        geographicCoverage: String,
        physicalSampleAvailability: [String],
        abstract: String,
        releaseDate: String,
        accessRequestDuration: String,
        conformsTo: String,
        accessRights: String,
        jurisdiction: String,
        datasetStartDate: String,
        datasetEndDate: String,
        statisticalPopulation: String,
        ageBand: String,
        contactPoint: String,
        metadataquality : {},
        metadataschema : {},
        technicaldetails : [],
        versionLinks: []
    },

    //not used
    rating: Number, 
    toolids: [Number], 
    datasetids: [String]
  },
  { 
    collection: 'tools',
    timestamps: true 
  }
);

export const Data = model('Data', DataSchema)