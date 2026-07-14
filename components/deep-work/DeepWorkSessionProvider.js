"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchActiveSession,
  fetchSettings,
  fetchStats,
  pauseSession,
  resetSession,
  resumeSession,
  startSession,
  stopSession,
} from "@/lib/deep-work/clientApi";
import { DEFAULT_DAILY_GOAL, TIMER_STORAGE_KEY } from "@/lib/deep-work/constants";
import { formatTimer, goalProgress, sessionElapsedSeconds } from "@/lib/deep-work/sessionUtils";

const DeepWorkSessionContext = createContext(null);

function persistSession(session) {
  if (typeof window === "undefined") return;
  if (session?.id && (session.status === "running" || session.status === "paused")) {
    localStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify({
        sessionId: session.id,
        taskId: session.task_id,
        projectTodoId: session.project_todo_id,
        startedAt: session.started_at,
        status: session.status,
        accumulatedSeconds: session.accumulated_seconds,
        lastResumedAt: session.last_resumed_at,
      })
    );
  } else {
    localStorage.removeItem(TIMER_STORAGE_KEY);
  }
}

export function DeepWorkSessionProvider({ children }) {
  const [activeSession, setActiveSession] = useState(null);
  const [settings, setSettings] = useState(null);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const goalMinutes = settings?.daily_goal_minutes || DEFAULT_DAILY_GOAL;

  const refresh = useCallback(async () => {
    try {
      const [session, sett, st] = await Promise.all([
        fetchActiveSession(),
        fetchSettings().catch(() => null),
        fetchStats().catch(() => null),
      ]);
      setActiveSession(session);
      setSettings(sett);
      setTodayMinutes(st?.todayMinutes || 0);
      persistSession(session);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!activeSession || activeSession.status === "ended") {
      setElapsedSeconds(0);
      return;
    }
    const tick = () => setElapsedSeconds(sessionElapsedSeconds(activeSession, new Date()));
    tick();
    if (activeSession.status !== "running") return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  const liveTodayMinutes = useMemo(() => {
    if (!activeSession) return todayMinutes;
    return Math.max(todayMinutes, Math.floor(elapsedSeconds / 60));
  }, [activeSession, elapsedSeconds, todayMinutes]);

  const progress = goalProgress(liveTodayMinutes, goalMinutes);
  const remainingSeconds = Math.max(0, goalMinutes * 60 - liveTodayMinutes * 60);

  const beginSession = useCallback(
    async (payload = {}) => {
      setBusy(true);
      try {
        const session = await startSession(payload);
        setActiveSession(session);
        persistSession(session);
        await refresh();
        return session;
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  const pause = useCallback(async () => {
    if (!activeSession?.id) return;
    setBusy(true);
    try {
      const session = await pauseSession(activeSession.id);
      setActiveSession(session);
      persistSession(session);
    } finally {
      setBusy(false);
    }
  }, [activeSession]);

  const resume = useCallback(async () => {
    if (!activeSession?.id) return;
    setBusy(true);
    try {
      const session = await resumeSession(activeSession.id);
      setActiveSession(session);
      persistSession(session);
    } finally {
      setBusy(false);
    }
  }, [activeSession]);

  const stop = useCallback(async () => {
    if (!activeSession?.id) return;
    setBusy(true);
    try {
      await stopSession(activeSession.id);
      setActiveSession(null);
      persistSession(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [activeSession, refresh]);

  const reset = useCallback(async () => {
    if (!activeSession?.id) return;
    setBusy(true);
    try {
      const session = await resetSession(activeSession.id);
      setActiveSession(session);
      persistSession(session);
    } finally {
      setBusy(false);
    }
  }, [activeSession]);

  const togglePause = useCallback(async () => {
    if (!activeSession) return;
    if (activeSession.status === "paused") return resume();
    if (activeSession.status === "running") return pause();
  }, [activeSession, pause, resume]);

  const value = useMemo(
    () => ({
      activeSession,
      settings,
      goalMinutes,
      todayMinutes: liveTodayMinutes,
      elapsedSeconds,
      remainingSeconds,
      progress,
      timerLabel: formatTimer(elapsedSeconds),
      remainingLabel: formatTimer(remainingSeconds),
      loading,
      busy,
      isRunning: activeSession?.status === "running",
      isPaused: activeSession?.status === "paused",
      hasSession: Boolean(activeSession && (activeSession.status === "running" || activeSession.status === "paused")),
      refresh,
      beginSession,
      pause,
      resume,
      stop,
      reset,
      togglePause,
    }),
    [
      activeSession,
      settings,
      goalMinutes,
      liveTodayMinutes,
      elapsedSeconds,
      remainingSeconds,
      progress,
      loading,
      busy,
      refresh,
      beginSession,
      pause,
      resume,
      stop,
      reset,
      togglePause,
    ]
  );

  return <DeepWorkSessionContext.Provider value={value}>{children}</DeepWorkSessionContext.Provider>;
}

export function useDeepWorkSession() {
  const ctx = useContext(DeepWorkSessionContext);
  if (!ctx) throw new Error("useDeepWorkSession DeepWorkSessionProvider içinde kullanılmalı");
  return ctx;
}

export function useDeepWorkSessionOptional() {
  return useContext(DeepWorkSessionContext);
}
