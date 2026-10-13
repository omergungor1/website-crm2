chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["panelState"], (result) => {
    if (!result.panelState) {
      chrome.storage.local.set({
        panelState: {
          open: true,
          minimized: false,
          x: 24,
          y: 80,
          width: 360,
          height: 520,
          projectId: null,
          filter: "pending",
        },
      });
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_PANEL_STATE") {
    chrome.storage.local.get(["panelState", "authSession"], (result) => {
      sendResponse(result);
    });
    return true;
  }
  if (message?.type === "SET_PANEL_STATE") {
    chrome.storage.local.set({ panelState: message.panelState }, () => sendResponse({ ok: true }));
    return true;
  }
  if (message?.type === "SET_AUTH_SESSION") {
    chrome.storage.local.set({ authSession: message.authSession }, () => sendResponse({ ok: true }));
    return true;
  }
  if (message?.type === "CLEAR_AUTH_SESSION") {
    chrome.storage.local.remove(["authSession"], () => sendResponse({ ok: true }));
    return true;
  }
  return false;
});
