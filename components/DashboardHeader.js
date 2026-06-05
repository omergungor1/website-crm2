"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProjectSwitcher from "@/components/ProjectSwitcher";

function DefaultAvatarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

export default function DashboardHeader({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const showProjectSwitcher = pathname?.startsWith("/projects/");

  useEffect(() => {
    if (!userMenuOpen) return;

    function onKeyDown(e) {
      if (e.key === "Escape") setUserMenuOpen(false);
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
  }, [userMenuOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="relative border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
            onClick={() => setUserMenuOpen(false)}
          >
            <Image
              src="/logo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain"
              priority
            />
            <span className="truncate text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Was CRM
            </span>
          </Link>
          {showProjectSwitcher && (
            <Suspense
              fallback={
                <select
                  disabled
                  className="min-w-0 max-w-[9rem] truncate rounded-lg border border-zinc-200 bg-zinc-100 px-2 py-1.5 text-xs text-zinc-400 sm:max-w-[14rem] sm:text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  aria-label="Proje seç"
                >
                  <option>Yükleniyor…</option>
                </select>
              }
            >
              <ProjectSwitcher />
            </Suspense>
          )}
        </div>

        {user && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-label="Hesap menüsü"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              <DefaultAvatarIcon className="h-5 w-5" />
            </button>

            {userMenuOpen && (
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
            )}
          </div>
        )}
      </div>
    </header>
  );
}
