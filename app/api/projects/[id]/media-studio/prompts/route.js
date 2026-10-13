import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getProjectAccess } from "@/lib/mediaStudio/access";

export async function GET(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const platform = searchParams.get("platform");
  const q = String(searchParams.get("q") || "").trim();

  let query = supabase
    .from("media_prompts")
    .select("*, media_content_ideas(id, title, content_type, status)")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (platform) query = query.eq("target_platform", platform);
  if (q) query = query.or(`title.ilike.%${q}%,prompt_text.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
