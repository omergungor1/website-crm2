"use client";

import { useEffect, useState } from "react";
import TodoListTab from "@/components/project/TodoListTab";

export default function SiteTodoModal({ open, onClose }) {
  const [view, setView] = useState("list");

  useEffect(() => {
    if (!open) return;

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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-3 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-todo-modal-title"
        className={`flex h-[85vh] w-[94vw] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl transition-[max-width] dark:border-zinc-700 dark:bg-zinc-900 sm:h-[82vh] ${
          view === "kanban" ? "max-w-6xl" : "max-w-3xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800 sm:px-5">
          <div className="min-w-0">
            <h2
              id="site-todo-modal-title"
              className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Site Todo
            </h2>
            <p className="text-xs text-zinc-500">Projeden bağımsız genel görevler</p>
          </div>

          <div className="flex items-center rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800" role="tablist" aria-label="Todo görünümü">
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              onClick={() => setView("list")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                view === "list"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Liste
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "kanban"}
              onClick={() => setView("kanban")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                view === "kanban"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Kanban
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div
          className={`min-h-0 flex-1 px-4 py-4 sm:px-5 ${
            view === "kanban" ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <TodoListTab apiBase="/api/site-todos" showHeading={false} view={view} />
        </div>
      </div>
    </div>
  );
}
