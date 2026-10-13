"use client";

import { useEffect, useState } from "react";
import { ms } from "./theme";

const COLOR_LABELS = {
  primary: "Ana",
  secondary: "İkincil",
  accent: "Vurgu",
  background: "Arka plan",
  text: "Metin",
};

const CONTACT_FIELDS = [
  { key: "website", label: "Web sitesi / domain", placeholder: "ornek.com" },
  { key: "instagram", label: "Instagram", placeholder: "@kullaniciadi" },
  { key: "tiktok", label: "TikTok", placeholder: "@kullaniciadi" },
  { key: "x", label: "X (Twitter)", placeholder: "@kullaniciadi" },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/company/…" },
  { key: "youtube", label: "YouTube", placeholder: "@kanal" },
  { key: "facebook", label: "Facebook", placeholder: "facebook.com/…" },
  { key: "phone", label: "Telefon", placeholder: "+90 5xx xxx xx xx" },
  { key: "email", label: "E-posta", placeholder: "info@ornek.com" },
];

const EMPTY = {
  display_name: "",
  colors: {
    primary: "#365CFF",
    secondary: "#101828",
    accent: "#8EE3CF",
    background: "#FFFFFF",
    text: "#111827",
  },
  tone: "",
  personality: "",
  visual_style: "",
  slogan: "",
  keywords: "",
  prohibited_terms: "",
  guidelines: "",
  contact: {},
};

export default function BrandKitSection({ projectId, projectName }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/media-studio/brand-kit`);
        const data = await res.json();
        if (cancelled) return;
        if (data && !data.error) {
          setForm({
            display_name: data.display_name || projectName || "",
            colors: { ...EMPTY.colors, ...(data.colors || {}) },
            tone: data.tone || "",
            personality: data.personality || "",
            visual_style: data.visual_style || "",
            slogan: data.slogan || "",
            keywords: Array.isArray(data.keywords) ? data.keywords.join(", ") : "",
            prohibited_terms: Array.isArray(data.prohibited_terms)
              ? data.prohibited_terms.join(", ")
              : "",
            guidelines: data.guidelines || "",
            contact: data.contact || {},
          });
        } else {
          setForm({ ...EMPTY, display_name: projectName || "" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, projectName]);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const setColor = (key, value) => setForm((p) => ({ ...p, colors: { ...p.colors, [key]: value } }));
  const setContact = (key) => (e) =>
    setForm((p) => ({ ...p, contact: { ...p.contact, [key]: e.target.value } }));

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: "", ok: true });
    const res = await fetch(`/api/projects/${projectId}/media-studio/brand-kit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: form.display_name.trim() || null,
        colors: form.colors,
        tone: form.tone.trim() || null,
        personality: form.personality.trim() || null,
        visual_style: form.visual_style.trim() || null,
        slogan: form.slogan.trim() || null,
        keywords: form.keywords.split(",").map((s) => s.trim()).filter(Boolean),
        prohibited_terms: form.prohibited_terms.split(",").map((s) => s.trim()).filter(Boolean),
        guidelines: form.guidelines.trim() || null,
        contact: form.contact,
      }),
    });
    const data = await res.json();
    setSaving(false);
    setMsg({ text: res.ok ? "Marka kiti kaydedildi" : data.error || "Hata oluştu", ok: res.ok });
    if (res.ok) setTimeout(() => setMsg({ text: "", ok: true }), 3000);
  }

  if (loading) {
    return <div className={`${ms.card} text-center ${ms.muted}`}>Marka kiti yükleniyor…</div>;
  }

  return (
    <form onSubmit={handleSave} className={`${ms.card} space-y-6`}>
      <div>
        <h3 className={ms.title}>Marka Kiti</h3>
        <p className={`mt-1 ${ms.muted}`}>Media Studio prompt üretiminde otomatik kullanılır.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={ms.label}>Marka adı</span>
          <input className={ms.input} value={form.display_name} onChange={set("display_name")} />
        </label>
        <label className="block">
          <span className={ms.label}>Slogan</span>
          <input className={ms.input} value={form.slogan} onChange={set("slogan")} />
        </label>
      </div>

      <div>
        <span className={ms.label}>Renkler</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {Object.entries(form.colors).map(([key, value]) => (
            <label
              key={key}
              className="flex items-center gap-2 rounded-full bg-[#f4f4f4] p-1.5 pr-3 dark:bg-[#212121]"
            >
              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10 dark:ring-white/15">
                <input
                  type="color"
                  value={value || "#000000"}
                  onChange={(e) => setColor(key, e.target.value)}
                  className="absolute -inset-2 h-12 w-12 cursor-pointer border-0 p-0"
                />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] text-[#5d5d5d] dark:text-[#b4b4b4]">
                  {COLOR_LABELS[key] || key}
                </span>
                <input
                  value={value || ""}
                  onChange={(e) => setColor(key, e.target.value)}
                  className="w-full bg-transparent font-mono text-xs text-[#0d0d0d] outline-none dark:text-[#ececec]"
                />
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={ms.label}>Ton</span>
          <input className={ms.input} value={form.tone} onChange={set("tone")} placeholder="Modern, samimi…" />
        </label>
        <label className="block">
          <span className={ms.label}>Kişilik</span>
          <input className={ms.input} value={form.personality} onChange={set("personality")} placeholder="Güvenilir, yenilikçi…" />
        </label>
        <label className="block">
          <span className={ms.label}>Görsel stil</span>
          <input className={ms.input} value={form.visual_style} onChange={set("visual_style")} placeholder="Minimal, 3D, editorial…" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={ms.label}>Anahtar kelimeler</span>
          <input className={ms.input} value={form.keywords} onChange={set("keywords")} placeholder="virgülle ayırın" />
        </label>
        <label className="block">
          <span className={ms.label}>Yasaklı ifadeler</span>
          <input className={ms.input} value={form.prohibited_terms} onChange={set("prohibited_terms")} placeholder="virgülle ayırın" />
        </label>
      </div>

      <div className={ms.subtleCard}>
        <p className={ms.title}>İletişim & sosyal hesaplar</p>
        <p className={`mt-1 ${ms.muted}`}>
          Görsellerin alt kısmındaki footer satırında kullanılır. Boş bırakılan alanlar eklenmez.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {CONTACT_FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className={ms.label}>{field.label}</span>
              <input
                className={`${ms.input} bg-white dark:bg-[#2f2f2f]`}
                value={form.contact[field.key] || ""}
                onChange={setContact(field.key)}
                placeholder={field.placeholder}
              />
            </label>
          ))}
        </div>
      </div>

      <label className="block">
        <span className={ms.label}>Ek kurallar</span>
        <textarea rows={3} className={`${ms.textarea} resize-none`} value={form.guidelines} onChange={set("guidelines")} />
      </label>

      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm ${msg.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {msg.text}
        </span>
        <button type="submit" disabled={saving} className={ms.primary}>
          {saving ? "Kaydediliyor…" : "Marka kitini kaydet"}
        </button>
      </div>
    </form>
  );
}
