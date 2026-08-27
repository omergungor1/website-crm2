"use client";

import { useEffect, useState } from "react";
import { downloadSnapshotPng } from "@/lib/roadmap/downloadSnapshot";
import RoadmapSnapshotViewer from "./RoadmapSnapshotViewer";

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function RoadmapSnapshotsModal({
  open,
  onClose,
  apiBase,
  onCapture,
  currentZoom,
}) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureName, setCaptureName] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewerSnapshot, setViewerSnapshot] = useState(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape" && !viewerSnapshot) onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, viewerSnapshot]);

  useEffect(() => {
    if (!open) {
      setCaptureOpen(false);
      setCaptureName("");
      setError("");
      return;
    }
    loadSnapshots();
  }, [open, apiBase]);

  async function loadSnapshots() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiBase);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Snapshotlar yüklenemedi");
      setSnapshots(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Snapshot alınamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCapture(e) {
    e.preventDefault();
    if (capturing) return;

    setCapturing(true);
    setError("");
    try {
      const captured = await onCapture();
      const formData = new FormData();
      formData.append("file", captured.blob, "roadmap-snapshot.png");
      if (captureName.trim()) formData.append("name", captureName.trim());
      if (captured.width) formData.append("width", String(captured.width));
      if (captured.height) formData.append("height", String(captured.height));
      if (currentZoom) formData.append("zoom", String(currentZoom));
      if (captured.scrollX != null) formData.append("scroll_x", String(captured.scrollX));
      if (captured.scrollY != null) formData.append("scroll_y", String(captured.scrollY));

      const res = await fetch(apiBase, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Snapshot kaydedilemedi");

      setSnapshots((prev) => [data, ...prev]);
      setCaptureOpen(false);
      setCaptureName("");
    } catch (err) {
      setError(err?.message || "Snapshot alınamadı. Lütfen tekrar deneyin.");
    } finally {
      setCapturing(false);
    }
  }

  async function handleDownload(snapshot) {
    if (downloadingId) return;
    setDownloadingId(snapshot.id);
    setError("");
    try {
      await downloadSnapshotPng(snapshot);
    } catch {
      setError("Snapshot indirilemedi. Lütfen tekrar deneyin.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(snapshot) {
    if (deletingId) return;
    if (!window.confirm("Bu snapshot silinsin mi?")) return;

    setDeletingId(snapshot.id);
    setError("");
    try {
      const res = await fetch(`${apiBase}/${snapshot.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Silinemedi");
      setSnapshots((prev) => prev.filter((s) => s.id !== snapshot.id));
      if (viewerSnapshot?.id === snapshot.id) setViewerSnapshot(null);
    } catch (err) {
      setError(err?.message || "Snapshot alınamadı. Lütfen tekrar deneyin.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-3 sm:p-6"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="roadmap-snapshots-title"
          className="flex h-[85vh] w-[92vw] max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:h-[80vh] sm:w-[75vw]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800 sm:px-5">
            <div>
              <h2 id="roadmap-snapshots-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Snapshots
              </h2>
              <p className="text-xs text-zinc-500">Canvas görünümünü kaydedin ve geri dönün</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCaptureOpen((v) => !v)}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {captureOpen ? "İptal" : "Yeni Snapshot"}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </div>

          {captureOpen ? (
            <form onSubmit={handleCapture} className="shrink-0 border-b border-zinc-100 px-4 py-4 dark:border-zinc-800 sm:px-5">
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                İsim <span className="text-zinc-400">(isteğe bağlı)</span>
              </label>
              <input
                type="text"
                value={captureName}
                onChange={(e) => setCaptureName(e.target.value)}
                placeholder="Örn: MVP akışı v2"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <p className="mt-2 text-xs text-zinc-500">
                Tüm canvas (6000×4500) yüksek çözünürlükte yakalanıp kaydedilecek.
              </p>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={capturing}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
                >
                  {capturing ? "Kaydediliyor…" : "Snapshot Al ve Kaydet"}
                </button>
              </div>
            </form>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

            {loading ? (
              <p className="py-10 text-center text-sm text-zinc-400">Yükleniyor…</p>
            ) : snapshots.length === 0 ? (
              <div className="flex h-full min-h-[12rem] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-700">
                <p className="text-sm text-zinc-500">Henüz snapshot yok.</p>
                <button
                  type="button"
                  onClick={() => setCaptureOpen(true)}
                  className="mt-3 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  İlk snapshot'ı al
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {snapshots.map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className="group overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setViewerSnapshot(snapshot)}
                        className="block w-full text-left"
                      >
                        <div className="aspect-video overflow-hidden bg-zinc-200 dark:bg-zinc-900">
                          <img
                            src={snapshot.image_url}
                            alt={snapshot.name || "Snapshot"}
                            className="h-full w-full object-cover object-left-top transition group-hover:scale-[1.02]"
                          />
                        </div>
                        <div className="px-3 py-2.5">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {snapshot.name || "İsimsiz snapshot"}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">{formatDate(snapshot.created_at)}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(snapshot);
                        }}
                        disabled={downloadingId === snapshot.id}
                        title="PNG indir"
                        aria-label="PNG indir"
                        className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200/80 bg-white/95 text-zinc-700 shadow-sm transition hover:bg-white disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex justify-end gap-1 border-t border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => handleDownload(snapshot)}
                        disabled={downloadingId === snapshot.id}
                        className="rounded-md px-2 py-1 text-xs text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        {downloadingId === snapshot.id ? "İndiriliyor…" : "İndir"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(snapshot)}
                        disabled={deletingId === snapshot.id}
                        className="rounded-md px-2 py-1 text-xs text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      >
                        {deletingId === snapshot.id ? "Siliniyor…" : "Sil"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <RoadmapSnapshotViewer snapshot={viewerSnapshot} onClose={() => setViewerSnapshot(null)} />
    </>
  );
}
