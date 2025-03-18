/**
 * Smart Image Restoration Tool - Frontend Script
 * Handles user interactions and API communication
 * Privacy-focused - all data stored in localStorage only
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const uploadContainer = document.getElementById("upload-container");
  const uploadContent = document.getElementById("upload-content");
  const fileInput = document.getElementById("file-input");
  const previewContainer = document.getElementById("preview-container");
  const previewImage = document.getElementById("preview-image");
  const changePhotoBtn = document.getElementById("change-photo");
  const restorationBtns = document.querySelectorAll(".restoration-btn");
  const restoreBtn = document.getElementById("restore-btn");
  const resultSection = document.getElementById("result-section");
  const originalImage = document.getElementById("original-image");
  const resultImage = document.getElementById("result-image");
  const loader = document.getElementById("loader");
  const downloadBtn = document.getElementById("download-btn");
  const startOverBtn = document.getElementById("start-over-btn");
  const historyBtn = document.getElementById("history-btn");
  const historyModal = document.getElementById("history-modal");
  const closeModal = document.querySelector(".close-modal");
  const restorationGrid = document.getElementById("restoration-grid");

  // State variables
  let uploadedFile = null;
  let selectedMode = null;
  let restorations =
    JSON.parse(localStorage.getItem("smartImageRestorations")) || [];
  let currentOriginalUrl = null;
  let currentRestoreUrl = null;

  // Event Listeners

  // Upload Container Events
  uploadContainer.addEventListener("click", () => fileInput.click());

  uploadContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadContainer.style.borderColor = "var(--primary-color)";
    uploadContainer.style.backgroundColor = "rgba(106, 90, 205, 0.05)";
  });

  uploadContainer.addEventListener("dragleave", () => {
    uploadContainer.style.borderColor = "var(--gray-color)";
    uploadContainer.style.backgroundColor = "#fcfcfc";
  });

  uploadContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadContainer.style.borderColor = "var(--gray-color)";
    uploadContainer.style.backgroundColor = "#fcfcfc";

    if (e.dataTransfer.files.length) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length) {
      handleFileSelect(e.target.files[0]);
    }
  });

  // Change Photo Button
  changePhotoBtn.addEventListener("click", () => {
    resetUpload();
  });

  // Restoration Mode Buttons
  restorationBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      restorationBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedMode = btn.dataset.mode;
      updateRestoreButton();
    });
  });

  // Restore Button
  restoreBtn.addEventListener("click", restoreImage);

  // Download Button
  downloadBtn.addEventListener("click", () => {
    if (!currentRestoreUrl) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const link = document.createElement("a");
    link.href = currentRestoreUrl;
    link.download = `restored-image-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show download feedback
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
    setTimeout(() => {
      downloadBtn.innerHTML = originalText;
    }, 2000);
  });

  // Start Over Button
  startOverBtn.addEventListener("click", () => {
    resetAll();
  });

  // History Modal Functionality
  historyBtn.addEventListener("click", () => {
    updateHistoryGrid();
    historyModal.style.display = "block";
  });

  closeModal.addEventListener("click", () => {
    historyModal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === historyModal) {
      historyModal.style.display = "none";
    }
  });

  // Functions

  /**
   * Handle file selection from upload
   * @param {File} file - The uploaded file
   */
  function handleFileSelect(file) {
    // Validate file type and size
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      alert("Please upload a JPG, JPEG or PNG file.");
      return;
    }

    if (file.size > maxSize) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    uploadedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      uploadContainer.style.display = "none";
      previewContainer.style.display = "block";
      updateRestoreButton();
    };
    reader.readAsDataURL(file);
  }

  /**
   * Update restore button state based on inputs
   */
  function updateRestoreButton() {
    restoreBtn.disabled = !uploadedFile || !selectedMode;
  }

  /**
   * Reset the upload section
   */
  function resetUpload() {
    uploadedFile = null;
    fileInput.value = "";
    previewImage.src = "";
    uploadContainer.style.display = "block";
    previewContainer.style.display = "none";
    updateRestoreButton();
  }

  /**
   * Reset the entire form
   */
  function resetAll() {
    resetUpload();
    restorationBtns.forEach((btn) => btn.classList.remove("active"));
    selectedMode = null;
    resultSection.style.display = "none";
    resultImage.src = "";
    originalImage.src = "";
    currentOriginalUrl = null;
    currentRestoreUrl = null;
  }

  /**
   * Restore the image through API
   */
  async function restoreImage() {
    // Show loader and result section
    resultSection.style.display = "block";
    resultImage.style.display = "none";
    loader.style.display = "flex";

    // Save current preview for comparison
    currentOriginalUrl = previewImage.src;
    originalImage.src = currentOriginalUrl;

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);

      // Add restoration mode to form data
      formData.append("restorationMode", selectedMode);

      const response = await fetch("/api/restore", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        currentRestoreUrl = data.imageUrl;
        resultImage.src = currentRestoreUrl;

        resultImage.onload = () => {
          resultImage.style.display = "block";
          loader.style.display = "none";

          // Save to localStorage
          const newRestoration = {
            id: Date.now(),
            originalImageDataUrl: currentOriginalUrl,
            restoredImageUrl: currentRestoreUrl,
            restorationMode: selectedMode,
            timestamp: new Date().toISOString(),
          };

          restorations.unshift(newRestoration);
          // Keep only the last 20 restorations
          if (restorations.length > 20) {
            restorations = restorations.slice(0, 20);
          }

          localStorage.setItem(
            "smartImageRestorations",
            JSON.stringify(restorations),
          );
        };
      } else {
        throw new Error(data.error || "Failed to restore image");
      }
    } catch (error) {
      console.error("Error restoring image:", error);
      alert(`Error: ${error.message || "Failed to restore image"}`);
      loader.style.display = "none";
    }
  }

  /**
   * Get human-readable name for restoration mode
   * @param {string} mode - The restoration mode
   * @returns {string} - Human-readable mode name
   */
  function getRestorationModeName(mode) {
    switch (mode) {
      case "remove_distractions":
        return "Remove Distractions";
      case "fix_artifacts":
        return "Fix Visual Artifacts";
      case "enhance_clarity":
        return "Enhance Clarity";
      case "deep_restoration":
        return "Deep Restoration";
      default:
        return "Basic Restoration";
    }
  }

  /**
   * Update the history grid with saved restorations
   */
  function updateHistoryGrid() {
    restorationGrid.innerHTML = "";

    if (restorations.length === 0) {
      restorationGrid.innerHTML =
        '<p class="empty-history-message">You haven\'t restored any images yet.</p>';
      return;
    }

    restorations.forEach((item) => {
      const historyItem = document.createElement("div");
      historyItem.className = "history-item";

      const formattedDate = new Date(item.timestamp).toLocaleString();
      const modeName = getRestorationModeName(item.restorationMode);

      historyItem.innerHTML = `
        <div class="history-image-container">
          <img src="${item.restoredImageUrl}" alt="Restored image">
        </div>
        <div class="history-details">
          <p class="history-mode">${modeName}</p>
          <p class="history-date">${formattedDate}</p>
        </div>
        <div class="history-actions">
          <button class="history-download" data-url="${item.restoredImageUrl}" title="Download">
            <i class="fas fa-download"></i>
          </button>
          <button class="history-delete" data-id="${item.id}" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;

      restorationGrid.appendChild(historyItem);
    });

    // Add event listeners to history item buttons
    document.querySelectorAll(".history-download").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const imageUrl = btn.dataset.url;
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `restored-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    });

    document.querySelectorAll(".history-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const itemId = parseInt(btn.dataset.id);
        restorations = restorations.filter((item) => item.id !== itemId);
        localStorage.setItem(
          "smartImageRestorations",
          JSON.stringify(restorations),
        );
        updateHistoryGrid();
      });
    });

    // Make history items clickable to view full image
    document.querySelectorAll(".history-item").forEach((item, index) => {
      item.addEventListener("click", () => {
        const restoration = restorations[index];

        originalImage.src = restoration.originalImageDataUrl;
        resultImage.src = restoration.restoredImageUrl;
        currentOriginalUrl = restoration.originalImageDataUrl;
        currentRestoreUrl = restoration.restoredImageUrl;

        resultSection.style.display = "block";
        resultImage.style.display = "block";
        loader.style.display = "none";
        historyModal.style.display = "none";

        // Scroll to result section
        resultSection.scrollIntoView({ behavior: "smooth" });
      });
    });
  }
});
