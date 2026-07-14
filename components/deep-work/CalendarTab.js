"use client";

import { useEffect, useMemo, useState } from "react";
import { useDeepWork } from "@/components/deep-work/DeepWorkProvider";
import { monthDays, toDateStr, todayDateStr } from "@/lib/deep-work/dateUtils";
import { formatHoursShort } from "@/lib/deep-work/sessionUtils";

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function CalendarTab() {
  const { board, stats, loadRange } = useDeepWork();
  const today = todayDateStr();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const { days, first } = monthDays(cursor.year, cursor.month);
  const startPad = (first.getDay() + 6) % 7;

  useEffect(() => {
    const { first: monthFirst, last: monthLast } = monthDays(cursor.year, cursor.month);
    loadRange(toDateStr(monthFirst), toDateStr(monthLast)).catch(() => {});
  }, [cursor.year, cursor.month, loadRange]);

  const todosByDay = useMemo(() => {
    const map = {};
    for (const t of board?.scheduled || []) {
      if (!t.is_completed) continue;
      const key = t.planned_date || (t.completed_at ? toDateStr(t.completed_at) : null);
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [board]);

  const minutesByDay = board?.dayMinutes || {};
  const completedCounts = stats?.completedByDay || {};

  const monthLabel = first.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  function shiftMonth(delta) {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const [selected, setSelected] = useState(today);

  const selectedTodos = todosByDay[selected] || [];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm dark:border-zinc-600"
          >
            ‹
          </button>
          <h3 className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-50">{monthLabel}</h3>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm dark:border-zinc-600"
          >
            ›
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-center text-[10px] font-semibold uppercase text-zinc-400">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}
          {days.map((day) => {
            const key = toDateStr(day);
            const isToday = key === today;
            const isSelected = key === selected;
            const doneCount = (todosByDay[key] || []).length || completedCounts[key] || 0;
            const minutes = minutesByDay[key] || 0;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={`flex aspect-square flex-col items-start rounded-lg border p-1.5 text-left transition ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30"
                    : isToday
                      ? "border-zinc-400 bg-zinc-50 dark:border-zinc-500 dark:bg-zinc-800"
                      : "border-transparent hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
                }`}
              >
                <span className={`text-xs font-semibold ${isToday ? "text-emerald-600" : "text-zinc-700 dark:text-zinc-200"}`}>
                  {day.getDate()}
                </span>
                {minutes > 0 && (
                  <span className="mt-auto text-[9px] text-zinc-500">{formatHoursShort(minutes)}</span>
                )}
                {doneCount > 0 && (
                  <span className="mt-0.5 rounded bg-emerald-100 px-1 text-[9px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {doneCount} todo
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <aside className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {selected} tamamlananlar
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          {formatHoursShort(minutesByDay[selected] || 0)} odak
        </p>
        <div className="mt-4 space-y-2">
          {selectedTodos.length === 0 && (
            <p className="text-xs text-zinc-400">Bu günde tamamlanan todo yok</p>
          )}
          {selectedTodos.map((todo) => (
            <div
              key={todo.id}
              className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50"
            >
              <p className="text-sm text-zinc-800 dark:text-zinc-100">{todo.title}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
