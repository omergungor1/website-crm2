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

  const PANEL_LAYOUT_VERSION = 2;
  const EDGE_GAP = 20;
  const MINIMIZED_WIDTH = 240;
  const MINIMIZED_HEIGHT = 52;

  const initial = await send("GET_PANEL_STATE");
  let panelState = initial?.panelState || {
    open: true,
    minimized: false,
    x: null,
    y: 80,
    width: 380,
    height: 560,
    projectId: null,
    filter: defaultFilter,
  };
  if (panelState.layoutVersion !== PANEL_LAYOUT_VERSION) {
    panelState = {
      ...panelState,
      x: null,
      width: Math.max(panelState.width || 0, 380),
      height: Math.max(panelState.height || 0, 560),
      layoutVersion: PANEL_LAYOUT_VERSION,
    };
    send("SET_PANEL_STATE", { panelState });
  }
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
    const width = panelState.minimized ? MINIMIZED_WIDTH : panelState.width;
    const height = panelState.minimized
      ? MINIMIZED_HEIGHT
      : Math.min(panelState.height, window.innerHeight - EDGE_GAP * 2);
    const maxX = Math.max(EDGE_GAP, window.innerWidth - width - EDGE_GAP);
    const maxY = Math.max(EDGE_GAP, window.innerHeight - height - EDGE_GAP);
    const x = panelState.x == null ? maxX : Math.min(Math.max(EDGE_GAP, panelState.x), maxX);
    const y = Math.min(Math.max(EDGE_GAP, panelState.y ?? 80), maxY);

    root.style.left = `${x}px`;
    root.style.top = `${y}px`;
    root.style.width = `${width}px`;
    root.style.height = `${height}px`;
    root.style.display = panelState.open ? "block" : "none";
  }

  window.addEventListener("resize", applyGeometry);

  async function api(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (authSession?.access_token) {
      headers.Authorization = `Bearer ${authSession.access_token}`;
    }
    const res = await bgFetch(`${APP_ORIGIN}${path}`, { ...options, headers });
    if (!res.ok) throw new Error(res.data?.error || "İstek başarısız");
    return res.data;
  }

  async function bgFetch(url, { method = "GET", headers = {}, body } = {}) {
    const res = await send("API_FETCH", { request: { url, method, headers, body } });
    if (!res) throw new Error("Eklenti arka planına ulaşılamadı. Eklentiyi yeniden yükleyin.");
    return res;
  }

  async function login(email, password) {
    const res = await bgFetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });
    const data = res.data || {};
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
  let userMenuOpen = false;

  root.addEventListener("click", () => {
    if (!userMenuOpen) return;
    userMenuOpen = false;
    render();
  });
  window.addEventListener("click", (e) => {
    if (!userMenuOpen || e.composedPath().includes(hostEl)) return;
    userMenuOpen = false;
    render();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !userMenuOpen) return;
    userMenuOpen = false;
    render();
  });

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

  const FILTERS = [
    { id: "pending", label: "Bekleyen" },
    { id: "in_progress", label: "Devam" },
    { id: "completed", label: "Tamam" },
    { id: "all", label: "Tümü" },
  ];

  const PLATFORM_LABELS = {
    chatgpt: "ChatGPT",
    google_flow: "Google Flow",
    gemini: "Gemini",
    other: "Diğer",
  };

  const TYPE_LABELS = {
    free: "Serbest",
    post: "Post",
    story: "Story",
    carousel: "Carousel",
    video: "Video",
    ad: "Reklam",
  };

  const ICONS = {
    minimize: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg>`,
    expand: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4" /></svg>`,
    close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>`,
    refresh: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg>`,
    copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>`,
    user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>`,
    logout: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" /></svg>`,
    logo: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="4" /><circle cx="12" cy="12" r="3.2" /></svg>`,
  };

  function renderLogin() {
    const configMissing = !APP_ORIGIN || !SUPABASE_URL;
    return `
      <div class="ms-body">
        <div class="ms-hero">
          <div class="ms-hero-icon">${ICONS.logo}</div>
          <h3>Hesabına bağlan</h3>
          <p>Promptlarını görmek için Media Studio hesabınla giriş yap.</p>
        </div>
        <label class="ms-label" for="ms-email">E-posta</label>
        <input class="ms-input" id="ms-email" type="email" autocomplete="email" placeholder="ornek@mail.com" />
        <label class="ms-label" for="ms-password">Şifre</label>
        <input class="ms-input" id="ms-password" type="password" autocomplete="current-password" placeholder="••••••••" />
        <button class="ms-btn ms-primary ms-block" id="ms-login">Giriş yap</button>
        ${error ? `<div class="ms-alert ms-alert-error">${escapeHtml(error)}</div>` : ""}
        ${configMissing ? `<div class="ms-alert ms-alert-error">config.js eksik. Admin panelinden eklentiyi yeniden indir.</div>` : ""}
      </div>`;
  }

  function renderList() {
    const cards = prompts
      .map((p) => {
        const text = p.prompt_text || "";
        const preview = text.length > 220 ? `${text.slice(0, 220)}…` : text;
        const typeLabel = TYPE_LABELS[p.media_content_ideas?.content_type] || "";
        const platform = PLATFORM_LABELS[p.target_platform] || p.target_platform || "";
        return `
      <article class="ms-card">
        <div class="ms-card-head">
          <h4>${escapeHtml(p.title || "Prompt")}</h4>
          <span class="ms-seq">#${p.sequence_number || 1}</span>
        </div>
        <div class="ms-chips">
          ${platform ? `<span class="ms-chip">${escapeHtml(platform)}</span>` : ""}
          ${typeLabel ? `<span class="ms-chip">${escapeHtml(typeLabel)}</span>` : ""}
        </div>
        <p class="ms-preview">${escapeHtml(preview)}</p>
        <div class="ms-card-actions">
          <button class="ms-btn ms-primary" data-copy="${p.id}">${ICONS.copy}<span>Kopyala</span></button>
          <select class="ms-select ms-status" data-status="${p.id}" aria-label="Durum">
            <option value="pending" ${p.status === "pending" ? "selected" : ""}>Bekliyor</option>
            <option value="in_progress" ${p.status === "in_progress" ? "selected" : ""}>Devam ediyor</option>
            <option value="completed" ${p.status === "completed" ? "selected" : ""}>Tamamlandı</option>
            <option value="skipped" ${p.status === "skipped" ? "selected" : ""}>Atlandı</option>
          </select>
        </div>
      </article>`;
      })
      .join("");

    return `
      <div class="ms-toolbar">
        <div class="ms-project-row">
          <select class="ms-select ms-project" id="ms-project" aria-label="Proje">
            ${projects
              .map(
                (p) =>
                  `<option value="${p.id}" ${p.id === panelState.projectId ? "selected" : ""}>${escapeHtml(p.name)}</option>`
              )
              .join("")}
          </select>
          <button class="ms-icon-btn" id="ms-refresh" title="Yenile" aria-label="Yenile">${ICONS.refresh}</button>
        </div>
        <div class="ms-segment" role="tablist">
          ${FILTERS.map(
            (f) =>
              `<button class="ms-segment-btn ${panelState.filter === f.id ? "is-active" : ""}" data-filter="${f.id}" role="tab">${f.label}</button>`
          ).join("")}
        </div>
      </div>
      <div class="ms-body ms-list">
        ${notice ? `<div class="ms-toast">${escapeHtml(notice)}</div>` : ""}
        ${loading ? `<div class="ms-empty"><span class="ms-spinner"></span>Yükleniyor…</div>` : ""}
        ${!loading && !cards ? `<div class="ms-empty">Bu listede prompt yok.</div>` : cards}
        ${error ? `<div class="ms-alert ms-alert-error">${escapeHtml(error)}</div>` : ""}
      </div>
`;
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
    const connected = Boolean(authSession?.access_token);
    root.innerHTML = `
      <div class="ms-panel ${panelState.minimized ? "is-minimized" : ""}">
        <div class="ms-header" id="ms-drag">
          <div class="ms-brand">
            <span class="ms-brand-icon">${ICONS.logo}</span>
            <span class="ms-title">Media Studio</span>
            <span class="ms-status-dot ${connected ? "is-on" : ""}" title="${connected ? "Bağlı" : "Bağlı değil"}"></span>
          </div>
          <div class="ms-actions">
            ${
              connected && !panelState.minimized
                ? `<div class="ms-user-menu">
                <button class="ms-icon-btn ${userMenuOpen ? "is-active" : ""}" id="ms-user" title="Hesap" aria-label="Hesap" aria-haspopup="menu" aria-expanded="${userMenuOpen}">${ICONS.user}</button>
                ${
                  userMenuOpen
                    ? `<div class="ms-dropdown" role="menu">
                  <div class="ms-dropdown-head">
                    <span class="ms-avatar">${ICONS.user}</span>
                    <div class="ms-dropdown-info">
                      <span class="ms-dropdown-label">Giriş yapan</span>
                      <span class="ms-dropdown-email" title="${escapeHtml(authSession?.email || "")}">${escapeHtml(authSession?.email || "—")}</span>
                    </div>
                  </div>
                  <div class="ms-dropdown-sep"></div>
                  <button class="ms-dropdown-item is-danger" id="ms-logout" role="menuitem">${ICONS.logout}<span>Çıkış yap</span></button>
                </div>`
                    : ""
                }
              </div>`
                : ""
            }
            <button class="ms-icon-btn" id="ms-min" title="${panelState.minimized ? "Genişlet" : "Küçült"}" aria-label="${panelState.minimized ? "Genişlet" : "Küçült"}">${panelState.minimized ? ICONS.expand : ICONS.minimize}</button>
            <button class="ms-icon-btn" id="ms-close" title="Kapat (⌘⇧M ile aç)" aria-label="Kapat">${ICONS.close}</button>
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
    root.querySelector("#ms-user")?.addEventListener("click", (e) => {
      e.stopPropagation();
      userMenuOpen = !userMenuOpen;
      render();
    });
    root.querySelector(".ms-dropdown")?.addEventListener("click", (e) => e.stopPropagation());
    root.querySelector("#ms-logout")?.addEventListener("click", () => {
      userMenuOpen = false;
      logout();
    });
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
      if (e.target.closest("button")) return;
      const rect = root.getBoundingClientRect();
      panelState.x = rect.left;
      panelState.y = rect.top;
      dragging = true;
      ox = e.clientX - rect.left;
      oy = e.clientY - rect.top;
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
