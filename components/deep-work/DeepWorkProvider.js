"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchBoard, moveBoardTodo, fetchStats } from "@/lib/deep-work/clientApi";
import { useDeepWorkSession } from "@/components/deep-work/DeepWorkSessionProvider";

const DeepWorkContext = createContext(null);

export function DeepWorkProvider({ children }) {
  const {
    refresh: refreshSession,
    activeSession,
    settings,
    goalMinutes,
    todayMinutes,
    elapsedSeconds,
    remainingSeconds,
    progress,
    timerLabel,
    remainingLabel,
    loading: sessionLoading,
    busy,
    isRunning,
    isPaused,
    hasSession,
    beginSession,
    pause,
    resume,
    stop,
    reset,
    togglePause,
  } = useDeepWorkSession();

  const [board, setBoard] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openProjects, setOpenProjects] = useState({});

  const reload = useCallback(async (range) => {
    try {
      const [b, st] = await Promise.all([
        fetchBoard(range || {}),
        fetchStats(),
      ]);
      setBoard(b);
      setStats(st);
      setError("");
      await refreshSession();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [refreshSession]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggleProject = useCallback((projectId) => {
    setOpenProjects((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
  }, []);

  const openProject = useCallback((projectId) => {
    if (!projectId) return;
    setOpenProjects((prev) => ({ ...prev, [projectId]: true }));
  }, []);

  const assignTodo = useCallback(
    async ({ todoId, plannedDate, toBacklog, isCompleted }) => {
      const payload = { todo_id: todoId };
      if (toBacklog) payload.to_backlog = true;
      if (plannedDate !== undefined) payload.planned_date = plannedDate;
      if (isCompleted !== undefined) payload.is_completed = isCompleted;
      await moveBoardTodo(payload);
      await reload();
    },
    [reload]
  );

  const loadRange = useCallback(
    async (from, to) => {
      const b = await fetchBoard({ from, to });
      setBoard((prev) => ({
        ...b,
        week: prev?.week || b.week,
        projects: prev?.projects || b.projects,
        dayMinutes: { ...(prev?.dayMinutes || {}), ...(b.dayMinutes || {}) },
        scheduled: mergeScheduled(prev?.scheduled, b.scheduled),
      }));
    },
    []
  );

  const value = useMemo(
    () => ({
      board,
      stats,
      loading: loading || sessionLoading,
      error,
      openProjects,
      toggleProject,
      openProject,
      assignTodo,
      reload,
      loadRange,
      activeSession,
      settings,
      goalMinutes,
      todayMinutes,
      elapsedSeconds,
      remainingSeconds,
      progress,
      timerLabel,
      remainingLabel,
      busy,
      isRunning,
      isPaused,
      hasSession,
      beginSession,
      pause,
      resume,
      stop,
      reset,
      togglePause,
    }),
    [
      board,
      stats,
      loading,
      sessionLoading,
      error,
      openProjects,
      toggleProject,
      openProject,
      assignTodo,
      reload,
      loadRange,
      activeSession,
      settings,
      goalMinutes,
      todayMinutes,
      elapsedSeconds,
      remainingSeconds,
      progress,
      timerLabel,
      remainingLabel,
      busy,
      isRunning,
      isPaused,
      hasSession,
      beginSession,
      pause,
      resume,
      stop,
      reset,
      togglePause,
    ]
  );

  return <DeepWorkContext.Provider value={value}>{children}</DeepWorkContext.Provider>;
}

function mergeScheduled(prev = [], next = []) {
  const map = new Map();
  for (const t of prev || []) map.set(t.id, t);
  for (const t of next || []) map.set(t.id, t);
  return Array.from(map.values());
}

export function useDeepWork() {
  const ctx = useContext(DeepWorkContext);
  if (!ctx) throw new Error("useDeepWork DeepWorkProvider içinde kullanılmalı");
  return ctx;
}
