"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DomainTab from "@/components/project/DomainTab";
import PagesTab from "@/components/project/PagesTab";
import InstallationTab from "@/components/project/InstallationTab";
import UpdatesTab from "@/components/project/UpdatesTab";
import SettingsTab from "@/components/project/SettingsTab";

const TABS = [
  { key: "installation", label: "Kurulum Formu" },
  { key: "updates", label: "Güncellemeler" },
  { key: "domain", label: "Domain" },
  { key: "pages", label: "Sayfalar" },
  { key: "blog", label: "Blog" },
  { key: "messages", label: "Mesajlar" },
  { key: "settings", label: "Ayarlar" },
];

const VALID_TABS = TABS.map((t) => t.key);

export default function ProjectDetail({ project, isAdmin, currentUserId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : "installation";

  function setActiveTab(key) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const publicToken = project.installation_forms?.[0]?.public_token;
  const publicFormUrl = publicToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/public/form/${publicToken}`
    : null;

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm sm:h-9 sm:w-9 dark:bg-zinc-100 dark:text-zinc-900">
            <svg
              className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
            </svg>
          </span>
          <span className="text-xs font-medium sm:text-sm">Dashboard</span>
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-zinc-500">{project.description}</p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${project.payment_status === "paid"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
            }`}
        >
          {project.payment_status === "paid" ? "Ödendi" : "Beklemede"}
        </span>
      </div>

      {/* Sekmeler */}
      <div className="border-b border-zinc-200 dark:border-zinc-700">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.key
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Sekme içeriği */}
      <div className="pb-24">
        {activeTab === "installation" && (
          <InstallationTab
            projectId={project.id}
            publicToken={publicToken}
            isAdmin={isAdmin}
          />
        )}
        {activeTab === "updates" && (
          <UpdatesTab
            projectId={project.id}
            projectName={project.name}
            isAdmin={isAdmin}
            publicToken={project.update_public_token}
          />
        )}
        {activeTab === "domain" && (
          <DomainTab
            projectId={project.id}
            initialDomains={project.domains || []}
          />
        )}
        {activeTab === "pages" && <PagesTab sitePages={project.site_pages || []} />}
        {activeTab === "blog" && (
          <div className="rounded-xl border border-zinc-200 p-8 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500">Blog özelliği yakında eklenecek.</p>
          </div>
        )}
        {activeTab === "messages" && (
          <div className="rounded-xl border border-zinc-200 p-8 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500">Mesajlar özelliği yakında eklenecek.</p>
          </div>
        )}
        {activeTab === "settings" && (
          <SettingsTab projectId={project.id} />
        )}
      </div>
    </div>
  );
}
