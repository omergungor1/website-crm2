import { NextResponse } from "next/server";
import { requireDeepWorkUser } from "@/lib/deep-work/auth";
import { lastNDateStrs, startOfMonth, startOfWeek, todayDateStr, toDateStr } from "@/lib/deep-work/dateUtils";
import { DEFAULT_DAILY_GOAL } from "@/lib/deep-work/constants";
import { sessionElapsedSeconds } from "@/lib/deep-work/sessionUtils";

export async function GET() {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const weekStart = startOfWeek().toISOString();
  const monthStart = startOfMonth().toISOString();
  const today = todayDateStr();
  const last7 = lastNDateStrs(7);
  const rangeStart = `${last7[0]}T00:00:00`;

  const { data: sessions } = await supabase
    .from("deep_work_sessions")
    .select(
      "duration_minutes, started_at, ended_at, status, accumulated_seconds, last_resumed_at, session_type, task_id, project_todo_id, deep_work_tasks(project_id, projects(name)), project_todos(project_id, projects(name))"
    )
    .eq("user_id", user.id)
    .eq("session_type", "focus")
    .gte("started_at", rangeStart);

  const { data: settings } = await supabase
    .from("deep_work_settings")
    .select("daily_goal_minutes")
    .eq("user_id", user.id)
    .maybeSingle();

  const goal = settings?.daily_goal_minutes || DEFAULT_DAILY_GOAL;
  const now = new Date();

  function sessionMinutes(s) {
    if (s.ended_at || s.status === "ended") return s.duration_minutes || 0;
    return Math.round(sessionElapsedSeconds(s, now) / 60);
  }

  const dayMap = {};
  for (const key of last7) dayMap[key] = 0;

  for (const s of sessions || []) {
    const key = toDateStr(s.started_at);
    if (key in dayMap) dayMap[key] += sessionMinutes(s);
  }

  const daily = last7.map((date) => {
    const minutes = dayMap[date] || 0;
    const percent = Math.round((minutes / goal) * 100);
    return {
      date,
      minutes,
      percent,
      delta: percent - 100,
    };
  });

  const totalLast7 = daily.reduce((sum, d) => sum + d.minutes, 0);
  const avgMinutes = Math.round(totalLast7 / 7);
  const avgPercent = Math.round((avgMinutes / goal) * 100);

  const weekMinutes = (sessions || [])
    .filter((s) => new Date(s.started_at) >= new Date(weekStart))
    .reduce((sum, s) => sum + sessionMinutes(s), 0);

  const monthMinutes = (sessions || [])
    .filter((s) => new Date(s.started_at) >= new Date(monthStart))
    .reduce((sum, s) => sum + sessionMinutes(s), 0);

  const todayMinutes = dayMap[today] || 0;

  const projectMap = {};
  for (const s of sessions || []) {
    const name =
      s.project_todos?.projects?.name ||
      s.deep_work_tasks?.projects?.name ||
      "Genel";
    projectMap[name] = (projectMap[name] || 0) + sessionMinutes(s);
  }
  const topProjects = Object.entries(projectMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, minutes]) => ({ name, minutes }));

  const workDays = new Set(
    (sessions || [])
      .filter((s) => sessionMinutes(s) > 0)
      .map((s) => toDateStr(s.started_at))
      .filter(Boolean)
  );

  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const key = toDateStr(cursor);
    if (workDays.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0 && key === today) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  const { data: completedTodos } = await supabase
    .from("project_todos")
    .select("id, completed_at, planned_date, projects!inner(user_id)")
    .eq("is_completed", true)
    .eq("projects.user_id", user.id)
    .not("completed_at", "is", null);

  const completedByDay = {};
  for (const t of completedTodos || []) {
    const key = toDateStr(t.completed_at) || t.planned_date;
    if (!key) continue;
    if (!completedByDay[key]) completedByDay[key] = 0;
    completedByDay[key] += 1;
  }

  return NextResponse.json({
    weekMinutes,
    monthMinutes,
    totalMinutes: totalLast7,
    todayMinutes,
    completedCount: (completedTodos || []).length,
    streak,
    topProjects,
    goalMinutes: goal,
    avgMinutes,
    avgPercent,
    avgDelta: avgPercent - 100,
    daily,
    completedByDay,
  });
}
