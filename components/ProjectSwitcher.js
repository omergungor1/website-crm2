"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function ProjectSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const match = pathname?.match(/^\/projects\/([^/]+)/);
  const currentProjectId = match?.[1] || "";

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentProjectId) {
      setProjects([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/projects")
      .then((r) => r.json())
      .then(async (list) => {
        if (cancelled) return;
        const items = Array.isArray(list) ? [...list] : [];

        if (!items.some((p) => p.id === currentProjectId)) {
          const res = await fetch(`/api/projects/${currentProjectId}`);
          if (res.ok) {
            const current = await res.json();
            items.unshift(current);
          }
        }

        setProjects(items);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentProjectId]);

  if (!currentProjectId) return null;

  function handleChange(e) {
    const newId = e.target.value;
    if (!newId || newId === currentProjectId) return;

    const qs = searchParams.toString();
    router.push(qs ? `/projects/${newId}?${qs}` : `/projects/${newId}`);
  }

  const selectCls =
    "min-w-0 max-w-[9rem] truncate rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-900 focus:border-zinc-400 focus:outline-none sm:max-w-[14rem] sm:px-2.5 sm:py-2 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <select
      value={currentProjectId}
      onChange={handleChange}
      disabled={loading || projects.length === 0}
      className={selectCls}
      aria-label="Proje seç"
    >
      {loading && projects.length === 0 ? (
        <option value={currentProjectId}>Yükleniyor…</option>
      ) : (
        projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))
      )}
    </select>
  );
}
