export async function fetchTasks(params = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.planned_date) qs.set("planned_date", params.planned_date);
  if (params.is_today_plan) qs.set("is_today_plan", "1");
  if (params.include_archive) qs.set("include_archive", "1");
  const res = await fetch(`/api/deep-work/tasks?${qs}`);
  if (!res.ok) throw new Error("Görevler yüklenemedi");
  return res.json();
}

export async function createTask(payload) {
  const res = await fetch("/api/deep-work/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Görev eklenemedi");
  return data;
}

export async function updateTask(id, payload) {
  const res = await fetch(`/api/deep-work/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Güncellenemedi");
  return data;
}

export async function deleteTask(id) {
  const res = await fetch(`/api/deep-work/tasks/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Silinemedi");
  }
}

export async function moveTask(payload) {
  const res = await fetch("/api/deep-work/tasks/move", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Taşınamadı");
  return data;
}

export async function fetchBoard(params = {}) {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  const suffix = qs.toString() ? `?${qs}` : "";
  const res = await fetch(`/api/deep-work/board${suffix}`);
  if (!res.ok) throw new Error("Board yüklenemedi");
  return res.json();
}

export async function moveBoardTodo(payload) {
  const res = await fetch("/api/deep-work/board/move", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Taşınamadı");
  return data;
}

export async function fetchActiveSession() {
  const res = await fetch("/api/deep-work/sessions?active=1");
  if (!res.ok) return null;
  return res.json();
}

export async function startSession(payload = {}) {
  const body =
    typeof payload === "string" || typeof payload === "number"
      ? { task_id: payload, session_type: "focus" }
      : payload;

  const res = await fetch("/api/deep-work/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Oturum başlatılamadı");
  return data;
}

export async function patchSession(sessionId, action) {
  const res = await fetch(`/api/deep-work/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Oturum güncellenemedi");
  return data;
}

export async function stopSession(sessionId) {
  return patchSession(sessionId, "stop");
}

export async function pauseSession(sessionId) {
  return patchSession(sessionId, "pause");
}

export async function resumeSession(sessionId) {
  return patchSession(sessionId, "resume");
}

export async function resetSession(sessionId) {
  return patchSession(sessionId, "reset");
}

export async function fetchSettings() {
  const res = await fetch("/api/deep-work/settings");
  if (!res.ok) throw new Error("Ayarlar yüklenemedi");
  return res.json();
}

export async function saveSettings(payload) {
  const res = await fetch("/api/deep-work/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Kaydedilemedi");
  return data;
}

export async function fetchStats() {
  const res = await fetch("/api/deep-work/stats");
  if (!res.ok) throw new Error("İstatistikler yüklenemedi");
  return res.json();
}

export async function fetchReview(date) {
  const res = await fetch(`/api/deep-work/daily-reviews?date=${date}`);
  if (!res.ok) throw new Error("Değerlendirme yüklenemedi");
  return res.json();
}

export async function saveReview(payload) {
  const res = await fetch("/api/deep-work/daily-reviews", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Kaydedilemedi");
  return data;
}

export async function fetchProjects() {
  const res = await fetch("/api/projects");
  if (!res.ok) return [];
  return res.json();
}
