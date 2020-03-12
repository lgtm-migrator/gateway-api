import { model, Schema } from 'mongoose'

// this will be our data base's data structure 
const ReviewsSchema = new Schema(
  {
    reviewID: Number,
    toolID: Number,
    reviewerID: Number,
    rating: Number,
    projectName: String,
    review: String,
    activeflag: String,
    date: Date,
    replierID: Number,
    reply: String,
    replydate: Date
  },
  {
    collection: 'reviews',
    timestamps: true
  }
);

// export the new Schema so we could modify it using Node.js
const Reviews = model('Reviews', ReviewsSchema)

export { Reviews }