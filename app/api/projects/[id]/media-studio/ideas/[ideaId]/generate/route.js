import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getProjectAccess } from "@/lib/mediaStudio/access";
import { generateMediaStudioPrompts } from "@/lib/mediaStudio/generate";

export const maxDuration = 60;

export async function POST(_request, { params }) {
  const { id: projectId, ideaId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data: idea, error: ideaError } = await supabase
    .from("media_content_ideas")
    .select("*")
    .eq("id", ideaId)
    .eq("project_id", projectId)
    .single();

  if (ideaError || !idea) {
    return NextResponse.json({ error: "İçerik bulunamadı" }, { status: 404 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, description, logo_url, type")
    .eq("id", projectId)
    .single();

  const brandKit = idea.brand_snapshot || null;

  try {
    const generated = await generateMediaStudioPrompts({ project, brandKit, idea });

    await supabase.from("media_prompts").delete().eq("content_idea_id", ideaId);

    const rows = generated.items.map((item) => ({
      content_idea_id: ideaId,
      project_id: projectId,
      sequence_number: item.sequence,
      title: item.title,
      target_platform: item.targetPlatform,
      media_type: item.mediaType,
      prompt_text: item.prompt,
      negative_prompt: item.negativePrompt,
      metadata: item.metadata,
      status: "pending",
    }));

    if (rows.length === 0) {
      return NextResponse.json({ error: "Prompt üretilemedi" }, { status: 500 });
    }

    const { data: prompts, error: promptError } = await supabase
      .from("media_prompts")
      .insert(rows)
      .select("*");

    if (promptError) {
      return NextResponse.json({ error: promptError.message }, { status: 500 });
    }

    const { data: updatedIdea, error: updateError } = await supabase
      .from("media_content_ideas")
      .update({
        title: generated.contentTitle || idea.title,
        plan: generated.plan,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", ideaId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      idea: updatedIdea,
      prompts: prompts || [],
      creativeStrategy: generated.creativeStrategy,
      brandGuidelines: generated.brandGuidelines,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Üretim başarısız" },
      { status: 500 }
    );
  }
}
