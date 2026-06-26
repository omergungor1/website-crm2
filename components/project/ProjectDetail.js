"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DomainTab from "@/components/project/DomainTab";
import PagesTab from "@/components/project/PagesTab";
import InstallationTab from "@/components/project/InstallationTab";
import UpdatesTab from "@/components/project/UpdatesTab";
import SettingsTab from "@/components/project/SettingsTab";
import DbSchemaPlannerTab from "@/components/project/DbSchemaPlannerTab";
import KeywordExplorerTab from "@/components/project/KeywordExplorerTab";
import LogoTab from "@/components/project/LogoTab";
import CopyFastTab from "@/components/project/CopyFastTab";
import AiTitleGeneratorTab from "@/components/project/AiTitleGeneratorTab";
import ProjectOverviewTab from "@/components/project/ProjectOverviewTab";
import TodoListTab from "@/components/project/TodoListTab";
import MvpFeaturesTab from "@/components/project/MvpFeaturesTab";
import ProjectMetaFilters from "@/components/project/ProjectMetaFilters";
import { getTabsForProjectType, TabIcon, DEFAULT_PROJECT_TAB } from "@/components/project/ProjectNavSidebar";

export default function ProjectDetail({ project, isAdmin, currentUserId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const projectType = project.type || "landing_page";
  const tabs = useMemo(() => getTabsForProjectType(projectType), [projectType]);
  const validTabKeys = useMemo(() => tabs.map((t) => t.key), [tabs]);
  const activeTab = validTabKeys.includes(tabParam) ? tabParam : DEFAULT_PROJECT_TAB;

  function setActiveTab(key) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const publicToken = project.installation_forms?.[0]?.public_token;
  const isSchemaPlanner = activeTab === "db-schema-planner";

  useEffect(() => {
    if (!isSchemaPlanner) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSchemaPlanner]);

  useEffect(() => {
    if (tabParam && !validTabKeys.includes(tabParam)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", DEFAULT_PROJECT_TAB);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [tabParam, validTabKeys, searchParams, router]);

  if (isSchemaPlanner) {
    return (
      <div className="fixed inset-0 z-[200] bg-white dark:bg-zinc-950">
        <DbSchemaPlannerTab
          projectId={project.id}
          projectName={project.name}
          projectDescription={project.description}
          fullscreen
          onBack={() => setActiveTab(DEFAULT_PROJECT_TAB)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-zinc-900 dark:text-zinc-50">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-zinc-500 line-clamp-2">{project.description}</p>
          )}
        </div> */}
      </div>

      <div className="flex gap-3 sm:gap-5">
        <aside className="w-[3.25rem] shrink-0 sm:w-52">
          <nav
            className="sticky top-4 flex flex-col gap-0.5 rounded-xl border border-zinc-200 bg-white p-1 sm:p-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            aria-label="Proje menüsü"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  title={tab.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors sm:px-3 sm:py-2.5 ${isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    }`}
                >
                  <TabIcon tabKey={tab.key} className="mx-auto h-5 w-5 shrink-0 sm:mx-0" />
                  <span className="hidden truncate text-sm font-medium sm:inline">{tab.label}</span>
                </button>
              );
            })}
            <div className="hidden sm:block">
              <ProjectMetaFilters
                readOnly
                activeStatus={project.status || "created"}
                activeType={projectType}
              />
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-24">
          {activeTab === "overview" && (
            <ProjectOverviewTab project={project} onNavigate={setActiveTab} />
          )}
          {activeTab === "todo-list" && <TodoListTab projectId={project.id} />}
          {activeTab === "mvp-features" && <MvpFeaturesTab projectId={project.id} />}
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
            <DomainTab projectId={project.id} initialDomains={project.domains || []} />
          )}
          {activeTab === "pages" && <PagesTab sitePages={project.site_pages || []} />}
          {activeTab === "keyword-explorer" && (
            <KeywordExplorerTab projectId={project.id} />
          )}
          {activeTab === "logo" && (
            <LogoTab
              projectId={project.id}
              projectName={project.name}
              projectDescription={project.description}
            />
          )}
          {activeTab === "copyfast" && (
            <CopyFastTab projectId={project.id} projectName={project.name} />
          )}
          {activeTab === "ai-title-generator" && (
            <AiTitleGeneratorTab projectId={project.id} projectName={project.name} />
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
            <SettingsTab
              projectId={project.id}
              initialProjectName={project.name}
              initialIsArchived={project.is_archived}
              initialPaymentStatus={project.payment_status}
              initialProjectType={project.type || "landing_page"}
            />
          )}
        </main>
      </div>
    </div>
  );
}
