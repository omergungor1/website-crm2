"use client";

import DashboardBackLink from "@/components/dashboard/DashboardBackLink";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const FIXED_PROMPT =
  "Bana kare bir logo tasarla. Logo içinde metin olmayacak. Sektör ile uyumlu bir renk paleti seçmelisin";

function downloadFile(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function safeSlug(input) {
  const s = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  return (
    s
      .replace(/[^a-z0-9\s-_.]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-_.]+|[-_.]+$/g, "")
      .slice(0, 80) || "logo"
  );
}

export default function LogoGeneratorClient() {
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const [testUploading, setTestUploading] = useState(false);
  const [testUploadError, setTestUploadError] = useState("");
  const [testUploadUrl, setTestUploadUrl] = useState("");
  const [testDragOver, setTestDragOver] = useState(false);
  const testFileRef = useRef(null);

  const [items, setItems] = useState([]);
  const [nextOffset, setNextOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  const promptLen = useMemo(() => String(prompt || "").trim().length, [prompt]);
  const canGenerate = title.trim().length > 0 && promptLen >= 100 && submitting === false;

  async function fetchMore(initial = false) {
    if (loadingMore) return;
    if (initial === false && nextOffset == null) return;

    setLoadingMore(true);
    try {
      const offset = initial ? 0 : nextOffset || 0;
      const res = await fetch(`/api/logo-generations?offset=${offset}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Liste alınamadı");

      const newItems = Array.isArray(data?.items) ? data.items : [];
      setItems((prev) => (initial ? newItems : [...prev, ...newItems]));
      setNextOffset(data?.nextOffset ?? null);
    } catch {
      // liste hatasını modal akışını bozmadan geç
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    fetchMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries?.[0]?.isIntersecting) fetchMore(false);
      },
      { root: null, rootMargin: "500px", threshold: 0 }
    );

    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, nextOffset, loadingMore]);

  function resetModal() {
    setTitle("");
    setPrompt("");
    setSubmitting(false);
    setError("");
    setPreview(null);

    setTestUploading(false);
    setTestUploadError("");
    setTestUploadUrl("");
    setTestDragOver(false);
  }

  async function uploadTestFile(file) {
    if (!file) return;
    setTestUploadError("");
    setTestUploadUrl("");

    if (file.size > 8 * 1024 * 1024) {
      setTestUploadError("Dosya 8 MB'tan büyük olamaz");
      return;
    }

    setTestUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) throw new Error("Giriş yapılmamış");

      const ext = String(file.name || "").split(".").pop() || "png";
      const filename = `test-${Date.now()}-${safeSlug(file.name || "upload")}.${safeSlug(ext)}`;
      const path = `${user.id}/${filename}`;

      const { data, error: uploadError } = await supabase.storage
        .from("crm-logos")
        // ai-logos
        .upload(path, file, { upsert: true, contentType: file.type || "application/octet-stream" });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage.from("crm-logos").getPublicUrl(data.path); // ai-logos
      if (!urlData?.publicUrl) throw new Error("Public URL alınamadı");

      setTestUploadUrl(urlData.publicUrl);
    } catch (e) {
      setTestUploadError(e?.message || "Yükleme hatası");
    } finally {
      setTestUploading(false);
    }
  }

  function handleTestDrop(e) {
    e.preventDefault();
    setTestDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadTestFile(file);
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    setSubmitting(true);
    setError("");
    setPreview(null);
    try {
      const res = await fetch("/api/logo-generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Logo üretilemedi");
      if (!data?.item?.logo_url) throw new Error("Logo URL alınamadı");

      setPreview(data.item);
      setItems((prev) => [data.item, ...prev]);
    } catch (e) {
      setError(e?.message || "Bağlantı hatası");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <DashboardBackLink />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Logo generator</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Prompt ile kare logo üret, önizle, indir ve geçmişi listele.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetModal();
            setOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Yeni Logo
        </button>
      </div>

      <div className="mt-8 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Daha önce üretilen logolar
          </h2>
          <p className="text-xs text-zinc-500">{items.length > 0 ? `${items.length} kayıt` : "Henüz kayıt yok"}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((it) => {
            const fileName = `${safeSlug(it.title)}.png`;
            return (
              <div
                key={it.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.logo_url}
                  alt={it.title}
                  className="aspect-square w-full bg-white object-contain p-3 dark:bg-zinc-950"
                  loading="lazy"
                />
                <div className="space-y-2 border-t border-zinc-100 p-3 dark:border-zinc-800">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{it.title}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-zinc-500">
                      {it.created_at ? new Date(it.created_at).toLocaleString("tr-TR") : ""}
                    </p>
                    <button
                      type="button"
                      onClick={() => downloadFile(it.logo_url, fileName)}
                      className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      İndir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div ref={sentinelRef} className="h-10" />
        {loadingMore && (
          <div className="rounded-xl border border-zinc-200 bg-white p-3 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            Yükleniyor…
          </div>
        )}
        {nextOffset == null && items.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-3 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            Hepsi bu kadar.
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-4 dark:border-zinc-800">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Yeni Logo</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Sabit prompt her üretimde otomatik kullanılır. Aşağıya ek prompt yaz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Kapat
              </button>
            </div>

            <div className="space-y-4 p-4">
              {/* Test: Storage upload (AI kredi harcamadan) */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Test Upload (AI yok)
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Sürükle-bırak ile dosya yükleyip Storage policy’yi test edebilirsin.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => testFileRef.current?.click()}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Dosya seç
                  </button>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setTestDragOver(true);
                  }}
                  onDragLeave={() => setTestDragOver(false)}
                  onDrop={handleTestDrop}
                  onClick={() => testFileRef.current?.click()}
                  className={`mt-3 cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center text-sm transition-colors ${testDragOver
                    ? "border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950/30"
                    : "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                    }`}
                >
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">
                    {testUploading ? "Yükleniyor…" : "Dosyayı buraya sürükle veya tıkla"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">PNG/JPG/SVG — maks. 8 MB</p>
                  <input
                    ref={testFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => uploadTestFile(e.target.files?.[0])}
                  />
                </div>

                {testUploadError && (
                  <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                    {testUploadError}
                  </div>
                )}

                {testUploadUrl && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-100 p-3 dark:border-zinc-800">
                      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Yüklenen dosya</p>
                      <button
                        type="button"
                        onClick={() => downloadFile(testUploadUrl, `test-upload.png`)}
                        className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        İndir
                      </button>
                    </div>
                    <div className="p-4 dark:bg-zinc-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={testUploadUrl}
                        alt="Test upload"
                        className="mx-auto aspect-square w-full max-w-xs object-contain"
                      />
                      <p className="mt-3 break-all font-mono text-[11px] text-zinc-500">{testUploadUrl}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Title</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-indigo-600 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    placeholder="Örn: Proje adı / marka adı"
                  />
                </label>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Sabit prompt (değiştirilemez)
                  </span>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                    {FIXED_PROMPT}
                  </div>
                </div>
              </div>

              <label className="space-y-1">
                <div className="flex items-end justify-between">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Prompt (en az 200 karakter)
                  </span>
                  <span className={`text-xs ${promptLen >= 200 ? "text-emerald-600" : "text-zinc-500"}`}>
                    {promptLen}/200
                  </span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-indigo-600 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  placeholder="Sektör, hedef kitle, ikon fikri, stil, renk tercihleri, yasaklar vb. (detaylı yaz)"
                />
              </label>

              {error && (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Üretiliyor…
                    </>
                  ) : (
                    "Üret"
                  )}
                </button>

                {preview?.logo_url ? (
                  <button
                    type="button"
                    onClick={() => downloadFile(preview.logo_url, `${safeSlug(preview.title)}.png`)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Logoyu indir
                  </button>
                ) : (
                  <span className="text-xs text-zinc-500">Üretim sonrası önizleme burada çıkacak.</span>
                )}
              </div>

              {preview?.logo_url && (
                <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <div className="border-b border-zinc-100 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                    Önizleme
                  </div>
                  <div className="bg-white p-4 dark:bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview.logo_url}
                      alt={preview.title}
                      className="mx-auto aspect-square w-full max-w-md object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

