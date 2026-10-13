import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { emptyCanvasData } from "@/lib/roadmap/constants";
import { normalizeCanvasData } from "@/lib/roadmap/utils";
import {
  backupRoadmapRevision,
  getRevisionCanvas,
  listRoadmapRevisions,
} from "@/lib/roadmap/revisionsServer";

export async function GET() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  try {
    const data = await listRoadmapRevisions(supabase, { userId: user.id });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json();
  const source = body.source === "daily" ? "daily" : "revision";
  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  try {
    const { data: current } = await supabase
      .from("user_roadmaps")
      .select("canvas_data")
      .eq("user_id", user.id)
      .maybeSingle();

    if (current?.canvas_data) {
      await backupRoadmapRevision(supabase, {
        userId: user.id,
        canvasData: current.canvas_data,
      });
    }

    const canvas_data = await getRevisionCanvas(supabase, {
      userId: user.id,
      source,
      id,
    });

    const { data, error } = await supabase
      .from("user_roadmaps")
      .upsert(
        {
          user_id: user.id,
          canvas_data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
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
