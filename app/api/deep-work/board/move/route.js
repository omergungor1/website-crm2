import { NextResponse } from "next/server";
import { requireDeepWorkUser } from "@/lib/deep-work/auth";

async function assertTodoAccess(supabase, user, admin, todoId) {
  const { data: todo, error } = await supabase
    .from("project_todos")
    .select("id, project_id, planned_date, is_completed, title, projects(id, user_id, name)")
    .eq("id", todoId)
    .eq("is_deleted", false)
    .single();

  if (error || !todo) return { error: NextResponse.json({ error: "Todo bulunamadı" }, { status: 404 }) };
  if (!admin && todo.projects?.user_id !== user.id) {
    return { error: NextResponse.json({ error: "Erişim yok" }, { status: 403 }) };
  }
  return { todo };
}

export async function PUT(request) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user, admin } = auth;

  const body = await request.json();
  const { todo_id, planned_date, is_completed, to_backlog } = body || {};

  if (!todo_id) {
    return NextResponse.json({ error: "todo_id gerekli" }, { status: 400 });
  }

  const access = await assertTodoAccess(supabase, user, admin, todo_id);
  if (access.error) return access.error;

  const updates = { updated_at: new Date().toISOString() };

  if (to_backlog) {
    updates.planned_date = null;
    updates.is_completed = false;
    updates.completed_at = null;
  }

  if (planned_date !== undefined && !to_backlog) {
    updates.planned_date = planned_date || null;
  }

  if (is_completed !== undefined) {
    updates.is_completed = Boolean(is_completed);
    if (updates.is_completed) {
      updates.completed_at = new Date().toISOString();
      if (!access.todo.planned_date && !updates.planned_date) {
        const today = new Date();
        updates.planned_date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      }
    } else {
      updates.completed_at = null;
    }
  }

  const { data, error } = await supabase
    .from("project_todos")
    .update(updates)
    .eq("id", todo_id)
    .select("*, projects(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
