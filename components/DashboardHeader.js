"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardHeader({ user }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          Site CRM
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-zinc-500 sm:block">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
  );
}
