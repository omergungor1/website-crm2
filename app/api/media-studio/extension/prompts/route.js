import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function clientFromAuthHeader(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return { supabase: null, token: null };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status") || "pending";
  if (!projectId) {
    return NextResponse.json({ error: "projectId gerekli" }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id, name")
    .eq("id", projectId)
    .single();

  if (!project || project.user_id !== userData.user.id) {
    // admin bypass via profiles role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
    }
  }

  let query = supabase
    .from("media_prompts")
    .select("id, title, prompt_text, status, sequence_number, target_platform, media_type, media_content_ideas(title, content_type)")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
