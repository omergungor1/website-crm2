"use client";

import { useEffect, useState } from "react";

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
};

export default function BrandKitSection({ projectId, projectName }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
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
        keywords: form.keywords
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        prohibited_terms: form.prohibited_terms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        guidelines: form.guidelines.trim() || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    setMsg(res.ok ? "Marka kiti kaydedildi" : data.error || "Hata oluştu");
    if (res.ok) setTimeout(() => setMsg(""), 3000);
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  if (loading) {
    return <div className="py-6 text-center text-sm text-zinc-400">Marka kiti yükleniyor…</div>;
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Marka Kiti</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Media Studio prompt üretiminde otomatik kullanılır.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Marka adı</span>
          <input
            className={inputCls}
            value={form.display_name}
            onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Slogan</span>
          <input
            className={inputCls}
            value={form.slogan}
            onChange={(e) => setForm((p) => ({ ...p, slogan: e.target.value }))}
          />
        </label>
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Renkler</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.entries(form.colors).map(([key, value]) => (
            <label key={key} className="block text-xs">
              <span className="capitalize text-zinc-500">{key}</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={value || "#000000"}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, colors: { ...p.colors, [key]: e.target.value } }))
                  }
                  className="h-9 w-9 cursor-pointer rounded border border-zinc-200 bg-white p-0.5 dark:border-zinc-600"
                />
                <input
                  className={`${inputCls} mt-0 font-mono text-xs`}
                  value={value || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, colors: { ...p.colors, [key]: e.target.value } }))
                  }
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Ton</span>
          <input
            className={inputCls}
            value={form.tone}
            onChange={(e) => setForm((p) => ({ ...p, tone: e.target.value }))}
            placeholder="Modern, samimi…"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Kişilik</span>
          <input
            className={inputCls}
            value={form.personality}
            onChange={(e) => setForm((p) => ({ ...p, personality: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Görsel stil</span>
          <input
            className={inputCls}
            value={form.visual_style}
            onChange={(e) => setForm((p) => ({ ...p, visual_style: e.target.value }))}
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Anahtar kelimeler</span>
        <input
          className={inputCls}
          value={form.keywords}
          onChange={(e) => setForm((p) => ({ ...p, keywords: e.target.value }))}
          placeholder="virgülle ayırın"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Yasaklı ifadeler</span>
        <input
          className={inputCls}
          value={form.prohibited_terms}
          onChange={(e) => setForm((p) => ({ ...p, prohibited_terms: e.target.value }))}
          placeholder="virgülle ayırın"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Ek kurallar</span>
        <textarea
          rows={3}
          className={`${inputCls} resize-none`}
          value={form.guidelines}
          onChange={(e) => setForm((p) => ({ ...p, guidelines: e.target.value }))}
        />
      </label>

      <div className="flex items-center justify-between gap-2">
        {msg ? (
          <span
            className={`text-sm ${msg.includes("Hata") || msg.includes("oluştu") ? "text-red-600" : "text-emerald-600"}`}
          >
            {msg}
          </span>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "Kaydediliyor…" : "Marka kitini kaydet"}
        </button>
      </div>
    </form>
  );
}
