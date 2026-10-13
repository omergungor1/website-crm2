import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(request, { params }) {
  const { promptId } = await params;
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: "Yapılandırma eksik" }, { status: 500 });

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await request.json();
  const status = body.status;
  if (!["pending", "in_progress", "completed", "skipped"].includes(status)) {
    return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
  }

  const { data: prompt } = await supabase
    .from("media_prompts")
    .select("id, project_id")
    .eq("id", promptId)
    .single();

  if (!prompt) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", prompt.project_id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (project?.user_id !== userData.user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
  }

  const updates = {
    status,
    updated_at: new Date().toISOString(),
    completed_at: status === "completed" ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from("media_prompts")
    .update(updates)
    .eq("id", promptId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
