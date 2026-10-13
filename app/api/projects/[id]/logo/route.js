import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

const BUCKET = "crm-uploads";
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml", "image/gif"]);

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function sanitizeFileName(name) {
  const ext = name.lastIndexOf(".") !== -1 ? name.slice(name.lastIndexOf(".")) : "";
  const base = name.slice(0, name.length - ext.length);
  return (
    base
      .replace(/ğ/g, "g")
      .replace(/Ğ/g, "G")
      .replace(/ü/g, "u")
      .replace(/Ü/g, "U")
      .replace(/ş/g, "s")
      .replace(/Ş/g, "S")
      .replace(/ı/g, "i")
      .replace(/İ/g, "I")
      .replace(/ö/g, "o")
      .replace(/Ö/g, "O")
      .replace(/ç/g, "c")
      .replace(/Ç/g, "C")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") + ext.toLowerCase()
  );
}

async function getProjectAndCheckAccess(supabase, user, admin, id) {
  const { data: project, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error || !project) return { project: null, allowed: false };
  if (admin) return { project, allowed: true };
  if (project.user_id !== user.id) return { project, allowed: false };
  return { project, allowed: true };
}

export async function POST(request, { params }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { project, allowed } = await getProjectAndCheckAccess(supabase, user, admin, id);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Dosya 3 MB sınırını aşıyor" }, { status: 400 });
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Sadece PNG, JPG, WEBP, SVG veya GIF yüklenebilir" }, { status: 400 });
  }

  const storage = createAdminClient() ?? supabase;
  const safeName = sanitizeFileName(file.name || "logo.png");
  const path = `${id}/logo/logo-${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data, error } = await storage.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (error) {
    console.error("[projects/logo] upload error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = storage.storage.from(BUCKET).getPublicUrl(data.path);
  const logoUrl = urlData.publicUrl;

  const { data: updated, error: updateError } = await supabase
    .from("projects")
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, logo_url")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ url: logoUrl, project: updated });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { project, allowed } = await getProjectAndCheckAccess(supabase, user, admin, id);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data: updated, error } = await supabase
    .from("projects")
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, logo_url")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, project: updated });
}
