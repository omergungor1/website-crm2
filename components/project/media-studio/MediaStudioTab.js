"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  contentTypeLabel,
  IDEA_STATUSES,
  platformLabel,
  PROMPT_STATUSES,
  STUDIO_SECTIONS,
} from "@/lib/mediaStudio/constants";
import CreateContentForm from "./CreateContentForm";
import { ms } from "./theme";

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-3xl border border-black/[0.06] bg-white px-4 py-3.5 dark:border-white/[0.08] dark:bg-[#2f2f2f]">
      <p className="text-[11px] font-medium text-[#5d5d5d] dark:text-[#b4b4b4]">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tabular-nums tracking-tight ${
          accent ? "text-[#0285ff]" : "text-[#0d0d0d] dark:text-[#ececec]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  );
}

function OnImageText({ text }) {
  if (!text) return null;
  const rows = [
    ["H1", text.headline],
    ["Alt başlık", text.subheadline],
    ["CTA", text.cta],
    ["Footer", text.footer],
  ].filter(([, v]) => v);
  if (!rows.length) return null;
  return (
    <div className="mt-3 grid gap-1.5 rounded-2xl bg-[#f4f4f4] p-3 dark:bg-[#212121]">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-3 text-xs">
          <span className="w-16 shrink-0 font-medium text-[#8f8f8f]">{label}</span>
          <span className="min-w-0 text-[#0d0d0d] dark:text-[#ececec]">{value}</span>
        </div>
      ))}
    </div>
  );
}

function PromptCard({ prompt, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const meta = prompt.metadata || {};

  async function copy() {
    await navigator.clipboard.writeText(prompt.prompt_text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article className={ms.card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-[#0d0d0d] dark:text-[#ececec]">
            {prompt.title || `Prompt #${prompt.sequence_number}`}
          </h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={ms.chip}>{platformLabel(prompt.target_platform)}</span>
            <span className={ms.neutralChip}>{prompt.media_type === "video" ? "Video" : "Görsel"}</span>
            {prompt.media_content_ideas?.content_type ? (
              <span className={ms.neutralChip}>{contentTypeLabel(prompt.media_content_ideas.content_type)}</span>
            ) : null}
            {meta.aspectRatio ? <span className={ms.neutralChip}>{meta.aspectRatio}</span> : null}
            <span className={ms.neutralChip}>#{prompt.sequence_number}</span>
          </div>
          {prompt.media_content_ideas?.title ? (
            <p className={`mt-2 ${ms.muted}`}>{prompt.media_content_ideas.title}</p>
          ) : null}
        </div>
        <select
          value={prompt.status}
          onChange={(e) => onStatusChange(prompt.id, e.target.value)}
          className="rounded-full border border-black/[0.08] bg-[#f4f4f4] px-3 py-1.5 text-xs font-medium text-[#0d0d0d] outline-none focus:border-[#0285ff] dark:border-white/[0.08] dark:bg-[#212121] dark:text-[#ececec]"
        >
          {Object.entries(PROMPT_STATUSES).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <OnImageText text={meta.onImageText} />

      <div className="relative mt-3">
        <pre
          className={`whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-[#3d3d3d] dark:text-[#c5c5c5] ${
            expanded ? "" : "max-h-28 overflow-hidden"
          }`}
        >
          {prompt.prompt_text}
        </pre>
        {!expanded ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent dark:from-[#2f2f2f]" />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={copy} className={`${ms.primary} px-4 py-2 text-xs`}>
          <CopyIcon />
          {copied ? "Kopyalandı" : "Kopyala"}
        </button>
        <button type="button" onClick={() => setExpanded((v) => !v)} className={ms.ghost}>
          {expanded ? "Daralt" : "Tamamını göster"}
        </button>
        <span className={`ml-auto ${ms.muted}`}>
          {(prompt.prompt_text || "").split(/\s+/).filter(Boolean).length} kelime
        </span>
      </div>
    </article>
  );
}

function IdeaCard({ idea, onArchive, onDelete, onOpen }) {
  const prompts = idea.media_prompts || [];
  const completed = prompts.filter((p) => p.status === "completed").length;
  const progress = prompts.length ? Math.round((completed / prompts.length) * 100) : 0;

  return (
    <article className="rounded-3xl border border-black/[0.06] bg-white p-4 dark:border-white/[0.08] dark:bg-[#2f2f2f]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-[#0d0d0d] dark:text-[#ececec]">{idea.title}</h4>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className={ms.neutralChip}>{contentTypeLabel(idea.content_type)}</span>
            <span className={ms.chip}>{IDEA_STATUSES[idea.status] || idea.status}</span>
          </div>
        </div>
      </div>
      {idea.creative_brief ? (
        <p className={`mt-2 line-clamp-2 ${ms.muted}`}>{idea.creative_brief}</p>
      ) : null}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f4f4f4] dark:bg-[#212121]">
          <div className="h-full rounded-full bg-[#0285ff] transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[11px] tabular-nums text-[#8f8f8f]">
          {completed}/{prompts.length}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {onOpen ? (
          <button type="button" onClick={() => onOpen(idea)} className={ms.ghost}>
            Aç
          </button>
        ) : null}
        {onArchive && idea.status !== "archived" ? (
          <button type="button" onClick={() => onArchive(idea.id)} className={ms.ghost}>
            Arşivle
          </button>
        ) : null}
        <button type="button" onClick={() => onDelete?.(idea.id)} className={`${ms.danger} ml-auto`}>
          Sil
        </button>
      </div>
    </article>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-3xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-[#8f8f8f] dark:border-white/10">
      {children}
    </div>
  );
}

export default function MediaStudioTab({ project }) {
  const [section, setSection] = useState("create");
  const [stats, setStats] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const loadStats = useCallback(async () => {
    const res = await fetch(`/api/projects/${project.id}/media-studio/stats`);
    if (res.ok) setStats(await res.json());
  }, [project.id]);

  const loadSectionData = useCallback(async () => {
    setLoading(true);
    try {
      if (section === "archive") {
        const res = await fetch(
          `/api/projects/${project.id}/media-studio/ideas?status=archived${q ? `&q=${encodeURIComponent(q)}` : ""}`
        );
        setIdeas(res.ok ? await res.json() : []);
      } else if (section === "create") {
        const res = await fetch(`/api/projects/${project.id}/media-studio/ideas`);
        setIdeas(res.ok ? await res.json() : []);
      } else {
        const res = await fetch(
          `/api/projects/${project.id}/media-studio/prompts?status=${section}${q ? `&q=${encodeURIComponent(q)}` : ""}`
        );
        setPrompts(res.ok ? await res.json() : []);
      }
    } finally {
      setLoading(false);
    }
  }, [project.id, section, q]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadSectionData();
  }, [loadSectionData]);

  async function handleStatusChange(promptId, status) {
    const res = await fetch(`/api/projects/${project.id}/media-studio/prompts/${promptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await Promise.all([loadSectionData(), loadStats()]);
    }
  }

  async function handleArchive(ideaId) {
    await fetch(`/api/projects/${project.id}/media-studio/ideas/${ideaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    await Promise.all([loadSectionData(), loadStats()]);
  }

  async function handleDelete(ideaId) {
    if (!confirm("Bu içerik ve promptları silinsin mi?")) return;
    await fetch(`/api/projects/${project.id}/media-studio/ideas/${ideaId}`, { method: "DELETE" });
    await Promise.all([loadSectionData(), loadStats()]);
  }

  const recentIdeas = useMemo(() => (ideas || []).slice(0, 8), [ideas]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {project.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.logo_url}
              alt=""
              className="h-12 w-12 rounded-full border border-black/[0.06] bg-white object-contain p-1 dark:border-white/10"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0285ff] text-white">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="4" />
                <circle cx="12" cy="12" r="3.2" />
              </svg>
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-[#0d0d0d] dark:text-[#ececec]">Media Studio</h2>
            <p className="truncate text-sm text-[#5d5d5d] dark:text-[#b4b4b4]">
              {project.name}
              {project.description ? ` · ${project.description}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/api/media-studio/extension/download" className={ms.secondary}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
            </svg>
            Eklenti indir
          </a>
          <button type="button" onClick={() => setSection("create")} className={ms.primary}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Yeni içerik
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <StatCard label="İçerik" value={stats?.totalIdeas ?? "—"} />
        <StatCard label="Bekleyen" value={stats?.pendingPrompts ?? "—"} accent />
        <StatCard label="Devam" value={stats?.inProgressPrompts ?? "—"} />
        <StatCard label="Tamamlanan" value={stats?.completedPrompts ?? "—"} />
        <StatCard label="Arşiv" value={stats?.archivedIdeas ?? "—"} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className={ms.segment}>
          {STUDIO_SECTIONS.map((item) => (
            <button key={item.id} type="button" onClick={() => setSection(item.id)} className={ms.segmentBtn(section === item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        {section !== "create" ? (
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara…"
            className={`${ms.input} ml-auto max-w-xs py-2 sm:w-56`}
          />
        ) : null}
      </div>

      {msg ? (
        <p className="inline-flex rounded-full bg-[#0285ff] px-4 py-1.5 text-sm font-medium text-white">{msg}</p>
      ) : null}

      {section === "create" ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <CreateContentForm
            projectId={project.id}
            onCreated={async () => {
              setMsg("İçerik ve promptlar hazır");
              setSection("pending");
              await Promise.all([loadStats(), loadSectionData()]);
              setTimeout(() => setMsg(""), 3000);
            }}
          />
          <div className="space-y-2.5">
            <h3 className={`ml-1 ${ms.title}`}>Son içerikler</h3>
            {loading ? (
              <EmptyState>Yükleniyor…</EmptyState>
            ) : recentIdeas.length === 0 ? (
              <EmptyState>Henüz içerik yok.</EmptyState>
            ) : (
              recentIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  onOpen={() => setSection("pending")}
                />
              ))
            )}
          </div>
        </div>
      ) : null}

      {section === "archive" ? (
        <div className="grid gap-2.5 md:grid-cols-2">
          {loading ? (
            <EmptyState>Yükleniyor…</EmptyState>
          ) : ideas.length === 0 ? (
            <EmptyState>Arşiv boş.</EmptyState>
          ) : (
            ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} onDelete={handleDelete} />)
          )}
        </div>
      ) : null}

      {["pending", "in_progress", "completed"].includes(section) ? (
        <div className="space-y-3">
          {loading ? (
            <EmptyState>Yükleniyor…</EmptyState>
          ) : prompts.length === 0 ? (
            <EmptyState>Bu listede prompt yok.</EmptyState>
          ) : (
            prompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} onStatusChange={handleStatusChange} />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
