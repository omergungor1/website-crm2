import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/isAdmin";
import { uploadRoadmapSnapshot } from "@/lib/roadmap/snapshotsServer";
import { randomUUID } from "crypto";

function getStorageClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

async function getProjectAccess(supabase, user, admin, projectId) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();

  if (error || !project) return { project: null, allowed: false };
  if (admin || project.user_id === user.id) return { project, allowed: true };
  return { project, allowed: false };
}

export function createRoadmapSnapshotsHandlers({ projectId = null } = {}) {
  async function GET() {
    const supabase = await createClient();
    const { user, admin } = await getCurrentUser(supabase);
    if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    if (projectId) {
      const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
      if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
    }

    let query = supabase
      .from("roadmap_snapshots")
      .select("id, name, image_url, width, height, zoom, scroll_x, scroll_y, created_at")
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    } else {
      query = query.eq("user_id", user.id).is("project_id", null);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  }

  async function POST(request) {
    const supabase = await createClient();
    const { user, admin } = await getCurrentUser(supabase);
    if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    if (projectId) {
      const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
      if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const name = String(formData.get("name") || "").trim() || null;
    const width = Number(formData.get("width")) || null;
    const height = Number(formData.get("height")) || null;
    const zoom = formData.get("zoom") ? Number(formData.get("zoom")) : null;
    const scrollX = formData.get("scroll_x") ? Number(formData.get("scroll_x")) : null;
    const scrollY = formData.get("scroll_y") ? Number(formData.get("scroll_y")) : null;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Görsel dosyası gerekli" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Dosya 20 MB sınırını aşıyor" }, { status: 400 });
    }

    const snapshotId = randomUUID();
    const storageClient = getStorageClient() ?? supabase;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      const { publicUrl, storagePath } = await uploadRoadmapSnapshot({
        supabase: storageClient,
        userId: user.id,
        projectId,
        snapshotId,
        buffer,
        contentType: file.type || "image/png",
      });

      const { data, error } = await supabase
        .from("roadmap_snapshots")
        .insert({
          id: snapshotId,
          user_id: user.id,
          project_id: projectId,
          name,
          storage_path: storagePath,
          image_url: publicUrl,
          width,
          height,
          zoom,
          scroll_x: scrollX,
          scroll_y: scrollY,
        })
        .select("id, name, image_url, width, height, zoom, scroll_x, scroll_y, created_at")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data, { status: 201 });
    } catch (err) {
      return NextResponse.json({ error: err.message || "Yükleme hatası" }, { status: 500 });
    }
  }

  return { GET, POST };
}

export async function deleteRoadmapSnapshot({ snapshotId, projectId = null }) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (projectId) {
    const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
    if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
  }

  let query = supabase
    .from("roadmap_snapshots")
    .select("id, storage_path, user_id, project_id")
    .eq("id", snapshotId);

  if (projectId) {
    query = query.eq("project_id", projectId);
  } else {
    query = query.eq("user_id", user.id).is("project_id", null);
  }

  const { data: snapshot, error: fetchError } = await query.maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!snapshot) return NextResponse.json({ error: "Snapshot bulunamadı" }, { status: 404 });

  const storageClient = getStorageClient() ?? supabase;
  if (snapshot.storage_path) {
    await storageClient.storage.from("crm-roadmap-snapshots").remove([snapshot.storage_path]);
  }

  const { error } = await supabase.from("roadmap_snapshots").delete().eq("id", snapshotId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
