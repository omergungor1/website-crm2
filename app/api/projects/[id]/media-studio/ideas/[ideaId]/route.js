import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getProjectAccess } from "@/lib/mediaStudio/access";

export async function GET(_request, { params }) {
  const { id: projectId, ideaId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data, error } = await supabase
    .from("media_content_ideas")
    .select("*, media_prompts(*), media_prompt_assets(*)")
    .eq("id", ideaId)
    .eq("project_id", projectId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request, { params }) {
  const { id: projectId, ideaId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const updates = { updated_at: new Date().toISOString() };
  for (const key of ["title", "creative_brief", "settings", "plan", "status"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (body.status === "archived") updates.archived_at = new Date().toISOString();
  if (body.status && body.status !== "archived") updates.archived_at = null;

  const { data, error } = await supabase
    .from("media_content_ideas")
    .update(updates)
    .eq("id", ideaId)
    .eq("project_id", projectId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request, { params }) {
  const { id: projectId, ideaId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { error } = await supabase
    .from("media_content_ideas")
    .delete()
    .eq("id", ideaId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
