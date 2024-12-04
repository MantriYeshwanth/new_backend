import express from "express";
import bcrypt from "bcrypt";
import connectDB from "./db.js"; // Import the shared Mongoose connection
import mongoose from "mongoose";

const router = express.Router();

// Ensure the database is connected
await connectDB();

// Define the User schema and model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Use Mongoose's default connection for the model
const User = mongoose.models.User || mongoose.model("User", userSchema);

// Login route
router.post("/", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email in the shared database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Send the response back to the client
    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
