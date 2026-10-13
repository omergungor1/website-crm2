"use client";

import { getTitleFontSize } from "@/lib/roadmap/nodeDisplay";
import {
  clampProgress,
  getFrameFillColor,
  isLineType,
  normalizeLinkUrl,
} from "@/lib/roadmap/annotations";
import {
  getYoutubeEmbedUrl,
  getYoutubeThumbnailUrl,
  parseYoutubeVideoId,
} from "@/lib/roadmap/youtube";
import NoteMarkdownContent from "./NoteMarkdownContent";

export default function RoadmapAnnotationView({
  annotation,
  selected,
  onDoubleClick,
  onCheckboxToggle,
  onNoteTodoToggle,
  embedInteractive = true,
}) {
  const { type } = annotation;

  if (type === "frame") {
    const label = String(annotation.title || "").trim();
    return (
      <div
        className={`relative h-full w-full rounded-xl ${selected ? "ring-2 ring-indigo-400 ring-offset-1" : ""}`}
        style={{
          border: `${annotation.strokeWidth}px solid ${annotation.color}`,
          backgroundColor: getFrameFillColor(annotation.color),
        }}
      >
        {label ? (
          <span
            className="absolute left-3 top-2.5 text-xs font-semibold leading-none"
            style={{ color: annotation.color }}
          >
            {label}
          </span>
        ) : null}
      </div>
    );
  }

  if (type === "image") {
    const url = String(annotation.imageUrl || "").trim();
    return (
      <div
        className={`relative h-full w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900 ${
          selected ? "ring-2 ring-indigo-400 ring-offset-1" : ""
        }`}
        style={{
          border: `${annotation.strokeWidth || 2}px solid ${annotation.color || "#71717a"}`,
        }}
        onDoubleClick={onDoubleClick}
      >
        {url ? (
          <img
            src={url}
            alt=""
            className="h-full w-full object-contain"
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center text-zinc-400">
            <svg className="h-8 w-8 opacity-50" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
            <span className="text-xs">Çift tıkla · görsel ekle</span>
          </div>
        )}
      </div>
    );
  }

  if (type === "video") {
    const videoId = parseYoutubeVideoId(annotation.videoUrl);
    return (
      <div
        className={`relative h-full w-full overflow-hidden rounded-lg bg-zinc-950 ${
          selected ? "ring-2 ring-indigo-400 ring-offset-1" : ""
        }`}
        style={{
          border: `${annotation.strokeWidth || 2}px solid ${annotation.color || "#71717a"}`,
        }}
        onDoubleClick={onDoubleClick}
      >
        {videoId ? (
          <>
            <img
              src={getYoutubeThumbnailUrl(videoId)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
            {embedInteractive ? (
              <iframe
                title="YouTube video"
                src={getYoutubeEmbedUrl(videoId)}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                  ▶
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center text-zinc-400">
            <svg className="h-8 w-8 opacity-50" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="text-xs">Çift tıkla · YouTube linki ekle</span>
          </div>
        )}
      </div>
    );
  }

  if (type === "link") {
    const href = normalizeLinkUrl(annotation.url);
    const label = String(annotation.title || "").trim() || href || "Bağlantı";
    return (
      <div
        className={`group/link flex h-full w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 ${
          selected ? "ring-2 ring-indigo-400" : ""
        }`}
        onDoubleClick={onDoubleClick}
        title={href || "Çift tıkla · düzenle"}
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
          aria-hidden
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </span>
        <span
          className={`min-w-0 flex-1 truncate font-medium ${href ? "" : "text-zinc-400"}`}
          style={{ color: href ? annotation.color : undefined, fontSize: annotation.fontSize }}
        >
          {href ? label : "Çift tıkla · link ekle"}
        </span>
        {href ? (
          <a
            data-roadmap-link=""
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title="Yeni sekmede aç"
            aria-label="Yeni sekmede aç"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-blue-600 opacity-0 transition hover:bg-blue-50 group-hover/link:opacity-100 focus-visible:opacity-100 dark:text-blue-300 dark:hover:bg-blue-950/50"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : null}
      </div>
    );
  }

  if (type === "progress") {
    const percent = clampProgress(annotation.progress);
    const description = String(annotation.description || "").trim();
    return (
      <div
        className={`flex h-full w-full flex-col justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 ${
          selected ? "ring-2 ring-indigo-400" : ""
        }`}
        onDoubleClick={onDoubleClick}
      >
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`min-w-0 flex-1 truncate font-semibold leading-tight ${
                String(annotation.title || "").trim() ? "" : "opacity-40"
              }`}
              style={{ color: annotation.color, fontSize: annotation.fontSize }}
            >
              {String(annotation.title || "").trim() || "Hedef adı"}
            </p>
            <span
              className="shrink-0 text-xs font-bold tabular-nums"
              style={{ color: annotation.color }}
            >
              %{percent}
            </span>
          </div>
          {description ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          ) : (
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-400/70 dark:text-zinc-500/70">
              Hedef detayı…
            </p>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full transition-[width] duration-200"
            style={{ width: `${percent}%`, backgroundColor: annotation.color }}
          />
        </div>
      </div>
    );
  }

  if (type === "checkbox") {
    return (
      <div
        className={`flex h-full w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 ${
          selected ? "ring-2 ring-indigo-400" : ""
        }`}
        onDoubleClick={onDoubleClick}
      >
        <input
          type="checkbox"
          data-roadmap-checkbox=""
          checked={Boolean(annotation.checked)}
          onChange={(e) => {
            e.stopPropagation();
            onCheckboxToggle?.(e.target.checked);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 shrink-0 cursor-pointer rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span
          className={`min-w-0 flex-1 break-words leading-snug ${
            annotation.checked ? "text-zinc-500 line-through" : ""
          } ${String(annotation.title || "").trim() ? "" : "opacity-40"}`}
          style={{ color: annotation.checked ? undefined : annotation.color, fontSize: annotation.fontSize }}
        >
          {String(annotation.title || "").trim() || "Görev metni"}
        </span>
      </div>
    );
  }

  if (type === "note") {
    return (
      <div
        className={`h-full w-full overflow-hidden rounded-lg border border-black/5 p-3 shadow-md ${selected ? "ring-2 ring-indigo-400" : ""}`}
        style={{ backgroundColor: annotation.backgroundColor || "#fef08a" }}
        onDoubleClick={onDoubleClick}
      >
        <NoteMarkdownContent
          source={annotation.title}
          color={annotation.color}
          fontSize={annotation.fontSize}
          onTodoToggle={onNoteTodoToggle}
          className="h-full"
        />
      </div>
    );
  }

  if (type === "heading") {
    const fs = annotation.fontSize || getTitleFontSize(annotation.title, annotation.width);
    const showUnderline = Boolean(annotation.underlineEnabled);
    const underlineMode = annotation.underlineLengthMode === "fixed" ? "fixed" : "auto";
    const underlineLength = Math.max(8, Number(annotation.underlineLength) || 120);
    const underlineThickness = Math.max(1, Number(annotation.underlineThickness) || 2);

    return (
      <div
        className={`flex h-full w-full items-center justify-center px-2 ${selected ? "ring-2 ring-indigo-400 rounded-lg" : ""}`}
        onDoubleClick={onDoubleClick}
      >
        <div className="inline-flex max-w-full flex-col items-center">
          <p
            className={`max-w-full break-words text-center font-bold leading-tight ${
              String(annotation.title || "").trim() ? "" : "opacity-40"
            }`}
            style={{ color: annotation.color, fontSize: fs }}
          >
            {String(annotation.title || "").trim() || "Başlık"}
          </p>
          {showUnderline ? (
            <span
              className="mt-1 shrink-0 rounded-full"
              style={{
                width: underlineMode === "auto" ? "100%" : `${underlineLength}px`,
                height: `${underlineThickness}px`,
                backgroundColor: annotation.color,
              }}
            />
          ) : null}
        </div>
      </div>
    );
  }

  if (type === "text") {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${selected ? "ring-2 ring-indigo-400 rounded-lg" : ""}`}
        onDoubleClick={onDoubleClick}
      >
        <p
          className={`w-full break-words text-center leading-snug ${
            String(annotation.title || "").trim() ? "" : "opacity-40"
          }`}
          style={{ color: annotation.color, fontSize: annotation.fontSize }}
        >
          {String(annotation.title || "").trim() || "Metin"}
        </p>
      </div>
    );
  }

  return null;
}

export function isBoxAnnotation(type) {
  return !isLineType(type);
}
