"use client";

import { useState } from "react";
import { SectionCard, btnPrimaryCls } from "./ui";

export default function AiProductBriefSection() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function handleGenerate() {
    setLoading(true);
    setMessage("");
    setTimeout(() => {
      setLoading(false);
      setMessage(
        "AI Product Assistant yakında ChatGPT API ile aktif olacak. Ürün özeti, hedef kitle, persona, value proposition, rakip analizi, MVP önerisi ve özellik önerileri otomatik üretilecek."
      );
    }, 1000);
  }

  return (
    <SectionCard
      title="AI Product Assistant"
      description="Yapay zeka ile blueprint alanlarını otomatik doldurun — placeholder."
    >
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-sky-300 bg-sky-50/50 px-6 py-8 text-center dark:border-sky-800 dark:bg-sky-950/20">
        <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          Tek tıkla ürün özeti, hedef kitle, persona, value proposition, rakip analizi, MVP önerisi,
          özellik önerileri ve pazarlama stratejisi üretin.
        </p>
        <button type="button" onClick={handleGenerate} disabled={loading} className={btnPrimaryCls}>
          {loading ? "Hazırlanıyor…" : "Blueprint Oluştur"}
        </button>
        {message && <p className="text-sm text-sky-600 dark:text-sky-400">{message}</p>}
      </div>
    </SectionCard>
  );
}
