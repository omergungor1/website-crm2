"use client";

import { useMemo, useState } from "react";
import { parseNoteMarkdown } from "@/lib/roadmap/noteMarkdown";

function InlineText({ text }) {
  return <span className="whitespace-pre-wrap break-words">{text}</span>;
}

function ToggleBlock({ block, color, baseSize }) {
  const [open, setOpen] = useState(false);
  const titleSize = Math.max(11, Math.round(baseSize * 0.95));

  return (
    <div className="rounded-md border border-black/10 bg-black/[0.03]">
      <button
        type="button"
        data-roadmap-note-interactive=""
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex w-full items-start gap-1.5 px-2 py-1.5 text-left"
        style={{ color, fontSize: titleSize }}
      >
        <span
          className={`mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[10px] transition-transform ${
            open ? "rotate-90" : ""
          }`}
          aria-hidden
        >
          ▶
        </span>
        <span className="min-w-0 flex-1 font-medium leading-snug">
          <InlineText text={block.title || "Detay"} />
        </span>
      </button>
      {open && block.body?.length ? (
        <div
          className="space-y-0.5 border-t border-black/10 px-2 py-1.5 pl-6 leading-snug opacity-90"
          style={{ color, fontSize: Math.max(10, Math.round(baseSize * 0.9)) }}
        >
          {block.body.map((line) => (
            <p key={line.lineIndex}>
              <InlineText text={line.text} />
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function NoteMarkdownContent({
  source,
  color,
  fontSize = 14,
  onTodoToggle,
  className = "",
}) {
  const blocks = useMemo(() => parseNoteMarkdown(source), [source]);
  const base = Number(fontSize) || 14;

  if (!String(source || "").trim()) {
    return (
      <p className={`leading-snug opacity-50 ${className}`} style={{ color, fontSize: base }}>
        Not yaz…
      </p>
    );
  }

  return (
    <div className={`space-y-1.5 overflow-auto ${className}`} style={{ color, fontSize: base }}>
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          const scale = block.level === 1 ? 1.35 : block.level === 2 ? 1.18 : 1.06;
          const weight = block.level === 1 ? 700 : block.level === 2 ? 650 : 600;
          return (
            <p
              key={`h-${block.lineIndex}`}
              className="leading-tight"
              style={{ fontSize: Math.round(base * scale), fontWeight: weight }}
            >
              <InlineText text={block.text} />
            </p>
          );
        }

        if (block.type === "divider") {
          return (
            <hr
              key={`hr-${block.lineIndex}`}
              className="my-1.5 border-0 border-t border-black/20"
            />
          );
        }

        if (block.type === "todo") {
          return (
            <ul key={`todo-${idx}`} className="space-y-1">
              {block.items.map((item) => (
                <li key={item.lineIndex} className="flex items-start gap-1.5">
                  <input
                    type="checkbox"
                    data-roadmap-note-interactive=""
                    checked={Boolean(item.checked)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      onTodoToggle?.(item.lineIndex);
                    }}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-zinc-400 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span
                    className={`min-w-0 flex-1 leading-snug ${
                      item.checked ? "line-through opacity-60" : ""
                    }`}
                  >
                    <InlineText text={item.text} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "bullet") {
          return (
            <ul key={`ul-${idx}`} className="list-disc space-y-0.5 pl-4">
              {block.items.map((item) => (
                <li key={item.lineIndex} className="leading-snug">
                  <InlineText text={item.text} />
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "numbered") {
          return (
            <ol key={`ol-${idx}`} className="list-decimal space-y-0.5 pl-4">
              {block.items.map((item) => (
                <li key={item.lineIndex} className="leading-snug">
                  <InlineText text={item.text} />
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "toggle") {
          return (
            <ToggleBlock
              key={`tg-${block.lineIndex}`}
              block={block}
              color={color}
              baseSize={base}
            />
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={`q-${idx}`}
              className="border-l-2 border-black/25 pl-2 italic leading-snug opacity-90"
            >
              {block.lines.map((line) => (
                <p key={line.lineIndex}>
                  <InlineText text={line.text} />
                </p>
              ))}
            </blockquote>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={`p-${idx}`} className="leading-snug">
              {block.lines.map((line, i) => (
                <span key={line.lineIndex}>
                  {i > 0 ? <br /> : null}
                  <InlineText text={line.text} />
                </span>
              ))}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}
