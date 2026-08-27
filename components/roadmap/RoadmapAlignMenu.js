"use client";

import { useEffect, useRef, useState } from "react";
import { ALIGN_MENU_GROUPS } from "@/lib/roadmap/alignSelection";

function AlignIcon({ id }) {
  const common = "h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400";

  if (id === "left") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 2v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="4.5" y="3" width="7" height="3" rx="0.5" fill="currentColor" opacity="0.35" />
        <rect x="4.5" y="6.5" width="5" height="3" rx="0.5" fill="currentColor" />
        <rect x="4.5" y="10" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.35" />
      </svg>
    );
  }

  if (id === "centerX") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 2v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1.5 1.5" />
        <rect x="3" y="3" width="6" height="3" rx="0.5" fill="currentColor" opacity="0.35" />
        <rect x="4" y="6.5" width="8" height="3" rx="0.5" fill="currentColor" />
        <rect x="5" y="10" width="6" height="3" rx="0.5" fill="currentColor" opacity="0.35" />
      </svg>
    );
  }

  if (id === "right") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M14 2v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="4.5" y="3" width="7" height="3" rx="0.5" fill="currentColor" opacity="0.35" />
        <rect x="6.5" y="6.5" width="5" height="3" rx="0.5" fill="currentColor" />
        <rect x="3.5" y="10" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.35" />
      </svg>
    );
  }

  if (id === "top") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 2h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="3" y="4.5" width="3" height="7" rx="0.5" fill="currentColor" opacity="0.35" />
        <rect x="6.5" y="4.5" width="3" height="5" rx="0.5" fill="currentColor" />
        <rect x="10" y="4.5" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.35" />
      </svg>
    );
  }

  if (id === "centerY") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1.5 1.5" />
        <rect x="3" y="3" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.35" />
        <rect x="6.5" y="4" width="3" height="8" rx="0.5" fill="currentColor" />
        <rect x="10" y="5" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.35" />
      </svg>
    );
  }

  if (id === "bottom") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="3" y="3" width="3" height="7" rx="0.5" fill="currentColor" opacity="0.35" />
        <rect x="6.5" y="5.5" width="3" height="5" rx="0.5" fill="currentColor" />
        <rect x="10" y="2" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.35" />
      </svg>
    );
  }

  if (id === "distributeX") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="2" y="5.5" width="2.5" height="5" rx="0.5" fill="currentColor" />
        <rect x="6.75" y="5.5" width="2.5" height="5" rx="0.5" fill="currentColor" />
        <rect x="11.5" y="5.5" width="2.5" height="5" rx="0.5" fill="currentColor" />
        <path d="M4.5 3.5v2M8 3.5v2M11.5 3.5v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M4.5 10v2M8 10v2M11.5 10v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M4.5 4.5h3.25M8.25 4.5h3.25" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M4.5 11h3.25M8.25 11h3.25" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "distributeY") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="5.5" y="2" width="5" height="2.5" rx="0.5" fill="currentColor" />
        <rect x="5.5" y="6.75" width="5" height="2.5" rx="0.5" fill="currentColor" />
        <rect x="5.5" y="11.5" width="5" height="2.5" rx="0.5" fill="currentColor" />
        <path d="M3.5 4.5h2M3.5 8h2M3.5 11.5h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M10 4.5h2M10 8h2M10 11.5h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M4.5 4.5v3.25M4.5 8.25v3.25" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M11 4.5v3.25M11 8.25v3.25" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
  }

  return null;
}

export default function RoadmapAlignMenu({ selectionCount, onAlign }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (selectionCount < 2) return null;

  function handleAlign(action) {
    onAlign(action);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title="Hizala"
        aria-label="Hizala"
        aria-expanded={open}
        className="inline-flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M4 6h16v2H4V6zm3 5h10v2H7v-2zm-4 5h18v2H3v-2z" />
        </svg>
        <span className="hidden sm:inline">Hizala</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {ALIGN_MENU_GROUPS.map((group) => (
            <div key={group.label} className="py-0.5">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                {group.label}
              </p>
              {group.items.map((item) => {
                const disabled = item.minItems ? selectionCount < item.minItems : false;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleAlign(item.id)}
                    title={disabled ? `En az ${item.minItems} öğe gerekli` : item.label}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    <AlignIcon id={item.id} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
