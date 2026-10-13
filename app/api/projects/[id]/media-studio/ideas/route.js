import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getProjectAccess } from "@/lib/mediaStudio/access";

const VALID_TYPES = new Set(["free", "post", "story", "carousel", "video", "ad"]);

export async function GET(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = String(searchParams.get("q") || "").trim();

  let query = supabase
    .from("media_content_ideas")
    .select("*, media_prompts(id, status, sequence_number, target_platform, media_type, title)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (status === "archived") query = query.eq("status", "archived");
  else if (status) query = query.eq("status", status).neq("status", "archived");
  else query = query.neq("status", "archived");

  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const contentType = String(body.content_type || "").trim();
  if (!VALID_TYPES.has(contentType)) {
    return NextResponse.json({ error: "Geçersiz içerik türü" }, { status: 400 });
  }

  const brief = String(body.creative_brief || "").trim();
  if (!brief) {
    return NextResponse.json({ error: "Yaratıcı brief gerekli" }, { status: 400 });
  }

  const { data: brandKit } = await supabase
    .from("media_brand_kits")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  const applyBrand = body.apply_brand_kit !== false;
  const title = String(body.title || "").trim() || `${contentType} içeriği`;

  const { data, error } = await supabase
    .from("media_content_ideas")
    .insert({
      project_id: projectId,
      created_by: user.id,
      title,
      content_type: contentType,
      creative_brief: brief,
      settings: body.settings || {},
      brand_snapshot: applyBrand ? brandKit || null : null,
      status: "draft",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
