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

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}

function PromptCard({ prompt, onStatusChange, onCopy }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(prompt.prompt_text || "");
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {prompt.title || `Prompt #${prompt.sequence_number}`}
          </h4>
          <p className="mt-0.5 text-xs text-zinc-500">
            {contentTypeLabel(prompt.media_content_ideas?.content_type)} ·{" "}
            {platformLabel(prompt.target_platform)} · #{prompt.sequence_number}
            {prompt.media_content_ideas?.title ? ` · ${prompt.media_content_ideas.title}` : ""}
          </p>
        </div>
        <select
          value={prompt.status}
          onChange={(e) => onStatusChange(prompt.id, e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800"
        >
          {Object.entries(PROMPT_STATUSES).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <p className={`mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 ${expanded ? "" : "line-clamp-3"}`}>
        {prompt.prompt_text}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {copied ? "Kopyalandı" : "Kopyala"}
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          {expanded ? "Daralt" : "Genişlet"}
        </button>
      </div>
    </article>
  );
}

function IdeaCard({ idea, onArchive, onDelete, onOpen }) {
  const prompts = idea.media_prompts || [];
  const completed = prompts.filter((p) => p.status === "completed").length;

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{idea.title}</h4>
          <p className="mt-0.5 text-xs text-zinc-500">
            {contentTypeLabel(idea.content_type)} · {IDEA_STATUSES[idea.status] || idea.status} ·{" "}
            {completed}/{prompts.length} prompt
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onOpen?.(idea)}
            className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium dark:border-zinc-600"
          >
            Aç
          </button>
          {idea.status !== "archived" ? (
            <button
              type="button"
              onClick={() => onArchive?.(idea.id)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-500"
            >
              Arşivle
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onDelete?.(idea.id)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600"
          >
            Sil
          </button>
        </div>
      </div>
      {idea.creative_brief ? (
        <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{idea.creative_brief}</p>
      ) : null}
    </article>
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
        const statusMap = {
          pending: "pending",
          in_progress: "in_progress",
          completed: "completed",
        };
        const status = statusMap[section];
        const res = await fetch(
          `/api/projects/${project.id}/media-studio/prompts?status=${status}${q ? `&q=${encodeURIComponent(q)}` : ""}`
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-3">
          {project.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.logo_url}
              alt=""
              className="h-12 w-12 rounded-xl border border-zinc-200 object-contain dark:border-zinc-700"
            />
          ) : null}
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Media Studio</h2>
            <p className="text-sm text-zinc-500">
              {project.name}
              {project.description ? ` · ${project.description}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/media-studio/extension/download"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          >
            Eklenti indir
          </a>
          <button
            type="button"
            onClick={() => setSection("create")}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Yeni içerik
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <StatCard label="İçerik" value={stats?.totalIdeas ?? "—"} />
        <StatCard label="Bekleyen" value={stats?.pendingPrompts ?? "—"} />
        <StatCard label="Devam" value={stats?.inProgressPrompts ?? "—"} />
        <StatCard label="Tamamlanan" value={stats?.completedPrompts ?? "—"} />
        <StatCard label="Arşiv" value={stats?.archivedIdeas ?? "—"} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
          {STUDIO_SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                section === item.id
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {section !== "create" ? (
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara…"
            className="ml-auto w-full max-w-xs rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:w-56"
          />
        ) : null}
      </div>

      {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}

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
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Son içerikler</h3>
            {loading ? (
              <p className="text-sm text-zinc-400">Yükleniyor…</p>
            ) : recentIdeas.length === 0 ? (
              <p className="text-sm text-zinc-400">Henüz içerik yok.</p>
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
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-zinc-400">Yükleniyor…</p>
          ) : ideas.length === 0 ? (
            <p className="text-sm text-zinc-400">Arşiv boş.</p>
          ) : (
            ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onDelete={handleDelete} />
            ))
          )}
        </div>
      ) : null}

      {["pending", "in_progress", "completed"].includes(section) ? (
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-zinc-400">Yükleniyor…</p>
          ) : prompts.length === 0 ? (
            <p className="text-sm text-zinc-400">Bu listede prompt yok.</p>
          ) : (
            prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
