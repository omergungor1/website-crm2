"use client";

import { useEffect, useState } from "react";

const TODO_COLORS = [
  { id: "blue", label: "Mavi", dot: "bg-sky-500" },
  { id: "amber", label: "Sarı", dot: "bg-amber-500" },
  { id: "rose", label: "Kırmızı", dot: "bg-rose-500" },
];

function handleTodoTextareaKeyDown(e, value, setValue) {
  if (e.key !== "Enter") return;

  if (e.metaKey || e.ctrlKey) {
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = `${value.slice(0, start)}\n${value.slice(end)}`;
    setValue(next);
    requestAnimationFrame(() => {
      const pos = start + 1;
      el.selectionStart = pos;
      el.selectionEnd = pos;
    });
    return;
  }

  e.preventDefault();
  e.currentTarget.form?.requestSubmit();
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {TODO_COLORS.map((color) => {
        const selected = value === color.id;
        return (
          <button
            key={color.id}
            type="button"
            title={color.label}
            aria-label={color.label}
            onClick={() => onChange(selected ? null : color.id)}
            className={`h-7 w-7 rounded-full ${color.dot} transition-transform hover:scale-110 ${
              selected ? "ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-100 dark:ring-offset-zinc-900" : ""
            }`}
          />
        );
      })}
    </div>
  );
}

export default function RoadmapAddTodoModal({ open, projectName, saving, error, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setColor(null);
  }, [open]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({ title: trimmed, color });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="roadmap-add-todo-title"
      >
        <h2 id="roadmap-add-todo-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Todo Ekle
        </h2>
        {projectName ? (
          <p className="mt-1 text-xs text-zinc-500">{projectName} todo listesine eklenecek</p>
        ) : null}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">İçerik</label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => handleTodoTextareaKeyDown(e, title, setTitle)}
              rows={5}
              className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder={"Görev metni…\n- Madde 1\n- Madde 2"}
              autoFocus
              required
            />
            <p className="mt-1 text-xs text-zinc-400">
              Enter kaydeder, ⌘/Ctrl+Enter alt satıra geçer. Satır başında - ile madde ekleyebilirsiniz.
            </p>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-500">Renk</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
