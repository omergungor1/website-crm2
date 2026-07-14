import { NextResponse } from "next/server";
import { requireDeepWorkUser } from "@/lib/deep-work/auth";
import { minutesBetween } from "@/lib/deep-work/dateUtils";
import { sessionElapsedSeconds } from "@/lib/deep-work/sessionUtils";

const SESSION_SELECT =
  "*, deep_work_tasks(id, title), project_todos(id, title, project_id, projects(id, name))";

async function closeActiveSessions(supabase, userId) {
  const { data: activeSessions } = await supabase
    .from("deep_work_sessions")
    .select("*")
    .eq("user_id", userId)
    .is("ended_at", null)
    .in("status", ["running", "paused"]);

  const now = new Date();
  for (const active of activeSessions || []) {
    const elapsedSec = sessionElapsedSeconds(active, now);
    const duration = Math.max(1, Math.round(elapsedSec / 60)) || minutesBetween(active.started_at, now);
    await supabase
      .from("deep_work_sessions")
      .update({
        ended_at: now.toISOString(),
        duration_minutes: duration,
        accumulated_seconds: elapsedSec,
        status: "ended",
        paused_at: null,
      })
      .eq("id", active.id);

    if (active.session_type === "focus" && active.task_id) {
      const { data: task } = await supabase
        .from("deep_work_tasks")
        .select("worked_minutes")
        .eq("id", active.task_id)
        .maybeSingle();
      if (task) {
        await supabase
          .from("deep_work_tasks")
          .update({
            worked_minutes: (task.worked_minutes || 0) + duration,
            updated_at: now.toISOString(),
          })
          .eq("id", active.task_id);
      }
    }
  }
}

export async function GET(request) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "1";

  let query = supabase
    .from("deep_work_sessions")
    .select(SESSION_SELECT)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (activeOnly) {
    query = query.is("ended_at", null).in("status", ["running", "paused"]);
  }

  const { data, error } = await query.limit(activeOnly ? 1 : 50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(activeOnly ? data?.[0] || null : data || []);
}

export async function POST(request) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const body = await request.json().catch(() => ({}));
  const { task_id = null, project_todo_id = null, session_type = "focus" } = body || {};

  if (project_todo_id) {
    const { data: todo } = await supabase
      .from("project_todos")
      .select("id, projects!inner(user_id)")
      .eq("id", project_todo_id)
      .single();
    if (!todo || todo.projects?.user_id !== user.id) {
      return NextResponse.json({ error: "Todo bulunamadı" }, { status: 404 });
    }
  }

  if (task_id) {
    const { data: task } = await supabase
      .from("deep_work_tasks")
      .select("id")
      .eq("id", task_id)
      .eq("user_id", user.id)
      .single();
    if (!task) return NextResponse.json({ error: "Görev bulunamadı" }, { status: 404 });
  }

  await closeActiveSessions(supabase, user.id);

  if (task_id) {
    await supabase
      .from("deep_work_tasks")
      .update({ status: "doing", updated_at: new Date().toISOString() })
      .eq("id", task_id)
      .eq("user_id", user.id)
      .neq("status", "done");
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("deep_work_sessions")
    .insert({
      user_id: user.id,
      task_id,
      project_todo_id,
      session_type,
      status: "running",
      started_at: nowIso,
      last_resumed_at: nowIso,
      accumulated_seconds: 0,
    })
    .select(SESSION_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
