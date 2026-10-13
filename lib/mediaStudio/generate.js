import OpenAI from "openai";

const VIDEO_PLATFORMS = ["google_flow", "gemini"];

const SYSTEM_PROMPT = `You are a senior art director, brand designer and prompt engineer producing social media creatives.
Return ONLY valid JSON matching the requested schema.

PLATFORM RULES (strict):
- Every still image / static design (post, story, carousel slide, ad visual) is generated in ChatGPT image generation. mediaType "image" => targetPlatform "chatgpt".
- Only video content uses Google Flow or Gemini (Veo). mediaType "video" => targetPlatform "google_flow" or "gemini".

QUALITY RULES:
- Be extremely specific and production-ready. Each item must be independently usable without the other items.
- "narrative" must be a rich, vivid 150-250 word description of the final creative: subject, scene, mood, materials, depth, realism level.
- Decide the BACKGROUND deliberately: analyse the brief, brand colors and text needs, then choose the background type (solid, gradient, photographic scene, 3D render, texture, abstract shapes, studio sweep...). Explain why it fits and how it keeps on-image text readable (contrast, negative space, overlays, blur).
- Design a clear TYPOGRAPHY HIERARCHY for on-image text: H1 headline (largest, boldest), subheadline, optional short body/bullets, a CTA button/label, and a footer line. Specify relative sizes, weights, font style (e.g. geometric sans, bold condensed), alignment, colors (hex) and exact placement with safe margins.
- Write all on-image copy (headline, subheadline, body, cta) in the requested language, short and punchy. Headline max ~6 words. CTA max ~3 words.
- Footer: use ONLY the contact data provided in brandKit.contact (website/domain, social handles, phone). Never invent a URL, handle, phone, price, statistic, testimonial or guarantee. If no contact data is provided, leave footer empty.
- If a logo is available, specify exact logo placement/size and instruct the user to attach the logo file as a reference image.
- Use brand colors with hex codes when provided; otherwise propose a harmonious palette with hex codes.
- For carousels: keep a consistent visual system across slides (same grid, typography, palette), give each slide a distinct role (hook, value, proof, CTA) and put the CTA + footer on the final slide.
- For stories: respect 9:16 safe zones (top 14% and bottom 20% free of key text).
- For video: write a timed shot list (timestamps), camera movement, subject action, transitions, on-screen text overlays, music/sfx mood, optional voiceover, and an end card with CTA and footer.
- Technical generation instructions in English; on-image text in the requested language.
- negativePrompt: list concrete things to avoid (misspelled text, extra text, distorted logo, watermarks, clutter, low contrast, etc.).`;

function buildUserPayload({ project, brandKit, idea }) {
  const settings = idea.settings || {};
  return {
    project: {
      name: project?.name || "",
      description: project?.description || "",
      hasLogo: Boolean(project?.logo_url),
      type: project?.type || null,
    },
    brandKit: brandKit
      ? {
          name: brandKit.display_name || project?.name || "",
          colors: brandKit.colors || {},
          tone: brandKit.tone || null,
          personality: brandKit.personality || null,
          visualStyle: brandKit.visual_style || null,
          slogan: brandKit.slogan || null,
          keywords: brandKit.keywords || [],
          prohibitedTerms: brandKit.prohibited_terms || [],
          guidelines: brandKit.guidelines || null,
          contact: brandKit.contact || {},
        }
      : null,
    content: {
      title: idea.title || "",
      contentType: idea.content_type,
      brief: idea.creative_brief || "",
      platform: settings.platform || "instagram",
      tone: settings.tone || null,
      language: settings.language === "en" ? "English" : "Turkish",
      aspectRatio: settings.aspectRatio || null,
      slideCount: settings.slideCount || null,
      storyCount: settings.storyCount || null,
      output: settings.output || null,
      videoPlatform: settings.targetPlatform || null,
      textOnImage: settings.textOnImage !== false,
      showFooter: settings.showFooter !== false,
      preferredHeadline: settings.headline || null,
      preferredCta: settings.cta || null,
    },
    outputSchema: {
      contentTitle: "string",
      creativeStrategy: "string (3-5 sentences)",
      brandGuidelines: "string",
      plan: "optional array describing carousel slides / story frames / video beats",
      items: [
        {
          sequence: 1,
          title: "string",
          purpose: "string",
          mediaType: "image|video",
          targetPlatform: "chatgpt|google_flow|gemini",
          aspectRatio: "string",
          narrative: "string, 150-250 words",
          subject: "string",
          composition: "string (camera angle, framing, focal point, grid, negative space)",
          background: {
            type: "string",
            description: "string",
            colors: ["#hex"],
            reasoning: "string (why it fits + how it keeps text readable)",
          },
          lighting: "string",
          colorPalette: ["#hex - role"],
          style: "string (art direction, rendering, realism, references)",
          onImageText: {
            headline: "string (H1)",
            subheadline: "string",
            body: ["string"],
            cta: "string",
            footer: "string",
          },
          typography: {
            headline: "string (font style, weight, relative size, color, alignment, placement)",
            subheadline: "string",
            body: "string",
            cta: "string (button shape, fill color, text color, placement)",
            footer: "string",
          },
          logoPlacement: "string",
          video: {
            durationSeconds: 8,
            shots: [
              {
                time: "0-2s",
                visual: "string",
                camera: "string",
                onScreenText: "string",
                audio: "string",
              },
            ],
            music: "string",
            voiceover: "string",
            endCard: "string",
          },
          negativePrompt: "string",
        },
      ],
    },
  };
}

function str(value) {
  return typeof value === "string" ? value.trim() : "";
}

function list(value) {
  return Array.isArray(value) ? value.map((v) => str(String(v))).filter(Boolean) : [];
}

function contactFooter(brandKit) {
  const contact = brandKit?.contact || {};
  const parts = [];
  if (str(contact.website)) parts.push(str(contact.website).replace(/^https?:\/\//, "").replace(/\/$/, ""));
  const socials = [
    ["instagram", "Instagram"],
    ["tiktok", "TikTok"],
    ["x", "X"],
    ["linkedin", "LinkedIn"],
    ["youtube", "YouTube"],
    ["facebook", "Facebook"],
  ];
  for (const [key] of socials) {
    const handle = str(contact[key]);
    if (handle) parts.push(handle.startsWith("@") || handle.includes("/") ? handle : `@${handle}`);
  }
  if (str(contact.phone)) parts.push(str(contact.phone));
  if (str(contact.email)) parts.push(str(contact.email));
  return parts.join("  ·  ");
}

function section(title, lines) {
  const body = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
  if (!body.length) return "";
  return `## ${title}\n${body.join("\n")}`;
}

function buildImagePrompt(item, ctx) {
  const t = item.onImageText || {};
  const ty = item.typography || {};
  const bg = item.background || {};
  const textBlocks = ctx.textOnImage
    ? [
        t.headline && `- H1 HEADLINE (largest, boldest): "${t.headline}"${ty.headline ? ` — ${ty.headline}` : ""}`,
        t.subheadline && `- SUBHEADLINE: "${t.subheadline}"${ty.subheadline ? ` — ${ty.subheadline}` : ""}`,
        t.body?.length && `- BODY: ${t.body.map((b) => `"${b}"`).join(" / ")}${ty.body ? ` — ${ty.body}` : ""}`,
        t.cta && `- CTA BUTTON: "${t.cta}"${ty.cta ? ` — ${ty.cta}` : ""}`,
        ctx.footer && `- FOOTER LINE: "${ctx.footer}"${ty.footer ? ` — ${ty.footer}` : " — small, clean, bottom aligned with safe margin"}`,
        "- Render every text exactly as written inside the quotes, correctly spelled, with no extra words.",
      ]
    : ["- Do NOT render any text, letters or typography in the image."];

  return [
    `Create a ${item.aspectRatio || "1:1"} high-end social media ${ctx.typeLabel} design for "${ctx.brandName}".`,
    item.narrative,
    section("Subject", item.subject),
    section("Composition & layout", item.composition),
    section("Background", [
      bg.type && `- Type: ${bg.type}`,
      bg.description && `- Look: ${bg.description}`,
      bg.colors?.length && `- Colors: ${bg.colors.join(", ")}`,
      bg.reasoning && `- Why / readability: ${bg.reasoning}`,
    ]),
    section("Lighting", item.lighting),
    section("Color palette", item.colorPalette?.map((c) => `- ${c}`)),
    section("Style & rendering", item.style),
    section("On-image text & typography", textBlocks),
    section(
      "Logo",
      ctx.hasLogo
        ? `${item.logoPlacement || "Place the brand logo small and clean in a corner with safe margin."} Use the attached logo file as the exact reference; do not redraw or distort it.`
        : ""
    ),
    section("Avoid", item.negativePrompt),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildVideoPrompt(item, ctx) {
  const v = item.video || {};
  const t = item.onImageText || {};
  const shots = Array.isArray(v.shots) ? v.shots : [];
  return [
    `Generate a ${v.durationSeconds || 8}-second ${item.aspectRatio || "9:16"} cinematic social media video for "${ctx.brandName}".`,
    item.narrative,
    section("Subject", item.subject),
    section("Look & style", [item.style, item.lighting && `Lighting: ${item.lighting}`]),
    section("Setting / background", [item.background?.description, item.background?.reasoning]),
    section("Color palette", item.colorPalette?.map((c) => `- ${c}`)),
    section(
      "Shot list",
      shots.map(
        (s) =>
          `- [${str(s.time)}] ${str(s.visual)}${str(s.camera) ? ` | Camera: ${str(s.camera)}` : ""}${
            ctx.textOnImage && str(s.onScreenText) ? ` | On-screen text: "${str(s.onScreenText)}"` : ""
          }${str(s.audio) ? ` | Audio: ${str(s.audio)}` : ""}`
      )
    ),
    section("Music & sound", v.music),
    section("Voiceover", v.voiceover),
    section(
      "End card",
      ctx.textOnImage
        ? [
            v.endCard,
            t.headline && `Headline: "${t.headline}"`,
            t.cta && `CTA: "${t.cta}"`,
            ctx.footer && `Footer: "${ctx.footer}"`,
          ]
        : v.endCard
    ),
    section("Avoid", item.negativePrompt),
  ]
    .filter(Boolean)
    .join("\n\n");
}

const TYPE_LABELS = {
  post: "post",
  story: "story",
  carousel: "carousel slide",
  video: "video",
  ad: "ad",
  free: "visual",
};

function normalizeGenerated(raw, { idea, project, brandKit }) {
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  const items = Array.isArray(data.items) ? data.items : [];
  const settings = idea.settings || {};
  const videoPlatform = VIDEO_PLATFORMS.includes(settings.targetPlatform)
    ? settings.targetPlatform
    : "google_flow";

  const ctx = {
    brandName: brandKit?.display_name || project?.name || "the brand",
    hasLogo: Boolean(project?.logo_url),
    typeLabel: TYPE_LABELS[idea.content_type] || "visual",
    textOnImage: settings.textOnImage !== false,
    footer: settings.showFooter !== false ? contactFooter(brandKit) : "",
  };

  return {
    contentTitle: str(data.contentTitle) || idea.title || "İçerik",
    creativeStrategy: str(data.creativeStrategy),
    brandGuidelines: str(data.brandGuidelines),
    plan: data.plan || null,
    items: items
      .map((item, index) => {
        const forcedVideo = idea.content_type === "video";
        const mediaType = forcedVideo
          ? "video"
          : idea.content_type === "free" && item.mediaType === "video"
            ? "video"
            : "image";
        const targetPlatform =
          mediaType === "image"
            ? "chatgpt"
            : VIDEO_PLATFORMS.includes(item.targetPlatform) && idea.content_type === "free"
              ? item.targetPlatform
              : videoPlatform;

        const clean = {
          ...item,
          aspectRatio: str(item.aspectRatio) || settings.aspectRatio || (mediaType === "video" ? "9:16" : "1:1"),
          narrative: str(item.narrative),
          colorPalette: list(item.colorPalette),
          background: item.background && typeof item.background === "object"
            ? { ...item.background, colors: list(item.background.colors) }
            : { description: str(item.background) },
          onImageText: {
            headline: str(item.onImageText?.headline),
            subheadline: str(item.onImageText?.subheadline),
            body: list(item.onImageText?.body),
            cta: str(item.onImageText?.cta),
          },
          negativePrompt: str(item.negativePrompt),
        };

        const prompt = mediaType === "video" ? buildVideoPrompt(clean, ctx) : buildImagePrompt(clean, ctx);

        return {
          sequence: Number(item.sequence) || index + 1,
          title: str(item.title) || `Prompt ${index + 1}`,
          mediaType,
          targetPlatform,
          prompt,
          negativePrompt: clean.negativePrompt || null,
          metadata: {
            purpose: str(item.purpose) || null,
            aspectRatio: clean.aspectRatio,
            onImageText: { ...clean.onImageText, footer: ctx.footer || null },
            background: clean.background,
            colorPalette: clean.colorPalette,
          },
        };
      })
      .filter((item) => item.prompt),
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
    temperature: 0.8,
    max_completion_tokens: 16000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Create detailed, production-ready creative prompts for this request. Fill every field of the schema richly.\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  });

  const text = completion.choices?.[0]?.message?.content || "{}";
  return normalizeGenerated(text, { idea, project, brandKit });
}
