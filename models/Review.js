import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  asin: { type: String, required: true }, // Amazon Standard Identification Number
  name: { type: String, required: true }, // Product name
  rating: { type: String, required: true }, // Rating (stored as a string in your data)
  review: { type: String, required: true }, // Review content
});

const Review = mongoose.model("Review", reviewSchema, "ReviewBOT"); // Specify the collection name explicitly

export default Review;
