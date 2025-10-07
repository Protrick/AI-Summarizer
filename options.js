document.addEventListener("DOMContentLoaded", () => {
  // Load saved API key if it exists (stored under 'ApiKey')
  chrome.storage.sync.get(["ApiKey"], (result) => {
    if (result.ApiKey) {
      document.getElementById("geminiApiKey").value = result.ApiKey;
    }
  });

  // Save API key when button is clicked
  document.getElementById("saveBtn").addEventListener("click", () => {
    const apiKey = document.getElementById("geminiApiKey").value.trim();

    if (apiKey) {
      // store under 'ApiKey' so popup.js can read it
      chrome.storage.sync.set({ ApiKey: apiKey }, () => {
        const successMessage = document.getElementById("success-message");
        successMessage.style.display = "block";

        // Close the tab after a short delay to show the success message
        setTimeout(() => {
          window.close();
          // For cases where window.close() doesn't work (like when opened programmatically)
          chrome.tabs.getCurrent((tab) => {
            if (tab) {
              chrome.tabs.remove(tab.id);
            }
          });
        }, 1000);
      });
    }
  });
});
