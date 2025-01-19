document.addEventListener('DOMContentLoaded', () => {
  // Elements for the toggle and word counts
  const toggle = document.getElementById('toggle');
  const wordsScannedElem = document.getElementById('words-scanned');
  const sensitiveWordsElem = document.getElementById('sensitive-words');

  // Elements for settings panel and navigation
  const settingsIcon = document.querySelector(".settings-icon");
  const settingsPanel = document.getElementById("settings-container");
  const backButton = document.getElementById("back-btn");
  const navItems = document.querySelectorAll(".nav-item");

  // Chrome runtime messages for toggle functionality
  chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
    toggle.checked = response.isActive;
    wordsScannedElem.innerText = response.wordsScanned;
    sensitiveWordsElem.innerText = response.sensitiveWords;
  });

  toggle.addEventListener('change', (event) => {
    if (event.target.checked) {
      chrome.runtime.sendMessage({ action: "start" });
    } else {
      chrome.runtime.sendMessage({ action: "stop" });
    }
  });

  // Listen for updates from the background script
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "updateCounts") {
      wordsScannedElem.innerText = request.wordsScanned;
      sensitiveWordsElem.innerText = request.sensitiveWords;
    }
  });

  // Show the settings panel when clicking the ⚙ icon
  settingsIcon.addEventListener("click", () => {
    settingsPanel.style.display = "flex"; // Show settings
  });

  // Hide the settings panel when clicking the back button
  backButton.addEventListener("click", () => {
    settingsPanel.style.display = "none"; // Hide settings
  });
});