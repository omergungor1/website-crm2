import OpenAI from "openai";

const SYSTEM_PROMPT = `You are a senior creative director and prompt engineer for social media production.
Generate production-ready prompts for ChatGPT image generation, Google Flow, or Gemini video tools.
Return ONLY valid JSON matching the requested schema.
Never invent product claims, testimonials, guarantees, or performance results.
If a logo URL is provided, instruct the user to attach the logo as a reference image rather than assuming the model can fetch it.
Keep exact on-image marketing copy in the requested language.
Prefer English for technical generation instructions unless the user asks otherwise.
Each item prompt must be independently usable.`;

function buildUserPayload({ project, brandKit, idea }) {
  return {
    project: {
      name: project?.name || "",
      description: project?.description || "",
      logo_url: project?.logo_url || null,
      type: project?.type || null,
    },
    brandKit: brandKit || null,
    content: {
      title: idea.title || "",
      content_type: idea.content_type,
      creative_brief: idea.creative_brief || "",
      settings: idea.settings || {},
    },
    outputSchema: {
      contentTitle: "string",
      contentType: "string",
      creativeStrategy: "string",
      brandGuidelines: "string",
      plan: "optional object/array for carousel/video planning",
      items: [
        {
          sequence: 1,
          title: "string",
          purpose: "string",
          headline: "string",
          visualConcept: "string",
          prompt: "string",
          negativePrompt: "string",
          aspectRatio: "string",
          mediaType: "image|video",
          targetPlatform: "chatgpt|google_flow|gemini|other",
        },
      ],
    },
  };
}

function normalizeGenerated(raw, idea) {
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  const items = Array.isArray(data.items) ? data.items : [];
  const settings = idea.settings || {};
  const defaultPlatform =
    idea.content_type === "video"
      ? settings.targetPlatform || "google_flow"
      : "chatgpt";
  const defaultMediaType = idea.content_type === "video" ? "video" : "image";

  return {
    contentTitle: String(data.contentTitle || idea.title || "İçerik").trim(),
    creativeStrategy: String(data.creativeStrategy || "").trim(),
    brandGuidelines: String(data.brandGuidelines || "").trim(),
    plan: data.plan || null,
    items: items.map((item, index) => ({
      sequence: Number(item.sequence) || index + 1,
      title: String(item.title || `Prompt ${index + 1}`).trim(),
      purpose: String(item.purpose || "").trim(),
      headline: String(item.headline || "").trim(),
      visualConcept: String(item.visualConcept || "").trim(),
      prompt: String(item.prompt || "").trim(),
      negativePrompt: String(item.negativePrompt || "").trim() || null,
      aspectRatio: String(item.aspectRatio || settings.aspectRatio || "").trim() || null,
      mediaType: ["image", "video"].includes(item.mediaType) ? item.mediaType : defaultMediaType,
      targetPlatform: ["chatgpt", "google_flow", "gemini", "other"].includes(item.targetPlatform)
        ? item.targetPlatform
        : defaultPlatform,
      metadata: {
        purpose: item.purpose || null,
        headline: item.headline || null,
        visualConcept: item.visualConcept || null,
        aspectRatio: item.aspectRatio || settings.aspectRatio || null,
      },
    })).filter((item) => item.prompt),
  };
}

export async function generateMediaStudioPrompts({ project, brandKit, idea }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY tanımlı değil");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const payload = buildUserPayload({ project, brandKit, idea });

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MEDIA_STUDIO_MODEL || "gpt-4.1-mini",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Create production-ready social media prompts for this request:\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  });

  const text = completion.choices?.[0]?.message?.content || "{}";
  return normalizeGenerated(text, idea);
}
