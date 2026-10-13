"use client";

import { useState } from "react";
import Link from "next/link";
import { NODE_TYPES, nodeShapeClass } from "@/lib/roadmap/constants";
import { ANNOTATION_TYPES } from "@/lib/roadmap/annotations";

function toolPreviewSize(shape) {
  if (shape === "circle" || shape === "diamond" || shape === "square") {
    return { width: 16, height: 16 };
  }
  if (shape === "ellipse") {
    return { width: 20, height: 12 };
  }
  if (shape === "rectangle") {
    return { width: 20, height: 12 };
  }
  return { width: 18, height: 14 };
}

function ToolButton({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-left text-xs font-medium text-zinc-700 transition hover:border-[var(--brand)]/40 hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-blue-500 dark:hover:bg-blue-950/40"
    >
      {children}
    </button>
  );
}

function AccordionSection({ id, title, open, onToggle, children }) {
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="mb-1 flex w-full items-center justify-between gap-1 rounded-md px-1 py-1 text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          {title}
        </span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open ? <div className="space-y-1">{children}</div> : null}
    </div>
  );
}

export default function RoadmapToolbox({ onAddNode, onAddAnnotation }) {
  const [openSection, setOpenSection] = useState("nodes");
  const nodeTools = NODE_TYPES;
  const annTools = ANNOTATION_TYPES;

  function toggleSection(id) {
    setOpenSection((prev) => (prev === id ? null : id));
  }

  return (
    <aside className="flex w-40 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex-1 overflow-y-auto p-2">
        <AccordionSection
          id="nodes"
          title="Node"
          open={openSection === "nodes"}
          onToggle={toggleSection}
        >
          {nodeTools.map((t) => {
            const size = toolPreviewSize(t.shape);
            return (
              <ToolButton key={t.id} title={t.label} onClick={() => onAddNode(t.id)}>
                <span
                  className={`flex shrink-0 items-center justify-center border-2 border-current ${nodeShapeClass(t.shape)}`}
                  style={size}
                />
                <span className="truncate">{t.label}</span>
              </ToolButton>
            );
          })}
        </AccordionSection>

        <AccordionSection
          id="tools"
          title="Araçlar"
          open={openSection === "tools"}
          onToggle={toggleSection}
        >
          {annTools.map((t) => (
            <ToolButton key={t.id} title={t.label} onClick={() => onAddAnnotation(t.id)}>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-200/80 text-[11px] font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
                {t.icon}
              </span>
              <span className="truncate">{t.label}</span>
            </ToolButton>
          ))}
        </AccordionSection>
      </div>

      <div className="shrink-0 border-t border-zinc-200 p-2 dark:border-zinc-800">
        <Link
          href="/dashboard"
          title="Ana sayfa"
          className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-left text-xs font-medium text-zinc-700 transition hover:border-[var(--brand)]/40 hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
          </svg>
          <span className="truncate">Ana sayfa</span>
        </Link>
      </div>
    </aside>
  );
}
