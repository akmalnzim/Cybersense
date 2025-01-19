let intervalId;
let isActive = false;
let scannedWords = new Set(); // Store already-scanned words

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isActive: false, wordsScanned: 0, sensitiveWords: 0 });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start") {
    isActive = true;
    startAnalyzing();
  } else if (request.action === "stop") {
    isActive = false;
    stopAnalyzing();
  } else if (request.action === "getStatus") {
    chrome.storage.local.get(["isActive", "wordsScanned", "sensitiveWords"], (result) => {
      sendResponse(result);
    });
    return true; // Indicates that the response is asynchronous
  }
});

function startAnalyzing() {
  chrome.storage.local.set({ isActive: true });
  intervalId = setInterval(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          function: captureText,
        },
        async (results) => {
          if (results && results[0] && results[0].result) {
            const text = results[0].result;
            await analyzeText(text);
          }
        }
      );
    }
  }, 3000); // Set interval to 3 seconds
}

function stopAnalyzing() {
  clearInterval(intervalId);
  chrome.storage.local.set({ isActive: false, wordsScanned: 0, sensitiveWords: 0 });
  scannedWords.clear(); // Clear scanned words to reset state
}

function captureText() {
  return document.body.innerText;
}

async function analyzeText(text) {
  try {
    const words = text.split(/\s+/).filter((word) => word); // Split text into words and filter out empty strings

    let wordsScanned = 0;
    let sensitiveWords = 0;

    // Retrieve the current counts from storage
    const storage = await new Promise((resolve) => {
      chrome.storage.local.get(["wordsScanned", "sensitiveWords"], resolve);
    });

    wordsScanned = storage.wordsScanned || 0;
    sensitiveWords = storage.sensitiveWords || 0;

    // Local counters to track updates during this session
    let localWordsScanned = 0;
    let localSensitiveWords = 0;

    // Process words sequentially
    for (const word of words) {
      // Skip if the word has already been scanned
      if (scannedWords.has(word)) continue;

      // Add the word to the scanned set
      scannedWords.add(word);

      try {
        const response = await fetch("http://localhost:8000/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: word }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Word: ${word}, Class: ${data.class}`); // Debug log

        // Increment local counters
        localWordsScanned++;

        // Increment sensitive words count only if classified as sensitive
        if (data.class !== "not_cyberbullying") {
          localSensitiveWords++;
        }
      } catch (error) {
        console.error("Error fetching prediction for word:", word, error);
        // Continue processing other words even if one fails
      }
    }

    // Update the total counts in storage after all words are processed
    wordsScanned += localWordsScanned;
    sensitiveWords += localSensitiveWords;

    await new Promise((resolve) => {
      chrome.storage.local.set(
        { wordsScanned, sensitiveWords },
        resolve
      );
    });

    // Notify popup to update the UI with the new counts
    chrome.runtime.sendMessage({
      action: "updateCounts",
      wordsScanned,
      sensitiveWords,
    });
  } catch (error) {
    console.error("Error analyzing text:", error);
  }
}
