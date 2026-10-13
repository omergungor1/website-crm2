"use client";

import { useMemo, useState } from "react";
import { CONTENT_TYPES } from "@/lib/mediaStudio/constants";
import { ms } from "./theme";

function Toggle({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-3xl bg-[#f4f4f4] px-4 py-3 text-left transition hover:bg-[#ececec] dark:bg-[#212121] dark:hover:bg-[#262626]"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[#0d0d0d] dark:text-[#ececec]">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-[#5d5d5d] dark:text-[#b4b4b4]">{hint}</span> : null}
      </span>
      <span
        className={`relative h-6 w-10 shrink-0 rounded-full transition ${
          checked ? "bg-[#0285ff]" : "bg-black/15 dark:bg-white/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export default function CreateContentForm({ projectId, onCreated }) {
  const [contentType, setContentType] = useState("post");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("");
  const [language, setLanguage] = useState("tr");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [slideCount, setSlideCount] = useState(5);
  const [storyCount, setStoryCount] = useState(3);
  const [videoTarget, setVideoTarget] = useState("google_flow");
  const [freeOutput, setFreeOutput] = useState("image");
  const [headline, setHeadline] = useState("");
  const [cta, setCta] = useState("");
  const [textOnImage, setTextOnImage] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [applyBrand, setApplyBrand] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const typeOptions = useMemo(() => {
    if (contentType === "post") return ["1:1", "4:5", "1.91:1"];
    if (contentType === "story") return ["9:16"];
    if (contentType === "carousel") return ["1:1", "4:5"];
    if (contentType === "video") return ["9:16", "16:9", "1:1"];
    return ["1:1", "4:5", "9:16", "16:9"];
  }, [contentType]);

  const producesVideo =
    contentType === "video" || (contentType === "free" && freeOutput !== "image");
  const producesImage = contentType !== "video" && !(contentType === "free" && freeOutput === "video");

  function selectType(id) {
    setContentType(id);
    if (id === "story" || id === "video") setAspectRatio("9:16");
    else setAspectRatio("1:1");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const settings = {
        platform,
        tone: tone.trim() || null,
        language,
        aspectRatio,
        applyBrandKit: applyBrand,
        textOnImage,
        showFooter: textOnImage && showFooter,
        headline: headline.trim() || null,
        cta: cta.trim() || null,
      };
      if (contentType === "carousel") settings.slideCount = Number(slideCount) || 5;
      if (contentType === "story") settings.storyCount = Number(storyCount) || 1;
      if (producesVideo) settings.targetPlatform = videoTarget;
      if (contentType === "free") settings.output = freeOutput;

      const createRes = await fetch(`/api/projects/${projectId}/media-studio/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content_type: contentType,
          creative_brief: brief.trim(),
          settings,
          apply_brand_kit: applyBrand,
        }),
      });
      const idea = await createRes.json();
      if (!createRes.ok) throw new Error(idea.error || "İçerik oluşturulamadı");

      setSaving(false);
      setGenerating(true);
      const genRes = await fetch(
        `/api/projects/${projectId}/media-studio/ideas/${idea.id}/generate`,
        { method: "POST" }
      );
      const genData = await genRes.json().catch(() => ({}));
      if (!genRes.ok) throw new Error(genData.error || "Prompt üretilemedi");

      setTitle("");
      setBrief("");
      setHeadline("");
      setCta("");
      onCreated?.(genData);
    } catch (err) {
      setError(err.message || "Hata oluştu");
    } finally {
      setSaving(false);
      setGenerating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${ms.card} space-y-5`}>
      <div>
        <h3 className={ms.title}>Yeni içerik</h3>
        <p className={`mt-1 ${ms.muted}`}>
          Tür seç, brief yaz; AI detaylı görsel ve video promptlarını üretsin.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONTENT_TYPES.map((type) => (
          <button key={type.id} type="button" onClick={() => selectType(type.id)} className={ms.pill(contentType === type.id)}>
            {type.label}
          </button>
        ))}
      </div>

      <label className="block">
        <span className={ms.label}>Başlık (opsiyonel)</span>
        <input className={ms.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Ürün lansman carousel" />
      </label>

      <label className="block">
        <span className={ms.label}>Hakkında / Brief</span>
        <textarea
          required
          rows={5}
          className={`${ms.textarea} resize-y`}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Ne anlatmak istiyorsun? Ürün, hedef kitle, kampanya, öne çıkan fayda, istenen his…"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={ms.label}>Platform</span>
          <select className={ms.input} value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="linkedin">LinkedIn</option>
            <option value="youtube">YouTube</option>
            <option value="ads">Reklam (Meta/Google)</option>
          </select>
        </label>
        <label className="block">
          <span className={ms.label}>Ton</span>
          <input className={ms.input} value={tone} onChange={(e) => setTone(e.target.value)} placeholder="Modern, enerjik…" />
        </label>
        <label className="block">
          <span className={ms.label}>Dil</span>
          <select className={ms.input} value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={ms.label}>Oran</span>
          <select className={ms.input} value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
            {typeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        {contentType === "carousel" ? (
          <label className="block">
            <span className={ms.label}>Slayt sayısı</span>
            <input type="number" min={3} max={10} className={ms.input} value={slideCount} onChange={(e) => setSlideCount(e.target.value)} />
          </label>
        ) : null}

        {contentType === "story" ? (
          <label className="block">
            <span className={ms.label}>Story adedi</span>
            <input type="number" min={1} max={8} className={ms.input} value={storyCount} onChange={(e) => setStoryCount(e.target.value)} />
          </label>
        ) : null}

        {contentType === "free" ? (
          <label className="block">
            <span className={ms.label}>Çıktı</span>
            <select className={ms.input} value={freeOutput} onChange={(e) => setFreeOutput(e.target.value)}>
              <option value="image">Görsel (ChatGPT)</option>
              <option value="video">Video</option>
              <option value="both">Görsel + Video</option>
            </select>
          </label>
        ) : null}

        {producesVideo ? (
          <label className="block">
            <span className={ms.label}>Video aracı</span>
            <select className={ms.input} value={videoTarget} onChange={(e) => setVideoTarget(e.target.value)}>
              <option value="google_flow">Google Flow</option>
              <option value="gemini">Gemini</option>
            </select>
          </label>
        ) : null}
      </div>

      {producesImage ? (
        <p className={`-mt-1 ml-1 ${ms.muted}`}>Görseller ChatGPT görsel üretimi için hazırlanır.</p>
      ) : null}

      <div className="space-y-2">
        <Toggle
          checked={textOnImage}
          onChange={setTextOnImage}
          label="Görsele metin yaz"
          hint="H1 başlık, alt başlık ve CTA tipografi hiyerarşisiyle tasarıma eklenir."
        />
        {textOnImage ? (
          <>
            <div className="grid gap-4 px-1 pt-2 sm:grid-cols-2">
              <label className="block">
                <span className={ms.label}>H1 başlık (opsiyonel)</span>
                <input className={ms.input} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Boş bırakırsan AI yazar" />
              </label>
              <label className="block">
                <span className={ms.label}>CTA (opsiyonel)</span>
                <input className={ms.input} value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Örn. Hemen keşfet" />
              </label>
            </div>
            <Toggle
              checked={showFooter}
              onChange={setShowFooter}
              label="Alt bilgi satırı (footer)"
              hint="Marka kitindeki web sitesi, sosyal hesaplar ve iletişim bilgileri görselin altına eklenir."
            />
          </>
        ) : null}
        <Toggle
          checked={applyBrand}
          onChange={setApplyBrand}
          label="Marka kitini uygula"
          hint="Renkler, ton, stil ve iletişim bilgileri prompta dahil edilir."
        />
      </div>

      {error ? (
        <p className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={saving || generating || !brief.trim()} className={`${ms.primary} w-full py-3`}>
        {saving || generating ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : null}
        {saving ? "Kaydediliyor…" : generating ? "Detaylı promptlar üretiliyor…" : "Oluştur ve üret"}
      </button>
    </form>
  );
}
