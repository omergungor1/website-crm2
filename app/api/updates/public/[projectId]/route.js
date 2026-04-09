import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();

  if (!project) return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });

  const body = await request.json();
  const { pages, description, image_urls } = body;

  if (!description?.trim()) {
    return NextResponse.json({ error: "Açıklama gerekli" }, { status: 400 });
  }

  const { data: req, error } = await supabase
    .from("update_requests")
    .insert({
      project_id: projectId,
      pages: pages || [],
      description: description.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (image_urls?.length) {
    await supabase.from("update_request_images").insert(
      image_urls.map((url) => ({ update_request_id: req.id, image_url: url }))
    );
  }

  return NextResponse.json(req, { status: 201 });
}
