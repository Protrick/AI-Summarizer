// document.getElementById("summarize").addEventListener("click", async () => {
//   const resultDiv = document.getElementById("result");

//   // support different id conventions and avoid null .value access
//   const summaryEl =
//     document.getElementById("summary-type") ||
//     document.getElementById("Summary_type") ||
//     document.getElementById("summaryType");
//   const summaryType = summaryEl ? summaryEl.value : "brief";

//   // Get API key from storage
//   chrome.storage.sync.get(["geminiApiKey"], async (result) => {
//     if (!result.geminiApiKey) {
//       resultDiv.innerHTML =
//         "API key not found. Please set your API key in the extension options.";
//       return;
//     }

//     chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
//       chrome.tabs.sendMessage(
//         tab.id,
//         { type: "GET_ARTICLE_TEXT" },
//         async (res) => {
//           if (!res || !res.text) {
//             resultDiv.innerText =
//               "Could not extract article text from this page.";
//             return;
//           }

//           try {
//             const summary = await getGeminiSummary(
//               res.text,
//               summaryType,
//               result.geminiApiKey
//             );
//             resultDiv.innerText = summary;
//           } catch (error) {
//             resultDiv.innerText = `Error: ${
//               error.message || "Failed to generate summary."
//             }`;
//           }
//         }
//       );
//     });
//   });
// });

// document.getElementById("copy").addEventListener("click", () => {
//   const summaryText = document.getElementById("result").innerText;

//   if (summaryText && summaryText.trim() !== "") {
//     navigator.clipboard
//       .writeText(summaryText)
//       .then(() => {
//         const copyBtn = document.getElementById("copy");
//         const originalText = copyBtn.innerText;

//         copyBtn.innerText = "Copied!";
//         setTimeout(() => {
//           copyBtn.innerText = originalText;
//         }, 2000);
//       })
//       .catch((err) => {
//         console.error("Failed to copy text: ", err);
//       });
//   }
// });

// async function getGeminiSummary(text, summaryType, apiKey) {
//   // Truncate very long texts to avoid API limits (typically around 30K tokens)
//   const maxLength = 20000;
//   const truncatedText =
//     text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

//   let prompt;
//   switch (summaryType) {
//     case "brief":
//       prompt = `Provide a brief summary of the following article in 2-3 sentences:\n\n${truncatedText}`;
//       break;
//     case "detailed":
//       prompt = `Provide a detailed summary of the following article, covering all main points and key details:\n\n${truncatedText}`;
//       break;
//     default:
//       prompt = `Summarize the following article:\n\n${truncatedText}`;
//   }

//   try {
//     const res = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           contents: [
//             {
//               parts: [{ text: prompt }],
//             },
//           ],
//           generationConfig: {
//             temperature: 0.2,
//           },
//         }),
//       }
//     );

//     if (!res.ok) {
//       const errorData = await res.json();
//       throw new Error(errorData.error?.message || "API request failed");
//     }

//     const data = await res.json();
//     return (
//       data?.candidates?.[0]?.content?.parts?.[0]?.text ||
//       "No summary available."
//     );
//   } catch (error) {
//     console.error("Error calling Gemini API:", error);
//     throw new Error("Failed to generate summary. Please try again later.");
//   }
// }

// popup.js - simple, complete implementation

const resultEl = document.getElementById("result");
const summarizeBtn = document.getElementById("summarize");
const copyBtn = document.getElementById("copy");
const summarySelect = document.getElementById("Summary_type"); // matches popup.html

function getApiKey() {
  return new Promise((res) =>
    chrome.storage.sync.get(["ApiKey"], (items) => res(items.ApiKey))
  );
}

function queryActiveTab() {
  return new Promise((res) =>
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) =>
      res(tabs && tabs[0])
    )
  );
}

function sendMessageToTab(tabId, message) {
  return new Promise((res) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError)
        return res({ error: chrome.runtime.lastError.message });
      return res({ response });
    });
  });
}

function execExtractionInPage(tabId) {
  return chrome.scripting
    .executeScript({
      target: { tabId },
      func: () => {
        const article = document.querySelector("article");
        if (article) return article.innerText;
        const paragraphs = Array.from(document.querySelectorAll("p"));
        return paragraphs.map((p) => p.innerText).join("\n");
      },
    })
    .then((results) =>
      results && results[0] && results[0].result ? results[0].result : null
    );
}

async function extractArticleText(tab) {
  // try content script first
  const msg = await sendMessageToTab(tab.id, { type: "getArticleText" });
  if (msg.error || !msg.response || !msg.response.articleText) {
    // fallback: run extraction via scripting.executeScript
    try {
      const extracted = await execExtractionInPage(tab.id);
      return extracted || null;
    } catch (e) {
      return null;
    }
  }
  return msg.response.articleText;
}

async function callTextModel(articleText, summaryType, apiKey) {
  const maxChars = 20000;
  const safeText =
    articleText.length > maxChars
      ? articleText.slice(0, maxChars)
      : articleText;

  let prompt;
  if (summaryType === "detailed") {
    prompt = `Provide a detailed summary of the following article, covering the main points and key details:\n\n${safeText}`;
  } else if (summaryType === "bullets") {
    prompt = `Summarize the following article in 5 concise bullet points (each starting with '- '):\n\n${safeText}`;
  } else {
    prompt = `Provide a concise summary of the following article in 2-3 sentences:\n\n${safeText}`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "No body");
    throw new Error(`API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();

  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "No summary returned."
  );
}


summarizeBtn.addEventListener("click", async () => {
  resultEl.textContent = "Extracting...";

  const apiKey = await getApiKey();
  if (!apiKey) {
    resultEl.textContent = "API key missing — opening options...";
    // Try to open the extension options so the user can set the key, then close the popup.
    try {
      if (chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage(() => {
          try {
            window.close();
          } catch (e) {
            /* ignore */
          }
        });
      } else if (chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create(
          { url: chrome.runtime.getURL("options.html") },
          () => {
            try {
              window.close();
            } catch (e) {
              /* ignore */
            }
          }
        );
      }
    } catch (e) {
      // If opening options fails, leave the message visible so user knows what to do.
      console.error("Failed to open options page:", e);
    }
    return;
  }

  const tab = await queryActiveTab();
  if (!tab || !tab.id) {
    resultEl.textContent = "No active tab.";
    return;
  }

  const articleText = await extractArticleText(tab);
  if (!articleText) {
    resultEl.textContent = "Could not extract article text from this page.";
    return;
  }

  resultEl.textContent = "Summarizing...";
  const summaryType =
    summarySelect && summarySelect.value ? summarySelect.value : "brief";

  try {
    const summary = await callTextModel(articleText, summaryType, apiKey);
    resultEl.textContent = summary || "No summary returned.";
  } catch (err) {
    resultEl.textContent = `Error: ${
      err.message || "Failed to generate summary"
    }`;
  }
});

copyBtn.addEventListener("click", () => {
  const text = resultEl.innerText || "";
  if (!text.trim()) return;
  navigator.clipboard.writeText(text).catch(() => {
    /* ignore */
  });
});
