"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ProjectSwitcher, { preloadProjects } from "@/components/ProjectSwitcher";
import { useDashboardChrome } from "@/components/DashboardChrome";

function ProjectsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A1.5 1.5 0 014.5 6h5.379a1.5 1.5 0 011.06.44l1.122 1.12A1.5 1.5 0 0013.121 8H19.5A1.5 1.5 0 0121 9.5v8A1.5 1.5 0 0119.5 19h-15A1.5 1.5 0 013 17.5v-10z" />
    </svg>
  );
}

function HomeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
    </svg>
  );
}

function DeepWorkIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M15 9V4.5M9 15v4.5M15 15v4.5M4.5 9H9m6 0h4.5M4.5 15H9m6 0h4.5" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

function RoadmapIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="6" cy="6" r="2.25" />
      <circle cx="18" cy="12" r="2.25" />
      <circle cx="8" cy="18" r="2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7.5l7.5 3.5M10 16.5l5.5-3" />
    </svg>
  );
}

function CrmIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 10a4 4 0 100-8 4 4 0 000 8zM23 20v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function TodoIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4" />
    </svg>
  );
}

function navItemClass(active) {
  return `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active
      ? "bg-[var(--brand-soft)] text-[var(--brand)]"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    }`;
}

function SidebarPanel({ admin, todoActive, onClose, onOpenTodo }) {
  const pathname = usePathname();
  const projectsMenuRef = useRef(null);
  const projectLoadingTimerRef = useRef(null);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [projectNavigating, setProjectNavigating] = useState(false);
  const [activeProjectName, setActiveProjectName] = useState("");

  const isHomeActive = pathname === "/dashboard";
  const isDeepWorkActive = pathname?.startsWith("/dashboard/deep-work");
  const isRoadmapActive = pathname?.startsWith("/dashboard/roadmap");
  const isCrmActive = pathname === "/crm" || pathname?.startsWith("/crm/");
  const isProjectsActive = pathname?.startsWith("/projects/");

  useEffect(() => {
    const timer = setTimeout(() => {
      setProjectsOpen(false);
      setProjectNavigating(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    const projectId = pathname?.match(/^\/projects\/([^/]+)/)?.[1] || "";

    preloadProjects().then((projects) => {
      if (cancelled) return;
      const activeProject = projects.find((project) => String(project.id) === projectId);
      setActiveProjectName(activeProject?.name || "");
    });

    return () => {
      cancelled = true;
      if (projectLoadingTimerRef.current) {
        clearTimeout(projectLoadingTimerRef.current);
      }
    };
  }, [pathname]);

  useEffect(() => {
    if (!projectsOpen) return;
    function onPointerDown(e) {
      if (projectsMenuRef.current && !projectsMenuRef.current.contains(e.target)) {
        setProjectsOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [projectsOpen]);

  function handleNavClick() {
    onClose?.();
  }

  function handleProjectNavigate() {
    setProjectNavigating(true);
    setProjectsOpen(false);
    handleNavClick();
    if (projectLoadingTimerRef.current) {
      clearTimeout(projectLoadingTimerRef.current);
    }
    projectLoadingTimerRef.current = setTimeout(() => {
      setProjectNavigating(false);
    }, 8000);
  }

  return (
    <aside
      className="flex h-full w-[15rem] flex-col border-r border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      aria-label="Ana menü"
    >
      <div className="flex h-[var(--dashboard-topbar-height)] shrink-0 items-center gap-2.5 px-4">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-2.5"
          onClick={handleNavClick}
        >
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-xl object-contain"
            priority
          />
          <span className="truncate text-[15px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Was Ekip
          </span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3 pt-1">
        <div ref={projectsMenuRef} className="relative">
          <button
            type="button"
            className={navItemClass(isProjectsActive)}
            aria-expanded={projectsOpen}
            aria-haspopup="menu"
            onClick={() => setProjectsOpen((open) => !open)}
          >
            {projectNavigating ? (
              <span
                className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-label="Proje yükleniyor"
              />
            ) : (
              <ProjectsIcon className="h-5 w-5 shrink-0" />
            )}
            <span className="min-w-0 flex-1 truncate text-left">
              {activeProjectName || "Projeler"}
            </span>
            <svg
              className={`h-4 w-4 shrink-0 opacity-50 transition-transform ${projectsOpen ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {projectsOpen ? (
            <div
              role="menu"
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-950"
            >
              <Suspense fallback={<p className="px-3 py-2 text-sm text-zinc-400">Yükleniyor…</p>}>
                <ProjectSwitcher onNavigate={handleProjectNavigate} />
              </Suspense>
            </div>
          ) : null}
        </div>

        <Link
          href="/dashboard"
          className={navItemClass(isHomeActive)}
          onClick={handleNavClick}
        >
          <HomeIcon className="h-5 w-5 shrink-0" />
          <span>Ana Sayfa</span>
        </Link>

        <Link
          href="/dashboard/deep-work"
          className={navItemClass(isDeepWorkActive)}
          onClick={handleNavClick}
        >
          <DeepWorkIcon className="h-5 w-5 shrink-0" />
          <span>Deep Work</span>
        </Link>

        <button
          type="button"
          className={navItemClass(todoActive)}
          onClick={() => {
            onOpenTodo?.();
            handleNavClick();
          }}
        >
          <TodoIcon className="h-5 w-5 shrink-0" />
          <span>Todo</span>
        </button>

        <Link
          href="/dashboard/roadmap"
          className={navItemClass(isRoadmapActive)}
          onClick={handleNavClick}
        >
          <RoadmapIcon className="h-5 w-5 shrink-0" />
          <span>RoadMap</span>
        </Link>

        {admin ? (
          <Link href="/crm" className={navItemClass(isCrmActive)} onClick={handleNavClick}>
            <CrmIcon className="h-5 w-5 shrink-0" />
            <span>Müşteri CRM</span>
          </Link>
        ) : null}
      </nav>
    </aside>
  );
}

export default function DashboardSidebar({
  admin = false,
  mobileOpen = false,
  onClose,
  onOpenTodo,
  todoActive = false,
}) {
  const pathname = usePathname();
  const { sidebarHidden } = useDashboardChrome();

  useEffect(() => {
    onClose?.();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const panelProps = { admin, todoActive, onClose, onOpenTodo };

  return (
    <>
      <div
        className={`hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:transition-transform md:duration-200 ${
          sidebarHidden ? "-translate-x-full pointer-events-none" : "translate-x-0"
        }`}
        aria-hidden={sidebarHidden}
      >
        <SidebarPanel {...panelProps} />
      </div>

      <div
        className={`fixed inset-0 z-50 md:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-zinc-950/40 transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          aria-label="Menüyü kapat"
          onClick={onClose}
        />
        <div
          className={`absolute inset-y-0 left-0 transition-transform duration-200 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarPanel {...panelProps} />
        </div>
      </div>
    </>
  );
}
