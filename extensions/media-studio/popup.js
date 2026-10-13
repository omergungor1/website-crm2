document.getElementById("open-docs")?.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("README.md") });
});
