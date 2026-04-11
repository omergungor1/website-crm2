import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Her varyant için farklı ama kurumsal sembol yaklaşımı
const VARIANT_STYLES = [
  "a bold sharp-edged geometric mark — a strong shield, hexagon, or square with a precise minimal icon centered inside",
  "a clean corporate monogram-style symbol built from sharp angular lines forming a single unified shape, no curves",
  "a modern professional emblem: a solid geometric container (circle or octagon) with a sharp minimal icon that represents the industry",
];

function buildPrompt(sector, businessName, services, colorPalette, variant) {
  const primaryColor = colorPalette?.primary || "#1a1a2e";
  const accentColor = colorPalette?.accent || colorPalette?.secondary || "#4a90d9";
  const bgColor = colorPalette?.background || "#ffffff";

  const serviceHint = Array.isArray(services) && services.length > 0
    ? `The business provides: ${services.slice(0, 3).map((s) => s.name || s).join(", ")}.`
    : "";

  return [
    // Bağlam
    `Professional corporate logo mark for a ${sector || "professional services"} business${businessName ? ` named "${businessName}"` : ""}.`,
    serviceHint,

    // Varyant
    `Design approach: ${VARIANT_STYLES[variant]}.`,

    // Renk — sadece verilen palet
    `Use ONLY these colors: primary ${primaryColor} and accent ${accentColor} on a solid ${bgColor} background. Maximum 2 colors. No gradients, no transparency, no color blending.`,

    // Kurumsal stil gereksinimleri
    "Style: crisp corporate vector logo, sharp edges, high contrast, no rounded corners, no soft shapes, no watercolor, no illustration style, no hand-drawn feel.",
    "The mark must look like a real Fortune 500 company logo — serious, trustworthy, instantly recognizable.",
    "Single centered composition with generous equal padding on all sides. The symbol occupies no more than 60% of the canvas.",

    // Kesin yasaklar
    "ABSOLUTE RULES: NO text, NO letters, NO words, NO numbers, NO initials, NO alphabet characters of any language.",
    "NO illustration style, NO cartoon, NO clipart, NO gradient, NO drop shadow, NO glow effects.",
    "NO multiple disconnected shapes, NO decorative borders, NO background patterns.",
  ].filter(Boolean).join(" ");
}

async function uploadToStorage(supabase, imageUrl, projectId, index) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Görsel indirilemedi: ${res.status}`);
  const blob = await res.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const path = `${projectId}/ai-logo-${Date.now()}-${index}.png`;
  const { data, error } = await supabase.storage
    .from("crm-logos")
    .upload(path, buffer, { contentType: "image/png", upsert: true });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage.from("crm-logos").getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function POST(request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { business_name, sector, services, color_palette, project_id } =
    await request.json();

  if (!project_id) {
    return NextResponse.json({ error: "project_id gerekli" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // 3 logo paralel üret (DALL-E 3, n=1 zorunluluğu nedeniyle ayrı istek)
  let dalleUrls;
  try {
    const requests = [0, 1, 2].map((i) =>
      openai.images.generate({
        model: "dall-e-3",
        prompt: buildPrompt(sector, business_name, services, color_palette, i),
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url",
      })
    );
    const responses = await Promise.all(requests);
    dalleUrls = responses.map((r) => r.data[0]?.url).filter(Boolean);
  } catch (err) {
    return NextResponse.json(
      { error: "DALL-E hatası: " + err.message },
      { status: 500 }
    );
  }

  if (dalleUrls.length === 0) {
    return NextResponse.json({ error: "Görsel oluşturulamadı" }, { status: 500 });
  }

  // Her birini Supabase storage'a yükle
  let permanentUrls;
  try {
    permanentUrls = await Promise.all(
      dalleUrls.map((url, i) => uploadToStorage(supabase, url, project_id, i))
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Storage yükleme hatası: " + err.message },
      { status: 500 }
    );
  }

  // installation_forms tablosuna kaydet
  await supabase
    .from("installation_forms")
    .update({ logo_ai_urls: permanentUrls, logo_generate: true })
    .eq("project_id", project_id);

  return NextResponse.json({ urls: permanentUrls });
}
