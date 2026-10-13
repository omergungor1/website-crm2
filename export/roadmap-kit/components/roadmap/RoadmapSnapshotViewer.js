"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { downloadSnapshotPng } from "@/lib/roadmap/downloadSnapshot";

const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.05;
const VIEW_PADDING = 32;

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

function computeFitZoom(containerW, containerH, imageW, imageH) {
  if (!containerW || !containerH || !imageW || !imageH) return 1;
  const scale = Math.min(
    (containerW - VIEW_PADDING) / imageW,
    (containerH - VIEW_PADDING) / imageH,
    1
  );
  return Math.max(ZOOM_MIN, Number(scale.toFixed(4)));
}

export default function RoadmapSnapshotViewer({ snapshot, onClose }) {
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(null);
  const containerRef = useRef(null);
  const fitZoomRef = useRef(1);

  const applyFitView = useCallback((imgW, imgH) => {
    const el = containerRef.current;
    if (!el || !imgW || !imgH) return;
    const fitZoom = computeFitZoom(el.clientWidth, el.clientHeight, imgW, imgH);
    fitZoomRef.current = fitZoom;
    setZoom(fitZoom);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!snapshot) return;

    const metaW = Number(snapshot.width) || 0;
    const metaH = Number(snapshot.height) || 0;
    setNaturalSize({ w: metaW, h: metaH });
    setPan({ x: 0, y: 0 });

    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [snapshot, onClose]);

  useLayoutEffect(() => {
    if (!snapshot || !naturalSize.w || !naturalSize.h) return;
    applyFitView(naturalSize.w, naturalSize.h);
  }, [snapshot, naturalSize, applyFitView]);

  if (!snapshot) return null;

  function handleImageLoad(e) {
    const w = e.currentTarget.naturalWidth;
    const h = e.currentTarget.naturalHeight;
    if (!w || !h) return;
    setNaturalSize({ w, h });
  }

  function zoomIn() {
    setZoom((z) => Math.min(ZOOM_MAX, Number((z + ZOOM_STEP).toFixed(2))));
  }

  function zoomOut() {
    setZoom((z) => Math.max(ZOOM_MIN, Number((z - ZOOM_STEP).toFixed(2))));
  }

  function resetView() {
    if (naturalSize.w && naturalSize.h) {
      applyFitView(naturalSize.w, naturalSize.h);
    }
  }

  function handleDownload() {
    downloadSnapshotPng(snapshot);
  }

  function startPan(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragging({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
  }

  function onPanMove(e) {
    if (!dragging) return;
    setPan({
      x: dragging.panX + (e.clientX - dragging.x),
      y: dragging.panY + (e.clientY - dragging.y),
    });
  }

  function endPan() {
    setDragging(null);
  }

  function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number((z + delta).toFixed(2)))));
  }

  const displayW = naturalSize.w ? naturalSize.w * zoom : undefined;
  const displayH = naturalSize.h ? naturalSize.h * zoom : undefined;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black/90"
      onPointerMove={onPanMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onWheel={handleWheel}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {snapshot.name || "İsimsiz snapshot"}
          </p>
          <p className="text-xs text-zinc-400">{formatDate(snapshot.created_at)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= ZOOM_MIN}
            title="Uzaklaştır"
            aria-label="Uzaklaştır"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white transition hover:bg-white/10 disabled:opacity-40"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            onClick={resetView}
            title="Ekrana sığdır"
            className="min-w-[3.5rem] rounded-lg px-2 py-1 text-center text-xs font-medium tabular-nums text-zinc-200 hover:bg-white/10"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= ZOOM_MAX}
            title="Yakınlaştır"
            aria-label="Yakınlaştır"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white transition hover:bg-white/10 disabled:opacity-40"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            title="PNG indir"
            className="ml-1 inline-flex h-8 items-center gap-1 rounded-lg border border-white/15 px-3 text-xs font-medium text-white transition hover:bg-white/10"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            İndir
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`flex min-h-0 flex-1 items-center justify-center overflow-hidden ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={startPan}
      >
        <img
          src={snapshot.image_url}
          alt={snapshot.name || "Roadmap snapshot"}
          draggable={false}
          onLoad={handleImageLoad}
          className="max-h-full max-w-full select-none object-contain"
          style={
            displayW && displayH
              ? {
                  width: displayW,
                  height: displayH,
                  maxWidth: "none",
                  maxHeight: "none",
                  transform: `translate(${pan.x}px, ${pan.y}px)`,
                }
              : {
                  transform: `translate(${pan.x}px, ${pan.y}px)`,
                }
          }
        />
      </div>
    </div>
  );
}
