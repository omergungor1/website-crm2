import { NextResponse } from "next/server";
import { requireDeepWorkUser } from "@/lib/deep-work/auth";

async function assertTodoAccess(supabase, user, admin, todoId) {
  const { data: todo, error } = await supabase
    .from("project_todos")
    .select("id, project_id, planned_date, is_completed, title, board_sort_order, projects(id, user_id, name)")
    .eq("id", todoId)
    .eq("is_deleted", false)
    .single();

  if (error || !todo) return { error: NextResponse.json({ error: "Todo bulunamadı" }, { status: 404 }) };
  if (!admin && todo.projects?.user_id !== user.id) {
    return { error: NextResponse.json({ error: "Erişim yok" }, { status: 403 }) };
  }
  return { todo };
}

async function applyBoardOrder(supabase, user, admin, orderedIds, plannedDate) {
  const now = new Date().toISOString();
  for (let index = 0; index < orderedIds.length; index += 1) {
    const id = orderedIds[index];
    const access = await assertTodoAccess(supabase, user, admin, id);
    if (access.error) return access.error;

    const updates = {
      board_sort_order: index,
      updated_at: now,
    };
    if (plannedDate !== undefined) {
      updates.planned_date = plannedDate || null;
    }

    const { error } = await supabase.from("project_todos").update(updates).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return null;
}

export async function PUT(request) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user, admin } = auth;

  const body = await request.json();
  const { todo_id, planned_date, is_completed, to_backlog, ordered_ids } = body || {};

  if (Array.isArray(ordered_ids) && ordered_ids.length) {
    const orderError = await applyBoardOrder(
      supabase,
      user,
      admin,
      ordered_ids,
      to_backlog ? null : planned_date
    );
    if (orderError) return orderError;

    if (todo_id && is_completed !== undefined) {
      const access = await assertTodoAccess(supabase, user, admin, todo_id);
      if (access.error) return access.error;
      const updates = {
        is_completed: Boolean(is_completed),
        completed_at: is_completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("project_todos").update(updates).eq("id", todo_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

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

    if (planned_date) {
      const { data: siblings } = await supabase
        .from("project_todos")
        .select("board_sort_order")
        .eq("planned_date", planned_date)
        .eq("is_deleted", false)
        .eq("is_completed", false)
        .neq("id", todo_id)
        .order("board_sort_order", { ascending: false })
        .limit(1);

      updates.board_sort_order = (siblings?.[0]?.board_sort_order ?? -1) + 1;
    }
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
