"use client";

import { useState } from "react";
import Link from "next/link";
import DomainTab from "@/components/project/DomainTab";
import InstallationTab from "@/components/project/InstallationTab";
import UpdatesTab from "@/components/project/UpdatesTab";
import SettingsTab from "@/components/project/SettingsTab";

const TABS = [
  { key: "installation", label: "Kurulum Formu" },
  { key: "updates", label: "Güncellemeler" },
  { key: "domain", label: "Domain" },
  { key: "blog", label: "Blog" },
  { key: "messages", label: "Mesajlar" },
  { key: "settings", label: "Ayarlar" },
];

export default function ProjectDetail({ project, isAdmin, currentUserId }) {
  const [activeTab, setActiveTab] = useState("installation");
  const publicToken = project.installation_forms?.[0]?.public_token;
  const publicFormUrl = publicToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/public/form/${publicToken}`
    : null;

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Dashboard
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
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            project.payment_status === "paid"
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
              className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
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
          />
        )}
        {activeTab === "domain" && (
          <DomainTab
            projectId={project.id}
            initialDomains={project.domains || []}
          />
        )}
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
