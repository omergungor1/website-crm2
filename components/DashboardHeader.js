"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SiteTodoModal from "@/components/SiteTodoModal";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useDashboardChrome } from "@/components/DashboardChrome";
import { useDeepWorkSessionOptional } from "@/components/deep-work/DeepWorkSessionProvider";

function DefaultAvatarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function MenuIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function SidebarCollapseIcon({ collapsed, className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      {collapsed ? (
        <path strokeLinecap="round" d="M9 8v8M12 12h6M15 9.5l2.5 2.5L15 14.5" />
      ) : (
        <path strokeLinecap="round" d="M9 8v8M15 12H9M11.5 9.5L9 12l2.5 2.5" />
      )}
    </svg>
  );
}

export default function DashboardHeader({ user, admin = false }) {
  const router = useRouter();
  const menuRef = useRef(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const session = useDeepWorkSessionOptional();
  const { collapsed, toggleCollapsed } = useDashboardChrome();

  useEffect(() => {
    if (!userMenuOpen && !todoModalOpen && !mobileNavOpen) return;

    function onKeyDown(e) {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
        setTodoModalOpen(false);
        setMobileNavOpen(false);
      }
    }

    function onPointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [userMenuOpen, todoModalOpen, mobileNavOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <DashboardSidebar
        admin={admin}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        todoActive={todoModalOpen}
        onOpenTodo={() => setTodoModalOpen(true)}
      />

      <header className="sticky top-0 z-30 overflow-x-hidden border-b border-zinc-200/80 bg-white/90 backdrop-blur-md transition-[margin] duration-200 dark:border-zinc-800 dark:bg-zinc-900/90 md:ml-[var(--dashboard-sidebar-width)]">
        <div className="flex h-[var(--dashboard-topbar-height)] min-w-0 items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
              aria-label="Menüyü aç"
              onClick={() => setMobileNavOpen(true)}
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              className="hidden h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 md:inline-flex"
              aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
              title={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
              onClick={toggleCollapsed}
            >
              <SidebarCollapseIcon collapsed={collapsed} className="h-5 w-5" />
            </button>

            <p className="hidden truncate text-sm text-zinc-500 md:block">
              Ürün yol haritanı ve ekibini tek yerden yönet
            </p>
          </div>

          {user ? (
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {session?.hasSession ? (
                <div className="flex max-w-[14rem] items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 dark:border-emerald-900 dark:bg-emerald-950/40 sm:max-w-none sm:px-3">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      session.isPaused ? "bg-amber-500" : "animate-pulse bg-emerald-500"
                    }`}
                  />
                  <div className="hidden min-w-0 sm:block">
                    <p className="font-mono text-xs font-semibold tabular-nums text-emerald-900 dark:text-emerald-200">
                      {session.timerLabel}
                    </p>
                    <div className="mt-0.5 h-1 w-20 overflow-hidden rounded-full bg-emerald-200/80 dark:bg-emerald-900">
                      <div
                        className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400"
                        style={{ width: `${Math.min(100, session.progress.percent)}%` }}
                      />
                    </div>
                  </div>
                  <p className="font-mono text-xs font-semibold tabular-nums text-emerald-900 dark:text-emerald-200 sm:hidden">
                    {session.timerLabel}
                  </p>
                  <button
                    type="button"
                    disabled={session.busy}
                    onClick={() => session.togglePause()}
                    className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-emerald-800 hover:bg-white dark:bg-emerald-900/60 dark:text-emerald-100"
                    title={session.isPaused ? "Devam" : "Duraklat"}
                  >
                    {session.isPaused ? "▶" : "❚❚"}
                  </button>
                  <Link
                    href="/dashboard/deep-work?tab=board"
                    className="hidden rounded-full px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 hover:underline dark:text-emerald-300 lg:inline"
                  >
                    Deep Work
                  </Link>
                </div>
              ) : null}

              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Hesap menüsü"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)] transition-colors hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-950"
                >
                  <DefaultAvatarIcon className="h-5 w-5" />
                </button>

                {userMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Hesap</p>
                      <p className="mt-1 break-all text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {user.email}
                      </p>
                    </div>
                    <div className="p-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                        </svg>
                        Çıkış
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <SiteTodoModal open={todoModalOpen} onClose={() => setTodoModalOpen(false)} />
    </>
  );
}
