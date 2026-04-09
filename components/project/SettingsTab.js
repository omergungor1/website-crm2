"use client";

import { useState, useEffect } from "react";

export default function SettingsTab({ projectId }) {
  const [form, setForm] = useState({ google_analytics_id: "", google_search_console: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/settings/${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        setForm({
          google_analytics_id: d.google_analytics_id || "",
          google_search_console: d.google_search_console || "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/settings/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Kaydedildi!");
      setTimeout(() => setMsg(""), 3000);
    } else {
      setMsg("Hata oluştu");
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  if (loading) return <div className="py-8 text-center text-sm text-zinc-400">Yükleniyor…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Site Ayarları</h2>
        <p className="text-sm text-zinc-500">Google Analytics ve Search Console bilgilerini buradan yönetebilirsiniz.</p>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Google Analytics ID
          </label>
          <input
            type="text"
            value={form.google_analytics_id}
            onChange={(e) => setForm((p) => ({ ...p, google_analytics_id: e.target.value }))}
            className={inputCls}
            placeholder="Örn: G-XXXXXXXXXX"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Search Console
          </label>
          <textarea
            rows={3}
            value={form.google_search_console}
            onChange={(e) => setForm((p) => ({ ...p, google_search_console: e.target.value }))}
            className={`${inputCls} resize-none`}
            placeholder="Doğrulama kodu / property / not"
          />
        </div>

        <div className="flex items-center gap-3">
          {msg && (
            <span
              className={`text-sm font-medium ${msg.startsWith("Hata") ? "text-red-600" : "text-emerald-600"}`}
            >
              {msg}
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="ml-auto rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
