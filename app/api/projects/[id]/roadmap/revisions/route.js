import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { normalizeCanvasData } from "@/lib/roadmap/utils";
import {
  backupRoadmapRevision,
  getRevisionCanvas,
  listRoadmapRevisions,
} from "@/lib/roadmap/revisionsServer";

async function getProjectAccess(supabase, user, admin, projectId) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();

  if (error || !project) return { project: null, allowed: false };
  if (admin || project.user_id === user.id) return { project, allowed: true };
  return { project, allowed: false };
}

export async function GET(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  try {
    const data = await listRoadmapRevisions(supabase, { userId: user.id, projectId });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const source = body.source === "daily" ? "daily" : "revision";
  const revisionId = String(body.id || "").trim();
  if (!revisionId) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  try {
    const { data: current } = await supabase
      .from("project_roadmaps")
      .select("canvas_data")
      .eq("project_id", projectId)
      .maybeSingle();

    if (current?.canvas_data) {
      await backupRoadmapRevision(supabase, {
        userId: user.id,
        projectId,
        canvasData: current.canvas_data,
      });
    }

    const canvas_data = await getRevisionCanvas(supabase, {
      userId: user.id,
      projectId,
      source,
      id: revisionId,
    });

    const { data, error } = await supabase
      .from("project_roadmaps")
      .upsert(
        {
          project_id: projectId,
          canvas_data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "project_id" }
      )
      .select("canvas_data, updated_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      canvas_data: normalizeCanvasData(data.canvas_data),
      updated_at: data.updated_at,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
