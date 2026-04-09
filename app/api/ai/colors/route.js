import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { sector, brand_tone, main_goal } = await request.json();

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = [
    `You are a professional UI/UX designer. Generate 3 distinct color palette suggestions for a ${sector || "business"} website.`,
    `Brand tone: ${brand_tone || "professional"}.`,
    main_goal ? `Main goal: ${main_goal}.` : "",
    "For each palette, provide exactly 5 hex colors: primary, secondary, accent, background, text.",
    "Return ONLY valid JSON array with this structure, no other text:",
    `[{"name":"Palette 1","colors":{"primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","text":"#hex"}},...]`,
  ]
    .filter(Boolean)
    .join(" ");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 400,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  try {
    const parsed = JSON.parse(raw);
    const palettes = Array.isArray(parsed) ? parsed : parsed.palettes || parsed.data || [];
    return NextResponse.json({ palettes });
  } catch {
    return NextResponse.json({ error: "Renk paleti ayrıştırılamadı" }, { status: 500 });
  }
}
