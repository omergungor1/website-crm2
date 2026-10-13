"use client";

import { useEffect, useRef, useState } from "react";
import RoadmapDeleteConfirmModal from "./RoadmapDeleteConfirmModal";

export default function RoadmapImageModal({
  annotation,
  projectId,
  onClose,
  onSave,
  onDelete,
}) {
  const [tab, setTab] = useState("url");
  const [imageUrl, setImageUrl] = useState("");
  const [width, setWidth] = useState(320);
  const [height, setHeight] = useState(240);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!annotation) return;
    setImageUrl(String(annotation.imageUrl ?? "").trim());
    setWidth(Math.max(40, Math.round(Number(annotation.width)) || 320));
    setHeight(Math.max(40, Math.round(Number(annotation.height)) || 240));
    setTab("url");
    setError("");
    setShowDeleteConfirm(false);
  }, [annotation]);

  if (!annotation) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      imageUrl: imageUrl.trim(),
      width: Math.max(40, width),
      height: Math.max(40, height),
    });
  }

  async function handleUpload(file) {
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("project_id", projectId || "roadmap");

      const res = await fetch("/api/upload/public", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yükleme başarısız");
      setImageUrl(data.url || "");
      setTab("url");
    } catch (err) {
      setError(err?.message || "Yükleme başarısız");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div
          className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="roadmap-image-title"
        >
          <h2 id="roadmap-image-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Görsel
          </h2>
          <p className="mt-1 text-xs text-zinc-500">URL girin veya dosya yükleyin</p>

          <div className="mt-4 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setTab("url")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                tab === "url"
                  ? "bg-white text-zinc-900 shadow dark:bg-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setTab("upload")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                tab === "upload"
                  ? "bg-white text-zinc-900 shadow dark:bg-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Yükle
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {tab === "url" ? (
              <div key="image-url-panel">
                <label className="mb-1 block text-xs font-medium text-zinc-500">Görsel URL</label>
                <input
                  key="image-url-input"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  autoFocus
                />
              </div>
            ) : (
              <div key="image-upload-panel">
                <label className="mb-1 block text-xs font-medium text-zinc-500">Dosya seç</label>
                <input
                  key="image-file-input"
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  disabled={uploading}
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                  className="w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-900"
                />
                <p className="mt-1 text-xs text-zinc-400">PNG, JPG, WebP, GIF · max 3 MB</p>
                {uploading ? <p className="mt-2 text-xs text-zinc-500">Yükleniyor…</p> : null}
              </div>
            )}

            {imageUrl ? (
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950">
                <img
                  src={imageUrl}
                  alt="Önizleme"
                  className="mx-auto max-h-40 w-full object-contain"
                />
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Genişlik</label>
                <input
                  type="number"
                  min={40}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value) || 40)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Yükseklik</label>
                <input
                  type="number"
                  min={40}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value) || 40)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                />
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                Sil
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <RoadmapDeleteConfirmModal
        open={showDeleteConfirm}
        title="Görsel silinsin mi?"
        message="Bu işlem geri alınamaz. Görsel canvas'tan kaldırılacak."
        itemLabel="Görsel"
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(annotation.id);
          setShowDeleteConfirm(false);
        }}
      />
    </>
  );
}
