import { APP_ORIGIN, SUPABASE_URL } from "./config.js";

const ALLOWED_ORIGINS = [APP_ORIGIN, SUPABASE_URL]
  .filter(Boolean)
  .map((url) => new URL(url).origin);

async function proxyFetch({ url, method = "GET", headers = {}, body }) {
  let target;
  try {
    target = new URL(url);
  } catch {
    return { ok: false, status: 0, data: { error: "Geçersiz URL" } };
  }
  if (!ALLOWED_ORIGINS.includes(target.origin)) {
    return { ok: false, status: 0, data: { error: "İzin verilmeyen adres" } };
  }
  try {
    const res = await fetch(target.href, { method, headers, body });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { error: err?.message || "Ağ hatası" } };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["panelState"], (result) => {
    if (!result.panelState) {
      chrome.storage.local.set({
        panelState: {
          open: true,
          minimized: false,
          x: null,
          y: 80,
          width: 380,
          height: 560,
          projectId: null,
          filter: "pending",
          layoutVersion: 2,
        },
      });
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "API_FETCH") {
    proxyFetch(message.request || {}).then(sendResponse);
    return true;
  }
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
