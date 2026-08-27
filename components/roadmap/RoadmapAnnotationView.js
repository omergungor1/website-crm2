"use client";

import { getTitleFontSize } from "@/lib/roadmap/nodeDisplay";
import { getFrameFillColor, isLineType } from "@/lib/roadmap/annotations";

export default function RoadmapAnnotationView({ annotation, selected, onDoubleClick }) {
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

  if (type === "note") {
    return (
      <div
        className={`h-full w-full rounded-lg border border-black/5 p-3 shadow-md ${selected ? "ring-2 ring-indigo-400" : ""}`}
        style={{ backgroundColor: annotation.backgroundColor || "#fef08a" }}
        onDoubleClick={onDoubleClick}
      >
        <p
          className="h-full w-full whitespace-pre-wrap break-words leading-snug"
          style={{ color: annotation.color, fontSize: annotation.fontSize }}
        >
          {annotation.title}
        </p>
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
            className="max-w-full break-words text-center font-bold leading-tight"
            style={{ color: annotation.color, fontSize: fs }}
          >
            {annotation.title}
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
          className="w-full break-words text-center leading-snug"
          style={{ color: annotation.color, fontSize: annotation.fontSize }}
        >
          {annotation.title}
        </p>
      </div>
    );
  }

  return null;
}

export function isBoxAnnotation(type) {
  return !isLineType(type);
}
