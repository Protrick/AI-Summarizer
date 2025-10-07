chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(['ApiKey'], (result) => {
        if (!result.ApiKey) {
            chrome.tabs.create({ url: 'options.html' });
        }
    });
})