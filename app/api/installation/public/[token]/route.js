import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("installation_forms")
    .select("*")
    .eq("public_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Form bulunamadı" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PUT(request, { params }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("installation_forms")
    .select("id, is_completed")
    .eq("public_token", token)
    .single();

  if (!form) return NextResponse.json({ error: "Form bulunamadı" }, { status: 404 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("installation_forms")
    .update(body)
    .eq("public_token", token)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
