"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

let cachedProjects = null;
let projectsFetchPromise = null;

function loadProjects() {
  if (cachedProjects) return Promise.resolve(cachedProjects);
  if (projectsFetchPromise) return projectsFetchPromise;

  projectsFetchPromise = fetch("/api/projects")
    .then((r) => r.json())
    .then((list) => {
      cachedProjects = Array.isArray(list) ? list : [];
      return cachedProjects;
    })
    .catch(() => {
      cachedProjects = [];
      return cachedProjects;
    })
    .finally(() => {
      projectsFetchPromise = null;
    });

  return projectsFetchPromise;
}

export default function ProjectSwitcher({ onNavigate }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const match = pathname?.match(/^\/projects\/([^/]+)/);
  const currentProjectId = match?.[1] || "";

  const [projects, setProjects] = useState(() => cachedProjects || []);
  const [loading, setLoading] = useState(() => !cachedProjects);

  useEffect(() => {
    let cancelled = false;

    if (cachedProjects) {
      setProjects(cachedProjects);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadProjects().then((items) => {
      if (!cancelled) {
        setProjects(items);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const qs = searchParams.toString();

  function projectHref(projectId) {
    if (currentProjectId && qs) {
      return `/projects/${projectId}?${qs}`;
    }
    return `/projects/${projectId}`;
  }

  return (
    <div className="max-h-72 overflow-y-auto py-1">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${pathname === "/dashboard"
            ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
      >
        Ana Sayfa
      </Link>

      <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

      {loading && projects.length === 0 ? (
        <p className="px-3 py-2 text-sm text-zinc-400">Yükleniyor…</p>
      ) : projects.length === 0 ? (
        <p className="px-3 py-2 text-sm text-zinc-400">Henüz proje yok</p>
      ) : (
        projects.map((project) => {
          const active = project.id === currentProjectId;
          return (
            <Link
              key={project.id}
              href={projectHref(project.id)}
              onClick={onNavigate}
              className={`flex items-center gap-2 truncate px-3 py-2 text-sm transition-colors ${active
                  ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
            >
              <span className="truncate">{project.name}</span>
            </Link>
          );
        })
      )}
    </div>
  );
}
