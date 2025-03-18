/**
 * Smart Image Restoration Utility
 * Uses Google Generative AI to restore and enhance images
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Restore and enhance an image by removing distractions and visual artifacts
 * @param {string} inputImagePath - Path to the uploaded image
 * @param {string} restorationMode - Type of restoration to perform
 * @param {string} outputPath - Path to save the enhanced image
 * @returns {Promise<string>} - Path to the restored image
 */
async function restoreImage(inputImagePath, restorationMode, outputPath) {
  try {
    // Read the input image as base64
    const imageData = fs.readFileSync(inputImagePath);
    const imageBase64 = imageData.toString("base64");
    const mimeType = getMimeType(inputImagePath);

    // Select the appropriate prompt based on restoration mode
    const enhancedPrompt = createRestorationPrompt(restorationMode);

    // Initialize the model with image generation capabilities
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: ["Text", "Image"],
        temperature: 0.4, // Lower temperature for more precise results
        topP: 1,
        topK: 32,
      },
    });

    // Create prompt parts with the image
    const promptParts = [
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
      { text: enhancedPrompt },
    ];

    // Log the process step
    console.log(`Restoring image using mode: "${restorationMode}"`);

    // Generate the restored image
    const response = await model.generateContent(promptParts);

    // Process the response
    let imageGenerated = false;

    for (const part of response.response.candidates[0].content.parts) {
      if (part.inlineData) {
        const generatedImageData = part.inlineData.data;
        const buffer = Buffer.from(generatedImageData, "base64");
        fs.writeFileSync(outputPath, buffer);
        imageGenerated = true;
        console.log(`Image successfully restored and saved to ${outputPath}`);
      } else if (part.text) {
        console.log("AI response text:", part.text);
      }
    }

    if (!imageGenerated) {
      throw new Error("No image was generated in the response");
    }

    // Clean up the uploaded image after processing (for privacy)
    try {
      fs.unlinkSync(inputImagePath);
      console.log(`Cleaned up uploaded file: ${inputImagePath}`);
    } catch (cleanupError) {
      console.warn(
        `Warning: Could not delete temporary file: ${inputImagePath}`,
        cleanupError,
      );
    }

    return outputPath;
  } catch (error) {
    console.error("Error restoring image:", error);
    throw error;
  }
}

/**
 * Create a restoration prompt based on the selected mode
 * @param {string} mode - The restoration mode
 * @returns {string} - Detailed prompt for image restoration
 */
function createRestorationPrompt(mode) {
  const basePrompt =
    "Generate a restored version of this image that maintains all the important content but";

  switch (mode) {
    case "remove_distractions":
      return `${basePrompt} removes all distracting visual elements, text overlays, and unnecessary markings. 
      Focus on making the image look clean and professional as if it was originally captured without any visual noise or overlays.
      Preserve the original subject, colors, and composition but eliminate any visual elements that appear artificially added.
      Ensure the restored areas blend naturally with the surrounding image content.`;

    case "fix_artifacts":
      return `${basePrompt} fixes any visual artifacts, text overlays, or markings that detract from the image quality.
      Remove any artificial elements including graphical overlays, visible stamps, or repeating patterns that appear to be added after the image was taken.
      Reconstruct the underlying image content naturally to match the surrounding areas in texture and color.
      The final result should look like a clean, professional photograph without any post-capture additions.`;

    case "enhance_clarity":
      return `${basePrompt} enhances overall clarity by removing any noise, text elements, or visual distractions.
      Remove anything that appears superimposed on the original photograph, including text, logos, or semi-transparent elements.
      Seamlessly restore any areas that were covered by visual noise or add-ons, maintaining consistent lighting and texture.
      The result should appear as a pristine version of the original photograph with no extraneous elements.`;

    case "deep_restoration":
      return `${basePrompt} performs a complete restoration by removing all non-original elements from the image.
      Eliminate any and all artificially added elements, including text overlays, logos, stamps, graphical elements, or repetitive patterns.
      Perfectly reconstruct the underlying image content where these elements were present, ensuring natural continuation of textures, colors, and patterns.
      Make the image look completely natural as if nothing was ever added to the original photograph.
      Pay special attention to corner elements and semi-transparent overlays, ensuring they are completely removed.`;

    default:
      return `${basePrompt} improves the overall quality by removing distractions and enhancing clarity.
      Remove any elements that appear to be artificially added to the original photograph.
      Restore the image to how it would have looked if captured without any post-processing additions.`;
  }
}

/**
 * Get the MIME type based on the file extension
 * @param {string} filePath - Path to the file
 * @returns {string} - MIME type
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}

module.exports = { restoreImage };
