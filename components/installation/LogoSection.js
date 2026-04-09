"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export default function LogoSection({
  logoUrl,
  sector,
  businessName,
  brandTone,
  colorPalette,
  onLogoChange,
  onUpload,
  isPublic = false,
}) {
  const fileRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ai/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_name: businessName, sector, brand_tone: brandTone, color_palette: colorPalette }),
      });
      const data = await res.json();
      if (data.url) {
        onLogoChange(data.url);
      } else {
        setError(data.error || "Logo üretilemedi");
      }
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Logo Yükle
        </button>
        {!isPublic && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {generating ? "Üretiliyor…" : "AI ile Logo Üret"}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onUpload}
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {logoUrl && (
        <div className="flex items-center gap-3">
          <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="Logo önizleme"
              className="h-full w-full object-contain p-1"
            />
          </div>
          <div className="text-xs text-zinc-500">
            <p>Logo önizlemesi</p>
            <button
              onClick={() => onLogoChange("")}
              className="mt-1 text-red-500 hover:text-red-700"
            >
              Kaldır
            </button>
          </div>
        </div>
      )}

      {generating && (
        <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
