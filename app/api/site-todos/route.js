import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";

export async function GET() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("site_todos")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { title, color } = await request.json();
  const trimmed = String(title || "").trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Todo metni gerekli" }, { status: 400 });
  }

  const allowedColors = ["blue", "amber", "rose"];
  let todoColor = null;
  if (color && allowedColors.includes(color)) {
    todoColor = color;
  }

  const { data: lastTodo } = await supabase
    .from("site_todos")
    .select("sort_order")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .eq("is_later", false)
    .eq("is_deleted", false)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (lastTodo?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("site_todos")
    .insert({ user_id: user.id, title: trimmed, sort_order, color: todoColor })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
