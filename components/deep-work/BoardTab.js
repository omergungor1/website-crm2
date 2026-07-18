"use client";

import { useEffect, useMemo, useState } from "react";
import { useDeepWork } from "@/components/deep-work/DeepWorkProvider";
import SessionConfirmModal from "@/components/deep-work/SessionConfirmModal";
import { BACKLOG_SIDEBAR_KEY } from "@/lib/deep-work/constants";
import { dayHeaderLabel, todayDateStr } from "@/lib/deep-work/dateUtils";
import { formatHoursShort } from "@/lib/deep-work/sessionUtils";

const TODO_COLORS = [
  { id: "blue", label: "Mavi", dot: "bg-sky-500" },
  { id: "amber", label: "Sarı", dot: "bg-amber-500" },
  { id: "rose", label: "Kırmızı", dot: "bg-rose-500" },
];

function handleTodoTextareaKeyDown(e) {
  if (e.key !== "Enter") return;
  if (!(e.metaKey || e.ctrlKey)) return;
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
            className={`h-7 w-7 rounded-full ${color.dot} transition-transform hover:scale-110 ${selected ? "ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-100 dark:ring-offset-zinc-900" : ""
              }`}
          />
        );
      })}
    </div>
  );
}

function AddTodoModal({ open, projects, saving, error, onClose, onSave }) {
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setColor(null);
    setProjectId(projects[0]?.id || "");
  }, [open, projects]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !projectId) return;
    onSave({ projectId, title: trimmed, color });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deep-work-add-todo-title"
      >
        <h2 id="deep-work-add-todo-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Todo Ekle
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Proje</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              required
            >
              {!projects.length && <option value="">Proje yok</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">İçerik</label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleTodoTextareaKeyDown}
              rows={5}
              className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder={"Görev metni…\n- Madde 1\n- Madde 2"}
              autoFocus
              required
            />
            <p className="mt-1 text-xs text-zinc-400">
              Enter alt satıra geçer, ⌘/Ctrl+Enter kaydeder. Satır başında - ile madde ekleyebilirsiniz.
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
              disabled={saving || !title.trim() || !projectId}
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

function TodoCard({ todo, projectName, onComplete, onStart, dragging, outdated = false, ...dragProps }) {
  return (
    <div
      {...dragProps}
      className={`group cursor-grab rounded-lg border p-2.5 shadow-sm transition hover:shadow active:cursor-grabbing ${outdated
        ? "border-amber-300/80 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30"
        : "border-zinc-200/80 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
        } ${dragging ? "opacity-40" : ""}`}
    >
      <div className="flex flex-wrap items-start gap-1.5">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-50">
          {todo.title}
        </p>
        {outdated && (
          <span className="shrink-0 rounded bg-amber-200/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-900 dark:bg-amber-900/70 dark:text-amber-200">
            Outdated
          </span>
        )}
      </div>
      {outdated && todo.planned_date && (
        <p className="mt-1 text-[11px] font-medium text-amber-700/90 dark:text-amber-400/90">
          Plan: {dayHeaderLabel(todo.planned_date)}
        </p>
      )}
      {projectName && (
        <p className="mt-1 truncate text-[11px] text-zinc-400">{projectName}</p>
      )}
      <div className="mt-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        {onStart && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStart();
            }}
            className="rounded px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
          >
            Başlat
          </button>
        )}
        {onComplete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className="rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Tamamla
          </button>
        )}
      </div>
    </div>
  );
}

function DoneAccordion({ todos, projectNames, onUndo }) {
  const [open, setOpen] = useState(false);
  if (!todos.length) return null;

  return (
    <div className="mt-auto border-t border-zinc-200/80 pt-2 dark:border-zinc-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md px-1 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        <span>Done ({todos.length})</span>
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="mt-1 space-y-1.5">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 px-2.5 py-2 dark:border-zinc-700 dark:bg-zinc-900/40"
            >
              <p className="text-xs text-zinc-500 line-through">{todo.title}</p>
              {projectNames[todo.project_id] && (
                <p className="mt-0.5 text-[10px] text-zinc-400">{projectNames[todo.project_id]}</p>
              )}
              <button
                type="button"
                onClick={() => onUndo(todo.id)}
                className="mt-1 text-[10px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Geri al
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BoardTab() {
  const {
    board,
    openProjects,
    toggleProject,
    openProject,
    assignTodo,
    beginSession,
    reload,
    hasSession,
    isRunning,
    isPaused,
    busy,
    timerLabel,
    remainingLabel,
    progress,
    stop,
    reset,
    togglePause,
  } = useDeepWork();

  const [dragId, setDragId] = useState(null);
  const [overTarget, setOverTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BACKLOG_SIDEBAR_KEY);
      if (saved === "0") setSidebarOpen(false);
      if (saved === "1") setSidebarOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  function toggleSidebar() {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(BACKLOG_SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const projectNames = useMemo(() => {
    const map = {};
    for (const p of board?.projects || []) map[p.id] = p.name;
    return map;
  }, [board]);

  const allProjects = board?.projects || [];
  const today = board?.today || todayDateStr();

  const columns = useMemo(() => {
    const scheduled = board?.scheduled || [];
    const byBoardSort = (a, b) =>
      (a.board_sort_order ?? 0) - (b.board_sort_order ?? 0) ||
      (a.sort_order ?? 0) - (b.sort_order ?? 0);

    return (board?.week || []).map((dateStr) => {
      const dayTodos = scheduled
        .filter((t) => t.planned_date === dateStr)
        .slice()
        .sort(byBoardSort);
      return {
        date: dateStr,
        isToday: dateStr === today,
        active: dayTodos.filter((t) => !t.is_completed),
        done: dayTodos.filter((t) => t.is_completed),
        minutes: board?.dayMinutes?.[dateStr] || 0,
      };
    });
  }, [board, today]);

  async function handleDrop(target, beforeTodoId = null) {
    if (!dragId) return;
    const movedId = dragId;
    setDragId(null);
    setOverTarget(null);

    if (target === "backlog") {
      try {
        await assignTodo({ todoId: movedId, toBacklog: true });
      } catch {
        /* toast + revert provider'da */
      }
      return;
    }

    const orderedIds = (() => {
      const col = columns.find((c) => c.date === target);
      const others = (col?.active || []).map((t) => t.id).filter((id) => id !== movedId);
      if (beforeTodoId && beforeTodoId !== movedId && others.includes(beforeTodoId)) {
        const idx = others.indexOf(beforeTodoId);
        return [...others.slice(0, idx), movedId, ...others.slice(idx)];
      }
      return [...others, movedId];
    })();

    const col = columns.find((c) => c.date === target);
    const currentOrder = (col?.active || []).map((t) => t.id);
    const alreadyOnDay = currentOrder.includes(movedId);

    if (alreadyOnDay && currentOrder.join() === orderedIds.join()) {
      return;
    }

    try {
      await assignTodo({ todoId: movedId, plannedDate: target, orderedIds });
    } catch {
      /* toast + revert provider'da */
    }
  }

  function isOverSlot(date, beforeTodoId = null) {
    if (!overTarget || typeof overTarget === "string") {
      return overTarget === date && beforeTodoId == null;
    }
    return overTarget.date === date && (overTarget.beforeId || null) === (beforeTodoId || null);
  }

  async function handleConfirmSessionAction() {
    if (!confirmAction) return;
    const action = confirmAction;
    try {
      if (action === "reset") await reset();
      if (action === "stop") await stop();
      setConfirmAction(null);
    } catch {
      /* provider toast/error handled elsewhere */
    }
  }

  async function handleAddTodo({ projectId, title, color }) {
    setAddSaving(true);
    setAddError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eklenemedi");
      setAddOpen(false);
      openProject(projectId);
      await reload();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddSaving(false);
    }
  }

  const projectsWithTodos = allProjects.filter((p) => p.todos?.length > 0);
  const emptyProjects = allProjects.filter((p) => !p.todos?.length);

  return (
    <div className="flex h-[calc(100dvh-13.5rem)] min-h-[28rem] flex-col gap-4">
      {/* <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Odak oturumu</p>
          <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {hasSession ? timerLabel : "00:00"}
          </p>
          <p className="text-xs text-zinc-500">
            Hedefe kalan: {remainingLabel} · %{progress.percent}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!hasSession ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => beginSession({})}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              <PlayIcon /> Başlat
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={togglePause}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                {isPaused ? <PlayIcon /> : <PauseIcon />}
                {isPaused ? "Devam" : "Duraklat"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmAction("reset")}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Sıfırla
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmAction("stop")}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Bitir
              </button>
            </>
          )}
          {isRunning && <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 sm:max-w-xs sm:flex-1">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.min(100, progress.percent)}%` }}
          />
        </div>
      </div> */}

      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto">
        {!sidebarOpen ? (
          <button
            type="button"
            onClick={toggleSidebar}
            title="Bekleyen işleri aç"
            aria-label="Bekleyen işleri aç"
            className="flex h-full w-10 shrink-0 flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100/80 py-3 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <SidebarIcon className="h-4 w-4" />
            <span
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Bekleyen
            </span>
          </button>
        ) : (
          <aside
            className={`flex h-full w-64 shrink-0 flex-col rounded-xl border bg-zinc-100/80 p-3 dark:bg-zinc-900/60 ${overTarget === "backlog"
              ? "border-emerald-400 ring-2 ring-emerald-300/50 dark:border-emerald-500"
              : "border-zinc-200 dark:border-zinc-700"
              }`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverTarget("backlog");
            }}
            onDragLeave={() => setOverTarget(null)}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop("backlog");
            }}
          >
            <div className="mb-3 flex shrink-0 items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Bekleyen işler</h3>
                <p className="text-[11px] text-zinc-500">Proje todoları · sürükle bırak</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setAddError("");
                    setAddOpen(true);
                  }}
                  disabled={!allProjects.length}
                  title="Todo ekle"
                  aria-label="Todo ekle"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  title="Bekleyen işleri gizle"
                  aria-label="Bekleyen işleri gizle"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <SidebarIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
              {projectsWithTodos.map((project) => {
                const open = Boolean(openProjects[project.id]);
                return (
                  <div
                    key={project.id}
                    className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <button
                      type="button"
                      onClick={() => toggleProject(project.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
                    >
                      <svg
                        className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-90" : ""}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 01-1.06-.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {project.name}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800">
                        {project.todos.length}
                      </span>
                    </button>
                    {open && (
                      <div className="space-y-2 border-t border-zinc-100 px-2 py-2 dark:border-zinc-800">
                        {(() => {
                          const fresh = project.todos.filter((t) => !t.planned_date);
                          const outdated = project.todos
                            .filter((t) => t.planned_date)
                            .sort((a, b) => String(a.planned_date).localeCompare(String(b.planned_date)));
                          return (
                            <>
                              {outdated.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                    Outdated · {outdated.length}
                                  </p>
                                  {outdated.map((todo) => (
                                    <TodoCard
                                      key={todo.id}
                                      todo={todo}
                                      outdated
                                      dragging={dragId === todo.id}
                                      draggable
                                      onDragStart={() => setDragId(todo.id)}
                                      onDragEnd={() => {
                                        setDragId(null);
                                        setOverTarget(null);
                                      }}
                                      onStart={() => beginSession({ project_todo_id: todo.id })}
                                      onComplete={() => assignTodo({ todoId: todo.id, isCompleted: true })}
                                    />
                                  ))}
                                </div>
                              )}
                              {fresh.length > 0 && (
                                <div className="space-y-1.5">
                                  {outdated.length > 0 && (
                                    <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                      Yeni
                                    </p>
                                  )}
                                  {fresh.map((todo) => (
                                    <TodoCard
                                      key={todo.id}
                                      todo={todo}
                                      dragging={dragId === todo.id}
                                      draggable
                                      onDragStart={() => setDragId(todo.id)}
                                      onDragEnd={() => {
                                        setDragId(null);
                                        setOverTarget(null);
                                      }}
                                      onStart={() => beginSession({ project_todo_id: todo.id })}
                                      onComplete={() => assignTodo({ todoId: todo.id, isCompleted: true })}
                                    />
                                  ))}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}

              {!projectsWithTodos.length && (
                <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-xs text-zinc-400 dark:border-zinc-700">
                  Bekleyen proje todosu yok
                </p>
              )}

              {emptyProjects.length > 0 && (
                <p className="px-1 pt-2 text-[10px] text-zinc-400">
                  {emptyProjects.length} proje boş (todo yok)
                </p>
              )}
            </div>
          </aside>
        )}

        <div className="flex h-full min-w-0 flex-1 gap-2">
          {columns.map((col) => (
            <div
              key={col.date}
              className={`flex h-full w-0 min-w-[9.5rem] flex-1 flex-col rounded-xl border p-2.5 ${col.isToday
                ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                : "border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/40"
                } ${isOverSlot(col.date) ? "ring-2 ring-emerald-400/60" : ""
                }`}
              onDragOver={(e) => {
                e.preventDefault();
                setOverTarget({ date: col.date, beforeId: null });
              }}
              onDragLeave={() => setOverTarget(null)}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(col.date);
              }}
            >
              <div className="mb-2 shrink-0">
                <div className="flex items-center justify-between gap-1">
                  <h3
                    className={`text-xs font-semibold ${col.isToday ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-200"
                      }`}
                  >
                    {dayHeaderLabel(col.date)}
                  </h3>
                  {col.isToday && (
                    <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                      Bugün
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-500">{formatHoursShort(col.minutes)} aktif</p>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                {col.active.map((todo) => (
                  <div
                    key={todo.id}
                    className="relative"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (dragId === todo.id) return;
                      setOverTarget({ date: col.date, beforeId: todo.id });
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDrop(col.date, todo.id);
                    }}
                  >
                    {isOverSlot(col.date, todo.id) && dragId !== todo.id && (
                      <div className="pointer-events-none absolute inset-x-1 -top-1 z-10 h-0.5 rounded-full bg-emerald-500" />
                    )}
                    <TodoCard
                      todo={todo}
                      projectName={projectNames[todo.project_id]}
                      dragging={dragId === todo.id}
                      draggable
                      onDragStart={() => setDragId(todo.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverTarget(null);
                      }}
                      onStart={() => beginSession({ project_todo_id: todo.id })}
                      onComplete={() =>
                        assignTodo({ todoId: todo.id, plannedDate: col.date, isCompleted: true })
                      }
                    />
                  </div>
                ))}
                {!col.active.length && (
                  <div className="flex min-h-[6rem] flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-200 px-2 dark:border-zinc-700">
                    <p className="text-center text-[10px] text-zinc-400">No Todos</p>
                  </div>
                )}

                <DoneAccordion
                  todos={col.done}
                  projectNames={projectNames}
                  onUndo={(id) => assignTodo({ todoId: id, isCompleted: false })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddTodoModal
        open={addOpen}
        projects={allProjects}
        saving={addSaving}
        error={addError}
        onClose={() => {
          if (!addSaving) setAddOpen(false);
        }}
        onSave={handleAddTodo}
      />

      <SessionConfirmModal
        open={confirmAction === "reset"}
        title="Oturum sıfırlansın mı?"
        description="Sayaç sıfırlanacak ve oturum yeniden başlayacak. Biriken süre silinir."
        confirmLabel="Evet, sıfırla"
        busyLabel="Sıfırlanıyor…"
        confirmClassName="bg-amber-600 hover:bg-amber-500"
        busy={busy}
        onClose={() => {
          if (!busy) setConfirmAction(null);
        }}
        onConfirm={handleConfirmSessionAction}
      />

      <SessionConfirmModal
        open={confirmAction === "stop"}
        title="Oturum bitirilsin mi?"
        description="Aktif oturum sonlandırılacak ve çalışma süresi kaydedilecek."
        confirmLabel="Evet, bitir"
        busyLabel="Bitiriliyor…"
        confirmClassName="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        busy={busy}
        onClose={() => {
          if (!busy) setConfirmAction(null);
        }}
        onConfirm={handleConfirmSessionAction}
      />
    </div>
  );
}

function PlayIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function SidebarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5zm2 0v14h4V5H5zm6 0v14h8V5h-8z" />
    </svg>
  );
}
