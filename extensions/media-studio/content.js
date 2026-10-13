(async function MediaStudioCompanion() {
  if (window.__mediaStudioLoaded) return;
  window.__mediaStudioLoaded = true;

  const configModuleUrl = chrome.runtime.getURL("config.js");
  let APP_ORIGIN = "";
  let SUPABASE_URL = "";
  let SUPABASE_ANON_KEY = "";
  try {
    const mod = await import(configModuleUrl);
    APP_ORIGIN = mod.APP_ORIGIN || "";
    SUPABASE_URL = mod.SUPABASE_URL || "";
    SUPABASE_ANON_KEY = mod.SUPABASE_ANON_KEY || "";
  } catch {
    // config eksik olabilir
  }

  const host = location.hostname;
  const defaultFilter =
    host.includes("gemini") || host.includes("labs.google") ? "pending" : "pending";

  const hostHint = host.includes("chatgpt") || host.includes("openai")
    ? "chatgpt"
    : host.includes("gemini")
      ? "gemini"
      : host.includes("labs.google")
        ? "google_flow"
        : "all";

  function send(type, payload = {}) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, ...payload }, resolve);
    });
  }

  const initial = await send("GET_PANEL_STATE");
  let panelState = initial?.panelState || {
    open: true,
    minimized: false,
    x: 24,
    y: 80,
    width: 360,
    height: 520,
    projectId: null,
    filter: defaultFilter,
  };
  let authSession = initial?.authSession || null;

  const hostEl = document.createElement("div");
  hostEl.id = "media-studio-root";
  document.documentElement.appendChild(hostEl);
  const shadow = hostEl.attachShadow({ mode: "open" });

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = chrome.runtime.getURL("panel.css");
  shadow.appendChild(style);

  const root = document.createElement("div");
  root.className = "ms-root";
  shadow.appendChild(root);

  function saveState() {
    send("SET_PANEL_STATE", { panelState });
  }

  function applyGeometry() {
    root.style.left = `${Math.max(8, panelState.x)}px`;
    root.style.top = `${Math.max(8, panelState.y)}px`;
    root.style.width = `${panelState.minimized ? 220 : panelState.width}px`;
    root.style.height = `${panelState.minimized ? 48 : panelState.height}px`;
    root.style.display = panelState.open ? "block" : "none";
  }

  async function api(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (authSession?.access_token) {
      headers.Authorization = `Bearer ${authSession.access_token}`;
    }
    const res = await fetch(`${APP_ORIGIN}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "İstek başarısız");
    return data;
  }

  async function login(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || "Giriş başarısız");
    authSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in || 3600) * 1000,
      email,
    };
    await send("SET_AUTH_SESSION", { authSession });
  }

  async function logout() {
    authSession = null;
    await send("CLEAR_AUTH_SESSION");
    render();
  }

  let projects = [];
  let prompts = [];
  let error = "";
  let loading = false;
  let notice = "";

  async function refreshData() {
    if (!authSession?.access_token || !APP_ORIGIN) return;
    loading = true;
    error = "";
    render();
    try {
      projects = await api("/api/media-studio/extension/projects");
      if (!panelState.projectId && projects[0]) {
        panelState.projectId = projects[0].id;
        saveState();
      }
      if (panelState.projectId) {
        const status = panelState.filter || "pending";
        prompts = await api(
          `/api/media-studio/extension/prompts?projectId=${panelState.projectId}&status=${status}`
        );
        if (hostHint !== "all") {
          prompts = prompts.filter(
            (p) => p.target_platform === hostHint || p.media_type === (hostHint === "chatgpt" ? "image" : "video") || true
          );
        }
      } else {
        prompts = [];
      }
    } catch (err) {
      error = err.message || "Veri alınamadı";
    } finally {
      loading = false;
      render();
    }
  }

  async function copyPrompt(text) {
    await navigator.clipboard.writeText(text || "");
    notice = "Prompt kopyalandı";
    render();
    setTimeout(() => {
      notice = "";
      render();
    }, 1200);
  }

  async function setStatus(id, status) {
    await api(`/api/media-studio/extension/prompts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await refreshData();
  }

  function renderLogin() {
    return `
      <div class="ms-body">
        <p class="ms-muted">Media Studio hesabınla giriş yap.</p>
        <label class="ms-muted">E-posta</label>
        <input class="ms-input" id="ms-email" type="email" />
        <label class="ms-muted">Şifre</label>
        <input class="ms-input" id="ms-password" type="password" />
        <div class="ms-row">
          <button class="ms-btn ms-primary" id="ms-login">Giriş yap</button>
        </div>
        ${error ? `<div class="ms-error">${error}</div>` : ""}
        ${!APP_ORIGIN || !SUPABASE_URL ? `<div class="ms-error">config.js eksik. Admin panelinden eklentiyi yeniden indirin.</div>` : ""}
      </div>`;
  }

  function renderList() {
    const cards = prompts
      .map(
        (p) => `
      <div class="ms-card">
        <h4>${escapeHtml(p.title || "Prompt")}</h4>
        <p class="ms-muted">#${p.sequence_number || 1} · ${escapeHtml(p.target_platform || "")} · ${escapeHtml(p.media_content_ideas?.content_type || "")}</p>
        <p>${escapeHtml((p.prompt_text || "").slice(0, 180))}${(p.prompt_text || "").length > 180 ? "…" : ""}</p>
        <div class="ms-row">
          <button class="ms-btn ms-primary" data-copy="${p.id}">Kopyala</button>
          <select class="ms-select" data-status="${p.id}" style="width:auto;margin-top:0">
            <option value="pending" ${p.status === "pending" ? "selected" : ""}>Bekliyor</option>
            <option value="in_progress" ${p.status === "in_progress" ? "selected" : ""}>Devam</option>
            <option value="completed" ${p.status === "completed" ? "selected" : ""}>Tamam</option>
            <option value="skipped" ${p.status === "skipped" ? "selected" : ""}>Atla</option>
          </select>
        </div>
      </div>`
      )
      .join("");

    return `
      <div class="ms-body">
        <div class="ms-row" style="justify-content:space-between;align-items:center">
          <select class="ms-select" id="ms-project" style="margin-top:0;flex:1">
            ${projects
              .map(
                (p) =>
                  `<option value="${p.id}" ${p.id === panelState.projectId ? "selected" : ""}>${escapeHtml(p.name)}</option>`
              )
              .join("")}
          </select>
          <button class="ms-btn" id="ms-refresh">Yenile</button>
        </div>
        <div class="ms-row">
          ${["pending", "in_progress", "completed", "all"]
            .map(
              (f) =>
                `<button class="ms-btn ${panelState.filter === f ? "ms-primary" : ""}" data-filter="${f}">${f}</button>`
            )
            .join("")}
        </div>
        ${notice ? `<div class="ms-success">${notice}</div>` : ""}
        ${loading ? `<p class="ms-muted">Yükleniyor…</p>` : ""}
        ${!loading && !cards ? `<p class="ms-muted">Prompt yok.</p>` : cards}
        ${error ? `<div class="ms-error">${error}</div>` : ""}
        <div class="ms-row"><button class="ms-btn" id="ms-logout">Çıkış</button></div>
      </div>`;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    applyGeometry();
    root.innerHTML = `
      <div class="ms-panel">
        <div class="ms-header" id="ms-drag">
          <div class="ms-title">Media Studio</div>
          <div class="ms-actions">
            <button id="ms-min">${panelState.minimized ? "▣" : "—"}</button>
            <button id="ms-close">✕</button>
          </div>
        </div>
        ${
          panelState.minimized
            ? ""
            : authSession?.access_token
              ? renderList()
              : renderLogin()
        }
      </div>`;

    root.querySelector("#ms-min")?.addEventListener("click", () => {
      panelState.minimized = !panelState.minimized;
      saveState();
      render();
    });
    root.querySelector("#ms-close")?.addEventListener("click", () => {
      panelState.open = false;
      saveState();
      render();
    });
    root.querySelector("#ms-login")?.addEventListener("click", async () => {
      error = "";
      try {
        const email = root.querySelector("#ms-email")?.value || "";
        const password = root.querySelector("#ms-password")?.value || "";
        await login(email, password);
        await refreshData();
      } catch (err) {
        error = err.message;
        render();
      }
    });
    root.querySelector("#ms-logout")?.addEventListener("click", logout);
    root.querySelector("#ms-refresh")?.addEventListener("click", refreshData);
    root.querySelector("#ms-project")?.addEventListener("change", async (e) => {
      panelState.projectId = e.target.value;
      saveState();
      await refreshData();
    });
    root.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        panelState.filter = btn.getAttribute("data-filter");
        saveState();
        await refreshData();
      });
    });
    root.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-copy");
        const prompt = prompts.find((p) => p.id === id);
        if (prompt) copyPrompt(prompt.prompt_text);
      });
    });
    root.querySelectorAll("[data-status]").forEach((sel) => {
      sel.addEventListener("change", async () => {
        await setStatus(sel.getAttribute("data-status"), sel.value);
      });
    });

    const drag = root.querySelector("#ms-drag");
    let dragging = false;
    let ox = 0;
    let oy = 0;
    drag?.addEventListener("pointerdown", (e) => {
      dragging = true;
      ox = e.clientX - panelState.x;
      oy = e.clientY - panelState.y;
      drag.setPointerCapture(e.pointerId);
    });
    drag?.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      panelState.x = e.clientX - ox;
      panelState.y = e.clientY - oy;
      applyGeometry();
    });
    drag?.addEventListener("pointerup", () => {
      dragging = false;
      saveState();
    });
  }

  // reopen via keyboard
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "m") {
      panelState.open = !panelState.open;
      saveState();
      render();
    }
  });

  render();
  if (authSession?.access_token) refreshData();
})();
