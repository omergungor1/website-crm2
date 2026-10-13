import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function clientFromAuthHeader(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return { supabase: null, token: null };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { supabase: null, token: null };
  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { supabase, token };
}

export async function GET(request) {
  const { supabase, token } = clientFromAuthHeader(request);
  if (!supabase || !token) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawProjectId = searchParams.get("projectId");
  const projectId = rawProjectId && rawProjectId !== "all" ? rawProjectId : null;
  const status = searchParams.get("status") || "pending";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  let projectIds = null;
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .maybeSingle();
    if (!project || (!isAdmin && project.user_id !== userData.user.id)) {
      return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
    }
    projectIds = [projectId];
  } else if (!isAdmin) {
    const { data: ownProjects, error: projectsError } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("is_archived", false);
    if (projectsError) return NextResponse.json({ error: projectsError.message }, { status: 500 });
    projectIds = (ownProjects || []).map((p) => p.id);
    if (!projectIds.length) return NextResponse.json([]);
  }

  let query = supabase
    .from("media_prompts")
    .select(
      "id, project_id, title, prompt_text, status, sequence_number, target_platform, media_type, metadata, media_content_ideas(title, content_type), projects(name)"
    )
    .order("updated_at", { ascending: false })
    .limit(projectId ? 50 : 100);

  if (projectIds) query = query.in("project_id", projectIds);
  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
