"use client";

import Link from "next/link";

const STATUS_LABEL = { pending: "Beklemede", paid: "Ödendi" };
const STATUS_COLOR = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
};

const TYPE_LABEL = {
  landing_page: "Landing Page",
  saas: "SaaS",
  mobile_app: "Mobile App",
};

const TYPE_COLOR = {
  landing_page: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  saas: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  mobile_app: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

export default function ProjectList({ initialProjects, isAdmin }) {
  const projects = initialProjects;

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500">Henüz proje yok. &quot;+ Yeni Site&quot; ile başlayın.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-300">
              {project.name}
            </h3>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[project.type] || TYPE_COLOR.landing_page}`}
              >
                {TYPE_LABEL[project.type] || project.type || "Landing Page"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[project.payment_status] || STATUS_COLOR.pending}`}
              >
                {STATUS_LABEL[project.payment_status] || project.payment_status}
              </span>
            </div>
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{project.description}</p>
          )}
          <p className="mt-2 text-xs text-zinc-400">
            {new Date(project.created_at).toLocaleDateString("tr-TR")}
          </p>
        </Link>
      ))}
    </div>
  );
}
