"use client";

import { useEffect, useState } from "react";
import {
  getYoutubeEmbedUrl,
  getYoutubeThumbnailUrl,
  parseYoutubeVideoId,
} from "@/lib/roadmap/youtube";
import RoadmapDeleteConfirmModal from "./RoadmapDeleteConfirmModal";

export default function RoadmapVideoModal({ annotation, onClose, onSave, onDelete }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(225);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!annotation) return;
    setVideoUrl(String(annotation.videoUrl ?? "").trim());
    setWidth(Math.max(120, Math.round(Number(annotation.width)) || 400));
    setHeight(Math.max(90, Math.round(Number(annotation.height)) || 225));
    setError("");
    setShowDeleteConfirm(false);
  }, [annotation]);

  if (!annotation) return null;

  const videoId = parseYoutubeVideoId(videoUrl);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = videoUrl.trim();
    if (trimmed && !parseYoutubeVideoId(trimmed)) {
      setError("Geçerli bir YouTube linki girin");
      return;
    }
    onSave({
      videoUrl: trimmed,
      width: Math.max(120, width),
      height: Math.max(90, height),
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div
          className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="roadmap-video-title"
        >
          <h2 id="roadmap-video-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Video
          </h2>
          <p className="mt-1 text-xs text-zinc-500">YouTube video linki yapıştırın</p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">YouTube URL</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  setError("");
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                autoFocus
              />
            </div>

            {videoId ? (
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-black dark:border-zinc-700">
                <div className="relative aspect-video w-full">
                  <img
                    src={getYoutubeThumbnailUrl(videoId)}
                    alt="Video önizleme"
                    className="absolute inset-0 h-full w-full object-cover opacity-40"
                  />
                  <iframe
                    title="YouTube önizleme"
                    src={getYoutubeEmbedUrl(videoId)}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Genişlik</label>
                <input
                  type="number"
                  min={120}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value) || 120)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Yükseklik</label>
                <input
                  type="number"
                  min={90}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value) || 90)}
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
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
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
        title="Video silinsin mi?"
        message="Bu işlem geri alınamaz. Video canvas'tan kaldırılacak."
        itemLabel="Video"
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(annotation.id);
          setShowDeleteConfirm(false);
        }}
      />
    </>
  );
}
