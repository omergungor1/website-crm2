import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import NewProjectButton from "@/components/NewProjectButton";
import ProjectList from "@/components/ProjectList";
import Link from "next/link";

export const metadata = { title: "Dashboard — Site CRM" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);

  let query = supabase
    .from("projects")
    .select("*, installation_forms(public_token)")
    .order("created_at", { ascending: false });

  if (!admin) {
    query = query.eq("user_id", user.id);
  }

  const { data: projects } = await query;

  return (
    <div className="space-y-6">
      {admin && (
        <Link
          href="/crm"
          className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-400 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-2xl dark:bg-zinc-800">
              👥
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">Müşteri CRM</p>
              <p className="text-sm text-zinc-500">Müşteri gruplarını yönet, aramalar takip et</p>
            </div>
          </div>
          <span className="text-zinc-400">→</span>
        </Link>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Projeler</h1>
          <p className="text-sm text-zinc-500">
            {admin ? "Tüm projeler (admin görünümü)" : "Sizin projeleriniz"}
          </p>
        </div>
        <NewProjectButton />
      </div>

      <ProjectList initialProjects={projects || []} isAdmin={admin} />
    </div>
  );
}
