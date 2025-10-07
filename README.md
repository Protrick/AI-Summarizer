# AI Summarizer Chrome Extension

A Chrome extension that summarizes web page content using Google's Generative Language API (Gemini/PaLM).

## Features

- Extracts text from the active web page
- Generates concise summaries using AI
- Supports different summary types (brief, detailed, bullets)
- Fallback extraction for pages without content scripts
- Secure API key storage in Chrome storage

## Installation

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" in the top right.
4. Click "Load unpacked" and select the extension folder (`/path/to/Ai_Summarizer_extenction`).
5. The extension icon should appear in your toolbar.

## Setup

1. Get a Google Generative Language API key:

   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey) or Google Cloud Console.
   - Create a project and enable the Generative Language API.
   - Generate an API key.

2. Open the extension options:
   - Click the extension icon in the toolbar.
   - If prompted, it will open the options page automatically.
   - Enter your API key and click "Save".

## Usage

1. Navigate to any web page with text content.
2. Click the AI Summarizer extension icon in the toolbar.
3. Select a summary type from the dropdown (brief, detailed, bullets).
4. Click "Summarize" to generate the summary.
5. Use "Copy" to copy the summary to clipboard.

## Requirements

- Chrome browser (version 88+ for Manifest V3)
- Google Generative Language API key with access to models like `text-bison-001` or Gemini variants
- Internet connection for API calls

## Troubleshooting

- **API key not found**: Ensure you've saved the key in extension options.
- **404 Error**: The model may not be available for your API key. The extension falls back to `text-bison-001`.
- **No text extracted**: Some pages block content scripts; the extension uses a fallback method.
- **Icon not showing**: Ensure PNG icon files are present (icon16.png, etc.).

## Files

- `manifest.json`: Extension manifest
- `popup.html/js`: Extension popup UI and logic
- `content.js`: Content script for text extraction
- `background.js`: Background service worker
- `options.html/js`: Options page for API key
- `icon.jpg/png`: Extension icons

## License

This project is open-source. Feel free to modify and distribute.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss.
