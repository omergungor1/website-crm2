export const CONTENT_TYPES = [
  { id: "free", label: "Serbest" },
  { id: "post", label: "Instagram Post" },
  { id: "story", label: "Story" },
  { id: "carousel", label: "Carousel" },
  { id: "video", label: "Video" },
  { id: "ad", label: "Reklam" },
];

export const IDEA_STATUSES = {
  draft: "Taslak",
  plan_ready: "Plan Hazır",
  ready: "Hazır",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  archived: "Arşivlendi",
};

export const PROMPT_STATUSES = {
  pending: "Bekliyor",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  skipped: "Atlandı",
};

export const TARGET_PLATFORMS = [
  { id: "chatgpt", label: "ChatGPT" },
  { id: "google_flow", label: "Google Flow" },
  { id: "gemini", label: "Gemini" },
  { id: "other", label: "Diğer" },
];

export const STUDIO_SECTIONS = [
  { id: "create", label: "İçerik Oluştur" },
  { id: "pending", label: "Bekleyenler" },
  { id: "in_progress", label: "Devam Edenler" },
  { id: "completed", label: "Tamamlananlar" },
  { id: "archive", label: "Arşiv" },
];

export function contentTypeLabel(type) {
  return CONTENT_TYPES.find((t) => t.id === type)?.label || type;
}

export function platformLabel(id) {
  return TARGET_PLATFORMS.find((t) => t.id === id)?.label || id;
}
