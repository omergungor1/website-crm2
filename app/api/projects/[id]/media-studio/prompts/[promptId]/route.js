import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getProjectAccess } from "@/lib/mediaStudio/access";

async function refreshIdeaStatus(supabase, ideaId) {
  const { data: prompts } = await supabase
    .from("media_prompts")
    .select("status")
    .eq("content_idea_id", ideaId);

  if (!prompts?.length) return;

  const allDone = prompts.every((p) => p.status === "completed" || p.status === "skipped");
  const anyActive = prompts.some((p) => p.status === "in_progress" || p.status === "completed");

  let status = "ready";
  if (allDone) status = "completed";
  else if (anyActive) status = "in_progress";

  await supabase
    .from("media_content_ideas")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", ideaId)
    .neq("status", "archived");
}

export async function PATCH(request, { params }) {
  const { id: projectId, promptId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data: existing, error: existingError } = await supabase
    .from("media_prompts")
    .select("*")
    .eq("id", promptId)
    .eq("project_id", projectId)
    .single();

  if (existingError || !existing) {
    return NextResponse.json({ error: "Prompt bulunamadı" }, { status: 404 });
  }

  const body = await request.json();
  const updates = { updated_at: new Date().toISOString() };
  for (const key of ["title", "prompt_text", "negative_prompt", "status", "metadata"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (body.status === "completed") updates.completed_at = new Date().toISOString();
  if (body.status && body.status !== "completed") updates.completed_at = null;

  const { data, error } = await supabase
    .from("media_prompts")
    .update(updates)
    .eq("id", promptId)
    .eq("project_id", projectId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.status && body.status !== existing.status) {
    await supabase.from("media_prompt_events").insert({
      prompt_id: promptId,
      actor_id: user.id,
      event_type: "status_change",
      previous_status: existing.status,
      new_status: body.status,
    });
    await refreshIdeaStatus(supabase, existing.content_idea_id);
  }

  return NextResponse.json(data);
}
