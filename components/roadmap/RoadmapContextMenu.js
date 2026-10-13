"use client";

import { useEffect, useRef } from "react";

const ACTIONS = [
  { id: "front", label: "Öne getir" },
  { id: "back", label: "Arkaya gönder" },
  { id: "duplicate", label: "Çoğalt" },
  { id: "delete", label: "Sil", danger: true },
];

export default function RoadmapContextMenu({ x, y, onAction, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    function onPointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    }
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    function onScroll() {
      onClose();
    }
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [onClose]);

  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 8;
    let left = x;
    let top = y;
    if (left + rect.width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - rect.width - pad);
    }
    if (top + rect.height > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - rect.height - pad);
    }
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[80] w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          role="menuitem"
          onClick={() => onAction(action.id)}
          className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs font-medium transition ${
            action.danger
              ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
