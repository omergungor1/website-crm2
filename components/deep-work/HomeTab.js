"use client";

import { useState } from "react";
import { useDeepWork } from "@/components/deep-work/DeepWorkProvider";
import SessionConfirmModal from "@/components/deep-work/SessionConfirmModal";
import { dayLabelShort, formatMinutes } from "@/lib/deep-work/dateUtils";
import { formatHoursShort } from "@/lib/deep-work/sessionUtils";

function deltaLabel(delta) {
  if (delta === 0) return "Hedefte";
  if (delta > 0) return `%${delta} fazla`;
  return `%${Math.abs(delta)} eksik`;
}

function deltaClass(delta) {
  if (delta >= 0) return "text-emerald-600 dark:text-emerald-400";
  return "text-amber-600 dark:text-amber-400";
}

export default function HomeTab() {
  const {
    stats,
    goalMinutes,
    beginSession,
    hasSession,
    isPaused,
    busy,
    timerLabel,
    remainingLabel,
    progress,
    stop,
    reset,
    togglePause,
  } = useDeepWork();

  const [confirmAction, setConfirmAction] = useState(null);

  const daily = stats?.daily || [];
  const avgMinutes = stats?.avgMinutes ?? 0;
  const avgPercent = stats?.avgPercent ?? 0;
  const avgDelta = stats?.avgDelta ?? 0;
  const maxBar = Math.max(goalMinutes, ...daily.map((d) => d.minutes), 1);

  async function handleConfirmSessionAction() {
    if (!confirmAction) return;
    const action = confirmAction;
    try {
      if (action === "reset") await reset();
      if (action === "stop") await stop();
      setConfirmAction(null);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-900 via-zinc-800 to-emerald-950 p-6 text-white dark:border-zinc-700">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-300/80">Deep Work</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Günlük hedef {goalMinutes} dk</h2>
            <p className="mt-2 max-w-md text-sm text-zinc-300">
              Son 7 günde ortalama {formatHoursShort(avgMinutes)} · %{avgPercent} (
              <span className={avgDelta >= 0 ? "text-emerald-300" : "text-amber-300"}>
                {deltaLabel(avgDelta)}
              </span>
              )
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-[11px] uppercase tracking-wide text-zinc-300">Bugün</p>
            <p className="font-mono text-2xl font-bold tabular-nums">
              {hasSession ? timerLabel : formatMinutes(stats?.todayMinutes || 0)}
            </p>
            <p className="text-xs text-zinc-300">Kalan {remainingLabel} · %{progress.percent}</p>
            <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${Math.min(100, progress.percent)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {!hasSession ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => beginSession({})}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              Oturum başlat
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={togglePause}
                className="rounded-lg bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25"
              >
                {isPaused ? "Devam et" : "Duraklat"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmAction("reset")}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
              >
                Sıfırla
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmAction("stop")}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900"
              >
                Bitir
              </button>
            </>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Son 7 gün</h3>
            <p className="text-xs text-zinc-500">Hedef çizgisi {goalMinutes} dk</p>
          </div>
          <p className={`text-sm font-medium ${deltaClass(avgDelta)}`}>{deltaLabel(avgDelta)}</p>
        </div>

        <div className="flex h-48 items-end gap-2">
          {daily.map((day) => {
            const height = Math.max(4, Math.round((day.minutes / maxBar) * 100));
            const goalHeight = Math.round((goalMinutes / maxBar) * 100);
            return (
              <div key={day.date} className="relative flex flex-1 flex-col items-center justify-end gap-1">
                <div className="relative flex h-36 w-full items-end justify-center">
                  <div
                    className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-emerald-400/50"
                    style={{ bottom: `${goalHeight}%` }}
                  />
                  <div
                    className={`w-full max-w-[2.5rem] rounded-t-md transition-all ${
                      day.percent >= 100
                        ? "bg-emerald-500"
                        : day.minutes > 0
                          ? "bg-zinc-700 dark:bg-zinc-300"
                          : "bg-zinc-200 dark:bg-zinc-800"
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${day.minutes} dk · %${day.percent}`}
                  />
                </div>
                <span className="text-[10px] font-medium text-zinc-500">{dayLabelShort(day.date)}</span>
                <span className={`text-[10px] font-semibold ${deltaClass(day.delta)}`}>
                  {day.minutes > 0 ? `%${day.percent}` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Seri" value={`${stats?.streak || 0} gün`} />
        <StatCard label="Bu hafta" value={formatHoursShort(stats?.weekMinutes || 0)} />
        <StatCard label="Bu ay" value={formatHoursShort(stats?.monthMinutes || 0)} />
      </div>

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

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}
