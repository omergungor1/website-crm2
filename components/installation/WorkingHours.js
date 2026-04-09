"use client";

import { useState, useEffect } from "react";

const DAYS = [
  { key: "monday", label: "Pazartesi" },
  { key: "tuesday", label: "Salı" },
  { key: "wednesday", label: "Çarşamba" },
  { key: "thursday", label: "Perşembe" },
  { key: "friday", label: "Cuma" },
  { key: "saturday", label: "Cumartesi" },
  { key: "sunday", label: "Pazar" },
];

const DEFAULT_HOURS = Object.fromEntries(
  DAYS.map((d) => [
    d.key,
    { is24h: false, open: "09:00", close: "18:00", closed: false },
  ])
);

export default function WorkingHours({ value, onChange }) {
  const [hours, setHours] = useState(value || DEFAULT_HOURS);

  useEffect(() => {
    onChange(hours);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours]);

  const update = (day, field, val) => {
    setHours((p) => ({
      ...p,
      [day]: { ...p[day], [field]: val },
    }));
  };

  return (
    <div className="space-y-2">
      {DAYS.map(({ key, label }) => {
        const day = hours[key] || { is24h: false, open: "09:00", close: "18:00", closed: false };
        return (
          <div
            key={key}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700"
          >
            <span className="w-24 shrink-0 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {label}
            </span>

            <label className="flex items-center gap-1.5 text-sm text-zinc-500">
              <input
                type="checkbox"
                checked={day.closed}
                onChange={(e) => update(key, "closed", e.target.checked)}
                className="rounded"
              />
              Kapalı
            </label>

            {!day.closed && (
              <>
                <label className="flex items-center gap-1.5 text-sm text-zinc-500">
                  <input
                    type="checkbox"
                    checked={day.is24h}
                    onChange={(e) => update(key, "is24h", e.target.checked)}
                    className="rounded"
                  />
                  24 Saat
                </label>

                {!day.is24h && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={day.open}
                      onChange={(e) => update(key, "open", e.target.value)}
                      className="rounded border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <span className="text-xs text-zinc-400">–</span>
                    <input
                      type="time"
                      value={day.close}
                      onChange={(e) => update(key, "close", e.target.value)}
                      className="rounded border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
