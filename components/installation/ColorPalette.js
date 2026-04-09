"use client";

import { useState } from "react";

const PRESET_PALETTES = [
  {
    name: "Okyanus Mavisi",
    colors: { primary: "#0077B6", secondary: "#00B4D8", accent: "#90E0EF", background: "#F8FAFF", text: "#03045E" },
  },
  {
    name: "Orman Yeşili",
    colors: { primary: "#2D6A4F", secondary: "#52B788", accent: "#95D5B2", background: "#F8FFF9", text: "#1B4332" },
  },
  {
    name: "Altın Sarısı",
    colors: { primary: "#D4A017", secondary: "#F2C94C", accent: "#FDEAA0", background: "#FFFDF2", text: "#7B4F00" },
  },
  {
    name: "Koyu Mor",
    colors: { primary: "#6C3483", secondary: "#A569BD", accent: "#D2B4DE", background: "#FAF0FE", text: "#2E0854" },
  },
  {
    name: "Yakut Kırmızı",
    colors: { primary: "#C0392B", secondary: "#E74C3C", accent: "#FADBD8", background: "#FFF9F9", text: "#7B241C" },
  },
  {
    name: "Kurumsal Lacivert",
    colors: { primary: "#1A237E", secondary: "#283593", accent: "#5C6BC0", background: "#F5F6FF", text: "#0D1243" },
  },
  {
    name: "Turkuaz & Mercan",
    colors: { primary: "#00897B", secondary: "#FF6B35", accent: "#B2DFDB", background: "#F0FAFA", text: "#004D40" },
  },
  {
    name: "Karanlık Çelik",
    colors: { primary: "#212121", secondary: "#424242", accent: "#757575", background: "#FAFAFA", text: "#212121" },
  },
  {
    name: "Gün Batımı",
    colors: { primary: "#E64A19", secondary: "#FF7043", accent: "#FFCCBC", background: "#FFF9F6", text: "#BF360C" },
  },
  {
    name: "Nane Yeşil",
    colors: { primary: "#00796B", secondary: "#26A69A", accent: "#B2DFDB", background: "#F4FFFD", text: "#004D40" },
  },
];

const COLOR_KEYS = ["primary", "secondary", "accent", "background", "text"];
const COLOR_LABELS = {
  primary: "Ana",
  secondary: "İkincil",
  accent: "Vurgu",
  background: "Arkaplan",
  text: "Metin",
};

export default function ColorPalette({ value, onChange, sector, brandTone, mainGoal }) {
  const [mode, setMode] = useState("preset");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPalettes, setAiPalettes] = useState([]);
  const [manual, setManual] = useState(value || { primary: "#000000", secondary: "#444444", accent: "#888888", background: "#ffffff", text: "#111111" });

  async function handleAIGenerate() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector, brand_tone: brandTone, main_goal: mainGoal }),
      });
      const data = await res.json();
      setAiPalettes(data.palettes || []);
      if (data.palettes?.length) {
        setMode("ai");
      }
    } finally {
      setAiLoading(false);
    }
  }

  const displayPalettes = mode === "ai" ? aiPalettes : PRESET_PALETTES;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setMode("preset")}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${mode === "preset" ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"}`}
        >
          Hazır Paletler
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${mode === "manual" ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"}`}
        >
          Elle Gir
        </button>
        <button
          onClick={handleAIGenerate}
          disabled={aiLoading}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {aiLoading ? "Üretiliyor…" : "AI Uyumlu Palet Üret"}
        </button>
      </div>

      {mode === "manual" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {COLOR_KEYS.map((key) => (
            <div key={key} className="text-center">
              <label className="text-xs text-zinc-500">{COLOR_LABELS[key]}</label>
              <div className="relative mt-1">
                <div
                  className="h-12 w-full cursor-pointer rounded-xl border border-zinc-200 dark:border-zinc-700"
                  style={{ background: manual[key] || "#ffffff" }}
                  onClick={() => document.getElementById(`color-${key}`)?.click()}
                />
                <input
                  id={`color-${key}`}
                  type="color"
                  value={manual[key] || "#ffffff"}
                  onChange={(e) => {
                    const updated = { ...manual, [key]: e.target.value };
                    setManual(updated);
                    onChange(updated);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
                />
              </div>
              <input
                type="text"
                value={manual[key] || ""}
                onChange={(e) => {
                  const updated = { ...manual, [key]: e.target.value };
                  setManual(updated);
                  onChange(updated);
                }}
                className="mt-1 w-full rounded border border-zinc-200 px-1 py-0.5 text-center font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                maxLength={7}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {displayPalettes.map((palette, i) => {
            const isSelected = JSON.stringify(value) === JSON.stringify(palette.colors);
            return (
              <button
                key={i}
                onClick={() => onChange(palette.colors)}
                className={`rounded-xl border p-3 text-left transition-all hover:shadow-md ${
                  isSelected
                    ? "border-zinc-900 shadow-sm dark:border-zinc-100"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  {COLOR_KEYS.slice(0, 4).map((k) => (
                    <div
                      key={k}
                      className="h-6 w-6 rounded-full border border-white/50 shadow-sm"
                      style={{ background: palette.colors[k] }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{palette.name}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
