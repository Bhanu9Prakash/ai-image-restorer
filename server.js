/**
 * Image Restoration Tool - Backend Server
 * Express server that handles image uploads and AI-powered restoration
 * Privacy-focused: No server-side storage of user images
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { restoreImage } = require("./utils/imageRestorer");
require("dotenv").config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  },
});

// Configure multer for file uploads
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Only JPG, JPEG, and PNG files are allowed"));
    }
    cb(null, true);
  },
});

// Serve static files from public directory
app.use(express.static("public"));
app.use(express.json());

// Create directories for results if they don't exist
const resultsDir = path.join(__dirname, "public", "results");
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// API endpoint for image restoration
app.post("/api/restore", upload.single("image"), async (req, res) => {
  try {
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    // Get restoration mode from request
    const { restorationMode } = req.body;

    if (!restorationMode) {
      return res.status(400).json({ error: "No restoration mode provided" });
    }

    // Set paths for input and output
    const imagePath = req.file.path;
    const outputFilename = `restored-${Date.now()}.png`;
    const outputPath = path.join(resultsDir, outputFilename);

    try {
      // Restore the image
      await restoreImage(imagePath, restorationMode, outputPath);

      // Return the URL to the restored image
      res.json({
        success: true,
        imageUrl: `/results/${outputFilename}`,
      });
    } catch (error) {
      console.error("Error processing request:", error);

      // Attempt to clean up any temporary files in case of error
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (cleanupError) {
        console.warn("Error cleaning up temp file:", cleanupError);
      }

      res.status(500).json({
        error: "Failed to process image",
        details: error.message,
      });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      error: "Failed to process image",
      details: error.message,
    });
  }
});

// Set a cleanup interval to remove old files (every hour)
setInterval(
  () => {
    try {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      // Clean up uploads directory
      if (fs.existsSync(path.join(__dirname, "uploads"))) {
        fs.readdirSync(path.join(__dirname, "uploads")).forEach((file) => {
          const filePath = path.join(__dirname, "uploads", file);
          const stats = fs.statSync(filePath);

          if (stats.mtimeMs < oneHourAgo) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up old upload: ${filePath}`);
          }
        });
      }

      // Clean up results directory
      if (fs.existsSync(resultsDir)) {
        fs.readdirSync(resultsDir).forEach((file) => {
          const filePath = path.join(resultsDir, file);
          const stats = fs.statSync(filePath);

          if (stats.mtimeMs < oneHourAgo) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up old result: ${filePath}`);
          }
        });
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  },
  60 * 60 * 1000,
); // Run every hour

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
