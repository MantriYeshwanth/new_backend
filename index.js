import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { fetchAllReviews } from "./Crawler.js";
import axios from "axios";
import contactRoutes from "./contactRoutes.js";
import authRoutes from "./authRoutes.js";
import loginRoutes from "./login.js";
import dotenv from "dotenv";
import connectDB from "./db.js";
import Review from "./models/Review.js"; // Import the Mongoose model for ReviewBOT collection

dotenv.config();

// Connect to MongoDB using the shared connection from db.js
connectDB();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

// Define routes
app.use("/api/contact", contactRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/login", loginRoutes);

// Flask server URL
const flaskUrl = "https://708b-34-75-36-186.ngrok-free.app/process"; // Replace with your Flask server URL

// Route to handle product name and fetch reviews
app.post("/send-reviews", async (req, res) => {
  const productName = req.body.productName;

  if (!productName) {
    return res.status(400).send("No product name provided");
  }

  try {
    const reviews = await Review.find({ name: productName }); // Use Mongoose to query the collection

    if (reviews.length === 0) {
      return res.status(404).send("No reviews found for this product");
    }

    const concatenatedReviews = reviews
      .map((review) => review.review)
      .join(" ");

    const flaskResponse = await axios.post(flaskUrl, {
      product_data: concatenatedReviews,
    });

    if (flaskResponse.status === 200) {
      res.json({
        message: "Reviews processed successfully and sent to Flask",
        flaskResponse: flaskResponse.data,
      });
    } else {
      res
        .status(flaskResponse.status)
        .send("Error processing data with Flask server");
    }
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).send("Error fetching reviews");
  }
});

// Route to get all product information
app.get("/prods", async (req, res) => {
  try {
    const products = await Review.find().distinct("name"); // Get unique product names

    if (products.length === 0) {
      return res.status(404).send("No products found");
    }

    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Error fetching products");
  }
});

// Route to scrape reviews for a product
app.post("/search", async (req, res) => {
  const { productUrl } = req.body;

  if (!productUrl) {
    return res.status(400).json({ error: "Product URL is required." });
  }

  try {
    const reviews = await fetchAllReviews(productUrl, 100);
    const concatenatedReviews = reviews
      .map((review) => review.reviewText)
      .join(" ");

    const flaskResponse = await axios.post(flaskUrl, {
      product_data: concatenatedReviews,
    });

    if (flaskResponse.status === 200) {
      res.json({
        message: "Reviews processed successfully and sent to Flask",
        flaskResponse: flaskResponse.data,
      });
    } else {
      res
        .status(flaskResponse.status)
        .send("Error processing data with Flask server");
    }
  } catch (error) {
    console.error("Error in /search route:", error);
    res.status(500).json({ error: "Failed to fetch reviews." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
