
# Smart Image Restoration Tool

A web-based tool that uses Google's Generative AI (Gemini) to restore and enhance images by removing distractions, fixing artifacts, and improving overall clarity.

![image](https://github.com/user-attachments/assets/a4375eac-99d0-4716-a0f9-9fd59b30c554)


## Features

- **Multiple Restoration Modes:**
  - Remove Distractions
  - Fix Visual Artifacts
  - Enhance Clarity
  - Deep Restoration

- **Privacy-Focused:**
  - Images stored only in browser's localStorage
  - Server-side files automatically cleaned up
  - Temporary processing with secure handling

- **User-Friendly Interface:**
  - Drag & drop file upload
  - Real-time preview
  - Before/after comparison
  - Restoration history
  - One-click downloads

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- AI: Google Generative AI (Gemini)
- Storage: Browser localStorage

## Getting Started

1. Set up your environment variables:
   ```
   GEMINI_API_KEY=your_api_key_here
   PORT=3000
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open the application in your browser at `http://0.0.0.0:3000`

## Usage

1. Upload an image (JPG/JPEG/PNG, max 10MB)
2. Select a restoration mode
3. Click "Restore Image"
4. View and download the result
5. Access history through the "View History" button

## Privacy & Security

- Images are stored only in your browser's localStorage
- Server-side files are automatically deleted after processing
- No permanent storage of user data
- Secure handling of file uploads and processing
