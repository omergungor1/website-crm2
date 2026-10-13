"use client";

import { useMemo, useState } from "react";
import { CONTENT_TYPES } from "@/lib/mediaStudio/constants";

const inputCls =
  "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

export default function CreateContentForm({ projectId, onCreated }) {
  const [contentType, setContentType] = useState("post");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("modern");
  const [language, setLanguage] = useState("tr");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [slideCount, setSlideCount] = useState(5);
  const [storyCount, setStoryCount] = useState(3);
  const [videoTarget, setVideoTarget] = useState("google_flow");
  const [freeOutput, setFreeOutput] = useState("image");
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const settings = {
        platform,
        tone,
        language,
        aspectRatio,
        applyBrandKit: applyBrand,
      };
      if (contentType === "carousel") settings.slideCount = Number(slideCount) || 5;
      if (contentType === "story") settings.storyCount = Number(storyCount) || 1;
      if (contentType === "video") settings.targetPlatform = videoTarget;
      if (contentType === "free") {
        settings.output = freeOutput;
        settings.targetPlatform =
          freeOutput === "video" || freeOutput === "both" ? videoTarget : "chatgpt";
      }

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
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || "Prompt üretilemedi");

      setTitle("");
      setBrief("");
      onCreated?.(genData);
    } catch (err) {
      setError(err.message || "Hata oluştu");
    } finally {
      setSaving(false);
      setGenerating(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Yeni içerik</h3>
        <p className="mt-1 text-xs text-zinc-500">Tür seç, brief yaz, AI promptlarını üret.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONTENT_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => {
              setContentType(type.id);
              if (type.id === "story") setAspectRatio("9:16");
              else if (type.id === "post") setAspectRatio("1:1");
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              contentType === type.id
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <label className="block text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Başlık (opsiyonel)</span>
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn. Ürün lansman carousel"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Hakkında / Brief</span>
        <textarea
          required
          rows={5}
          className={`${inputCls} resize-y`}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Ürünümüzü tanıtan modern ve dikkat çekici bir içerik hazırla…"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Platform</span>
          <select className={inputCls} value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="linkedin">LinkedIn</option>
            <option value="youtube">YouTube</option>
            <option value="ads">Ads</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Ton</span>
          <input className={inputCls} value={tone} onChange={(e) => setTone(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Dil</span>
          <select className={inputCls} value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Oran</span>
          <select
            className={inputCls}
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
          >
            {typeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        {contentType === "carousel" ? (
          <label className="block text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Slayt sayısı</span>
            <input
              type="number"
              min={3}
              max={10}
              className={inputCls}
              value={slideCount}
              onChange={(e) => setSlideCount(e.target.value)}
            />
          </label>
        ) : null}

        {contentType === "story" ? (
          <label className="block text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Story adedi</span>
            <input
              type="number"
              min={1}
              max={8}
              className={inputCls}
              value={storyCount}
              onChange={(e) => setStoryCount(e.target.value)}
            />
          </label>
        ) : null}

        {contentType === "video" || contentType === "free" ? (
          <label className="block text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Video hedefi</span>
            <select
              className={inputCls}
              value={videoTarget}
              onChange={(e) => setVideoTarget(e.target.value)}
            >
              <option value="google_flow">Google Flow</option>
              <option value="gemini">Gemini</option>
            </select>
          </label>
        ) : null}

        {contentType === "free" ? (
          <label className="block text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Çıktı</span>
            <select
              className={inputCls}
              value={freeOutput}
              onChange={(e) => setFreeOutput(e.target.value)}
            >
              <option value="image">Görsel prompt</option>
              <option value="video">Video prompt</option>
              <option value="both">İkisi de</option>
            </select>
          </label>
        ) : null}
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={applyBrand}
          onChange={(e) => setApplyBrand(e.target.checked)}
          className="rounded border-zinc-300"
        />
        Marka kitini uygula
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={saving || generating || !brief.trim()}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {saving ? "Kaydediliyor…" : generating ? "Promptlar üretiliyor…" : "Oluştur ve üret"}
      </button>
    </form>
  );
}
