import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { business_name, sector, brand_tone, color_palette } = await request.json();

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const toneMap = {
    formal: "profesyonel ve kurumsal",
    friendly: "samimi ve sıcak",
    young: "genç ve dinamik",
    premium: "lüks ve premium",
  };

  const prompt = [
    `Create a minimalist, modern logo icon for a ${sector || "business"} brand called "${business_name || "Brand"}".`,
    `Brand tone: ${toneMap[brand_tone] || "professional"}.`,
    color_palette
      ? `Use a harmonious color palette including: ${JSON.stringify(color_palette)}.`
      : `Use a professional color palette suitable for the ${sector || "business"} industry.`,
    "The logo must be icon/symbol only — absolutely NO text, NO letters, NO words, NO brand name.",
    "Style: flat vector icon, clean geometric shapes, suitable for web and print.",
    "Background: transparent or white. Single cohesive composition.",
  ].join(" ");

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
    response_format: "url",
  });

  const url = response.data[0]?.url;
  if (!url) return NextResponse.json({ error: "Görsel oluşturulamadı" }, { status: 500 });

  return NextResponse.json({ url });
}
