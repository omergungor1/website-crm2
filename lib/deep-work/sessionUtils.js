/** Aktif oturumun birikmiş saniye cinsinden süresi (pause dahil). */
export function sessionElapsedSeconds(session, now = new Date()) {
  if (!session) return 0;
  const accumulated = Math.max(0, Number(session.accumulated_seconds) || 0);
  if (session.status === "ended" || session.ended_at) {
    if (session.duration_minutes != null && session.duration_minutes > 0) {
      return Math.round(Number(session.duration_minutes) * 60);
    }
    return accumulated;
  }
  if (session.status === "paused") {
    return accumulated;
  }
  const resumeAt = session.last_resumed_at || session.started_at;
  if (!resumeAt) return accumulated;
  const live = Math.max(0, Math.floor((now.getTime() - new Date(resumeAt).getTime()) / 1000));
  return accumulated + live;
}

export function formatTimer(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function formatHoursShort(minutes) {
  const m = Math.max(0, Math.round(minutes || 0));
  if (m < 60) return `${m}dk`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}sa ${r}dk` : `${h}sa`;
}

export function goalProgress(workedMinutes, goalMinutes) {
  const goal = Math.max(1, Number(goalMinutes) || 120);
  const worked = Math.max(0, Number(workedMinutes) || 0);
  const pct = Math.round((worked / goal) * 100);
  const delta = pct - 100;
  return {
    percent: pct,
    delta,
    remainingMinutes: Math.max(0, goal - worked),
    overGoal: worked >= goal,
  };
}
