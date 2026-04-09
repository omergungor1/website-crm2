"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const PAGE_OPTIONS = [
  "Ana Sayfa",
  "Hizmetler",
  "Hakkımızda",
  "İletişim",
  "Hizmet Bölgeleri",
  "Galeri",
  "Blog",
  "Kampanyalar / Fiyatlar",
  "Ürünler",
  "S.S.S.",
  "Referanslar",
];

export default function PublicUpdateForm({ projectId }) {
  const supabase = createClient();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ allPages: false, pages: [], description: "", images: [] });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []).slice(0, 20 - form.images.length);
    const uploaded = [];
    for (const file of files) {
      if (file.size > 3 * 1024 * 1024) continue;
      const path = `${projectId}/updates/public-${Date.now()}-${file.name}`;
      const { data, err } = await supabase.storage.from("crm-uploads").upload(path, file, { upsert: true });
      if (!err && data) {
        const { data: urlData } = supabase.storage.from("crm-uploads").getPublicUrl(data.path);
        uploaded.push(urlData.publicUrl);
      }
    }
    setForm((p) => ({ ...p, images: [...p.images, ...uploaded] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim()) return;
    setSaving(true);
    setError("");
    const pages = form.allPages ? ["Tüm Sayfalar"] : form.pages;
    const res = await fetch(`/api/updates/public/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pages, description: form.description, image_urls: form.images }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Gönderim başarısız");
      return;
    }
    setSuccess(true);
  }

  const togglePage = (page) => {
    setForm((p) => ({
      ...p,
      pages: p.pages.includes(page) ? p.pages.filter((pg) => pg !== page) : [...p.pages, page],
    }));
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl dark:bg-emerald-950">
            ✓
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Talebiniz Alındı!</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Güncelleme talebiniz başarıyla gönderildi. En kısa sürede dönüş yapılacaktır.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Güncelleme Talebi</h1>
          <p className="text-sm text-zinc-500">Web siteniz için güncelleme talebinizi iletin.</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={form.allPages}
                onChange={(e) => setForm((p) => ({ ...p, allPages: e.target.checked, pages: [] }))}
                className="rounded"
              />
              Tüm Sayfalarda Geçerli
            </label>

            {!form.allPages && (
              <div>
                <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Hangi Sayfa(lar)?
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PAGE_OPTIONS.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => togglePage(page)}
                      className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                        form.pages.includes(page)
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                          : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Detaylı Açıklama <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              required
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="mt-1 w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="Ne değişmesini istiyorsunuz? Detaylı yazın…"
            />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Referans Görseller (opsiyonel, max 20, 3 MB)
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm text-zinc-500 hover:border-zinc-400 dark:border-zinc-600"
            >
              + Görsel Ekle
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            {form.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.images.map((url, i) => (
                  <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-lg bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))
                      }
                      className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? "Gönderiliyor…" : "Talebi Gönder"}
          </button>
        </form>
      </main>
    </div>
  );
}
