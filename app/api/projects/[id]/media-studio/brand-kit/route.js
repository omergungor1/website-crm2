import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getProjectAccess } from "@/lib/mediaStudio/access";

export async function GET(_request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data, error } = await supabase
    .from("media_brand_kits")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || null);
}

export async function PUT(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const payload = {
    project_id: projectId,
    display_name: body.display_name ?? null,
    colors: body.colors || {},
    tone: body.tone ?? null,
    personality: body.personality ?? null,
    visual_style: body.visual_style ?? null,
    typography: body.typography || {},
    logo_rules: body.logo_rules || {},
    slogan: body.slogan ?? null,
    keywords: Array.isArray(body.keywords) ? body.keywords : [],
    prohibited_terms: Array.isArray(body.prohibited_terms) ? body.prohibited_terms : [],
    guidelines: body.guidelines ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("media_brand_kits")
    .upsert(payload, { onConflict: "project_id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
