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

  const [{ data: ideas }, { data: prompts }] = await Promise.all([
    supabase.from("media_content_ideas").select("id, status").eq("project_id", projectId),
    supabase.from("media_prompts").select("id, status").eq("project_id", projectId),
  ]);

  const ideaList = ideas || [];
  const promptList = prompts || [];

  return NextResponse.json({
    totalIdeas: ideaList.filter((i) => i.status !== "archived").length,
    pendingPrompts: promptList.filter((p) => p.status === "pending").length,
    inProgressPrompts: promptList.filter((p) => p.status === "in_progress").length,
    completedPrompts: promptList.filter((p) => p.status === "completed").length,
    archivedIdeas: ideaList.filter((i) => i.status === "archived").length,
  });
}
