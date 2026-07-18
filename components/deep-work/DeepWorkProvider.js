"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { fetchBoard, moveBoardTodo, fetchStats } from "@/lib/deep-work/clientApi";
import { useDeepWorkSession } from "@/components/deep-work/DeepWorkSessionProvider";

const DeepWorkContext = createContext(null);

function findTodoInBoard(board, todoId) {
  for (const p of board?.projects || []) {
    const found = (p.todos || []).find((t) => t.id === todoId);
    if (found) return { todo: found, source: "backlog" };
  }
  const scheduled = (board?.scheduled || []).find((t) => t.id === todoId);
  if (scheduled) return { todo: scheduled, source: "scheduled" };
  return null;
}

function cloneBoard(board) {
  return {
    ...board,
    projects: (board.projects || []).map((p) => ({
      ...p,
      todos: [...(p.todos || [])],
    })),
    scheduled: [...(board.scheduled || [])],
    dayMinutes: { ...(board.dayMinutes || {}) },
  };
}

function removeTodoEverywhere(board, todoId) {
  for (const p of board.projects) {
    p.todos = p.todos.filter((t) => t.id !== todoId);
  }
  board.scheduled = board.scheduled.filter((t) => t.id !== todoId);
}

function applyOptimisticBoardMove(board, { todoId, plannedDate, toBacklog, isCompleted, orderedIds }) {
  if (!board || !todoId) return board;

  const found = findTodoInBoard(board, todoId);
  if (!found) return board;

  const next = cloneBoard(board);
  const boardDates = new Set(next.week || []);
  let todo = { ...found.todo };

  if (toBacklog) {
    removeTodoEverywhere(next, todoId);
    todo = {
      ...todo,
      planned_date: null,
      is_completed: false,
      completed_at: null,
    };
    const project = next.projects.find((p) => p.id === todo.project_id);
    if (project) project.todos = [...project.todos, todo];
    return next;
  }

  if (isCompleted !== undefined) {
    todo = {
      ...todo,
      is_completed: Boolean(isCompleted),
      completed_at: isCompleted ? new Date().toISOString() : null,
    };
    if (isCompleted && !todo.planned_date && plannedDate === undefined) {
      todo.planned_date = next.today || null;
    }
  }

  if (plannedDate !== undefined) {
    todo = { ...todo, planned_date: plannedDate || null };
  }

  if (orderedIds?.length && plannedDate) {
    const lookup = new Map();
    for (const p of board.projects || []) {
      for (const t of p.todos || []) lookup.set(t.id, t);
    }
    for (const t of board.scheduled || []) lookup.set(t.id, t);
    lookup.set(todoId, todo);

    const orderedSet = new Set(orderedIds);
    removeTodoEverywhere(next, todoId);
    for (const id of orderedIds) {
      if (id !== todoId) removeTodoEverywhere(next, id);
    }

    const orderedTodos = orderedIds
      .map((id, index) => {
        const base = lookup.get(id);
        if (!base) return null;
        return {
          ...base,
          ...(id === todoId ? todo : {}),
          planned_date: plannedDate,
          board_sort_order: index,
        };
      })
      .filter(Boolean);

    next.scheduled = [
      ...next.scheduled.filter(
        (t) => !orderedSet.has(t.id) && (t.planned_date !== plannedDate || t.is_completed)
      ),
      ...orderedTodos,
    ];
    return next;
  }

  removeTodoEverywhere(next, todoId);

  const onBoardWeek = todo.planned_date && boardDates.has(todo.planned_date);
  if (onBoardWeek || todo.is_completed) {
    next.scheduled = [...next.scheduled, todo];
  } else {
    const project = next.projects.find((p) => p.id === todo.project_id);
    if (project) project.todos = [...project.todos, todo];
  }

  return next;
}

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
    setOpenProjects((prev) => {
      if (prev[projectId]) return {};
      return { [projectId]: true };
    });
  }, []);

  const openProject = useCallback((projectId) => {
    if (!projectId) return;
    setOpenProjects({ [projectId]: true });
  }, []);

  const assignTodo = useCallback(async ({ todoId, plannedDate, toBacklog, isCompleted, orderedIds }) => {
    const payload = { todo_id: todoId };
    if (toBacklog) payload.to_backlog = true;
    if (plannedDate !== undefined) payload.planned_date = plannedDate;
    if (isCompleted !== undefined) payload.is_completed = isCompleted;
    if (orderedIds?.length) payload.ordered_ids = orderedIds;

    let snapshot = null;
    setBoard((current) => {
      snapshot = current;
      return applyOptimisticBoardMove(current, {
        todoId,
        plannedDate,
        toBacklog,
        isCompleted,
        orderedIds,
      });
    });

    try {
      await moveBoardTodo(payload);
    } catch (e) {
      if (snapshot) setBoard(snapshot);
      toast.error(e.message || "Taşıma kaydedilemedi");
      throw e;
    }
  }, []);

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
