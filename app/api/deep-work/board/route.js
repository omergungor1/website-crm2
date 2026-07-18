import { NextResponse } from "next/server";
import { requireDeepWorkUser } from "@/lib/deep-work/auth";
import { boardWeekDates, toDateStr, todayDateStr } from "@/lib/deep-work/dateUtils";

export async function GET(request) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user, admin } = auth;

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  let projectsQuery = supabase
    .from("projects")
    .select("id, name, is_archived")
    .order("name", { ascending: true });

  if (!admin) {
    projectsQuery = projectsQuery.eq("user_id", user.id);
  }

  const { data: projects, error: projErr } = await projectsQuery;
  if (projErr) return NextResponse.json({ error: projErr.message }, { status: 500 });

  const projectIds = (projects || []).filter((p) => !p.is_archived).map((p) => p.id);
  const week = boardWeekDates();
  const weekStrs = week.map((d) => toDateStr(d));
  const rangeStart = fromParam || weekStrs[0];
  const rangeEnd = toParam || weekStrs[weekStrs.length - 1];

  let todos = [];
  if (projectIds.length) {
    const { data, error } = await supabase
      .from("project_todos")
      .select("*")
      .in("project_id", projectIds)
      .eq("is_deleted", false)
      .eq("is_archived", false)
      .eq("is_later", false)
      .order("board_sort_order", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    todos = data || [];
  }

  const sessionStart = `${rangeStart}T00:00:00`;
  const sessionEnd = `${rangeEnd}T23:59:59`;

  const { data: sessions } = await supabase
    .from("deep_work_sessions")
    .select("duration_minutes, started_at, ended_at, status, accumulated_seconds, last_resumed_at, session_type")
    .eq("user_id", user.id)
    .eq("session_type", "focus")
    .gte("started_at", sessionStart)
    .lte("started_at", sessionEnd);

  const dayMinutes = {};
  const now = new Date();
  for (const s of sessions || []) {
    const key = toDateStr(s.started_at);
    if (!key || key < rangeStart || key > rangeEnd) continue;
    if (!(key in dayMinutes)) dayMinutes[key] = 0;
    if (s.ended_at || s.status === "ended") {
      dayMinutes[key] += s.duration_minutes || 0;
      continue;
    }
    const accumulated = Number(s.accumulated_seconds) || 0;
    let live = 0;
    if (s.status === "running") {
      const resumeAt = s.last_resumed_at || s.started_at;
      live = Math.max(0, Math.floor((now.getTime() - new Date(resumeAt).getTime()) / 1000));
    }
    dayMinutes[key] += Math.round((accumulated + live) / 60);
  }
  for (const key of weekStrs) {
    if (!(key in dayMinutes)) dayMinutes[key] = 0;
  }

  // Board sütunları: yalnızca dün/bugün/yarın
  const boardDates = new Set(weekStrs);

  // Bekleyen: planı yok VEYA planı board dışı + tamamlanmamış
  const backlog = todos.filter((t) => {
    if (t.is_completed) return false;
    if (!t.planned_date) return true;
    return !boardDates.has(t.planned_date);
  });

  // Takvim / özel aralık için planlı todolar (board + ay görünümü)
  const scheduled = todos.filter((t) => {
    if (!t.planned_date) return false;
    return t.planned_date >= rangeStart && t.planned_date <= rangeEnd;
  });

  const byProject = {};
  for (const p of projects || []) {
    if (p.is_archived) continue;
    byProject[p.id] = {
      id: p.id,
      name: p.name,
      todos: backlog.filter((t) => t.project_id === p.id),
    };
  }

  return NextResponse.json({
    today: todayDateStr(),
    week: weekStrs,
    range: { from: rangeStart, to: rangeEnd },
    projects: Object.values(byProject),
    scheduled,
    dayMinutes,
  });
}
