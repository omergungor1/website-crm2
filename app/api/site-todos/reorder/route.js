import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";

export async function PUT(request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { ordered_ids } = await request.json();
  if (!Array.isArray(ordered_ids) || ordered_ids.length === 0) {
    return NextResponse.json({ error: "ordered_ids gerekli" }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("site_todos")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .eq("is_later", false)
    .eq("is_deleted", false);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const existingIds = new Set((existing || []).map((t) => t.id));
  if (ordered_ids.length !== existingIds.size || ordered_ids.some((id) => !existingIds.has(id))) {
    return NextResponse.json({ error: "Geçersiz sıralama listesi" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const updates = ordered_ids.map((id, index) =>
    supabase
      .from("site_todos")
      .update({ sort_order: index, updated_at: now })
      .eq("id", id)
      .eq("user_id", user.id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

  const { data, error } = await supabase
    .from("site_todos")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .eq("is_later", false)
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
