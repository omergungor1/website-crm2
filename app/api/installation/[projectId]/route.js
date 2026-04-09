import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

async function checkAccess(supabase, user, admin, projectId) {
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();
  if (!project) return false;
  return admin || project.user_id === user.id;
}

export async function GET(request, { params }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await checkAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data, error } = await supabase
    .from("installation_forms")
    .select("*")
    .eq("project_id", projectId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request, { params }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await checkAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const { data, error } = await supabase
    .from("installation_forms")
    .update(body)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
