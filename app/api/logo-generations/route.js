import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const FIXED_PROMPT =
  "Bana kare bir logo tasarla. Logo içinde metin olmayacak. Sektör ile uyumlu bir renk paleti seçmelisin";

function safeSlug(input) {
  const s = String(input || "")
    .trim()
    .toLowerCase()
    // türkçe karakterleri ascii'ye yaklaştır
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    // diğer aksanları düşür
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  return (
    s
      .replace(/[^a-z0-9\s-_.]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-_.]+|[-_.]+$/g, "")
      .slice(0, 80) || "logo"
  );
}

function isValidPrompt(p) {
  const s = String(p || "").trim();
  return s.length >= 100;
}

async function uploadPngBase64ToPublicBucket({ supabase, bucket, base64, path }) {
  const buffer = Buffer.from(base64, "base64");
  const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  if (!urlData?.publicUrl) throw new Error("Public URL alınamadı");

  return { publicUrl: urlData.publicUrl, storagePath: data.path };
}

export async function GET(request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const offset = Math.max(0, Number(searchParams.get("offset") || "0") || 0);
  const limit = 9;

  const { data, error } = await supabase
    .from("logo_generations")
    .select("id,title,logo_url,created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = data || [];
  const nextOffset = items.length === limit ? offset + limit : null;
  return NextResponse.json({ items, nextOffset });
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const title = String(body?.title || "").trim();
  const userPrompt = String(body?.prompt || "").trim();

  if (!title) return NextResponse.json({ error: "Title gerekli" }, { status: 400 });
  if (!isValidPrompt(userPrompt)) {
    return NextResponse.json(
      { error: "Prompt en az 100 karakter olmalıdır" },
      { status: 400 }
    );
  }

  const fullPrompt = `${FIXED_PROMPT}\n\nKullanıcı promptu:\n${userPrompt}`;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let imageBase64;
  try {
    const r = await openai.images.generate({
      model: "gpt-image-1",
      prompt: fullPrompt,
      size: "1024x1024",
    });
    imageBase64 = r.data?.[0]?.b64_json;
  } catch (e) {
    return NextResponse.json(
      { error: "Görsel üretim hatası: " + (e?.message || "Bilinmeyen hata") },
      { status: 500 }
    );
  }

  if (!imageBase64) {
    return NextResponse.json({ error: "Görsel üretilemedi" }, { status: 500 });
  }

  const bucket = "crm-logos"; //ai-logos
  const filename = `${safeSlug(title)}-${Date.now()}.png`;
  const path = `${user.id}/${filename}`;

  let uploaded;
  try {
    uploaded = await uploadPngBase64ToPublicBucket({
      supabase,
      bucket,
      base64: imageBase64,
      path,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Storage yükleme hatası: " + (e?.message || "Bilinmeyen hata") },
      { status: 500 }
    );
  }

  const row = {
    created_by: user.id,
    title,
    fixed_prompt: FIXED_PROMPT,
    user_prompt: userPrompt,
    full_prompt: fullPrompt,
    logo_url: uploaded.publicUrl,
    storage_path: uploaded.storagePath,
  };

  const { data, error } = await supabase
    .from("logo_generations")
    .insert(row)
    .select("id,title,logo_url,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}

