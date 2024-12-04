import express from "express";
import connectDB from "./db.js";
import mongoose from "mongoose";

const router = express.Router();

// Define the schema for the contact collection
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Create the Contact model
const Contact = mongoose.model("Contact", contactSchema);

// Route to handle contact form submission
router.post("/", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Ensure the database connection is established
    await connectDB();

    // Create a new contact document
    const newContact = new Contact({
      name,
      email,
      message,
    });

    // Save the contact document to the database
    const result = await newContact.save();

    res
      .status(200)
      .json({ message: "Contact details submitted successfully.", result });
  } catch (error) {
    console.error("Error saving contact details:", error);
    res.status(500).json({
      error: "Failed to save contact details. Please try again later.",
    });
  }
});

export default router;
