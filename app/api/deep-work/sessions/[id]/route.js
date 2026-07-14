import { NextResponse } from "next/server";
import { requireDeepWorkUser } from "@/lib/deep-work/auth";
import { sessionElapsedSeconds } from "@/lib/deep-work/sessionUtils";

const SESSION_SELECT =
  "*, deep_work_tasks(id, title), project_todos(id, title, project_id, projects(id, name))";

export async function PATCH(request, { params }) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const action = body.action || "stop";

  const { data: session, error: fetchErr } = await supabase
    .from("deep_work_sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !session) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 404 });
  }

  if (session.status === "ended" || session.ended_at) {
    return NextResponse.json({ error: "Oturum zaten sonlanmış" }, { status: 400 });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  let updates = {};

  if (action === "pause") {
    if (session.status !== "running") {
      return NextResponse.json({ error: "Oturum çalışmıyor" }, { status: 400 });
    }
    const elapsed = sessionElapsedSeconds(session, now);
    updates = {
      status: "paused",
      paused_at: nowIso,
      accumulated_seconds: elapsed,
      last_resumed_at: null,
    };
  } else if (action === "resume") {
    if (session.status !== "paused") {
      return NextResponse.json({ error: "Oturum duraklatılmamış" }, { status: 400 });
    }
    updates = {
      status: "running",
      paused_at: null,
      last_resumed_at: nowIso,
    };
  } else if (action === "reset") {
    updates = {
      status: "running",
      accumulated_seconds: 0,
      started_at: nowIso,
      last_resumed_at: nowIso,
      paused_at: null,
    };
  } else if (action === "stop") {
    const elapsedSec = sessionElapsedSeconds(session, now);
    const duration = Math.max(0, Math.round(elapsedSec / 60));
    updates = {
      status: "ended",
      ended_at: nowIso,
      duration_minutes: duration,
      accumulated_seconds: elapsedSec,
      paused_at: null,
    };

    if (session.session_type === "focus" && session.task_id) {
      const { data: task } = await supabase
        .from("deep_work_tasks")
        .select("worked_minutes")
        .eq("id", session.task_id)
        .maybeSingle();
      if (task) {
        await supabase
          .from("deep_work_tasks")
          .update({
            worked_minutes: (task.worked_minutes || 0) + duration,
            updated_at: nowIso,
          })
          .eq("id", session.task_id);
      }
    }
  } else {
    return NextResponse.json({ error: "Geçersiz action" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("deep_work_sessions")
    .update(updates)
    .eq("id", id)
    .select(SESSION_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
