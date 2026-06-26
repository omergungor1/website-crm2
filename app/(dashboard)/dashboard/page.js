import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import ArchiveLinkButton from "@/components/ArchiveLinkButton";
import NewProjectButton from "@/components/NewProjectButton";
import DashboardProjects from "@/components/dashboard/DashboardProjects";

export const metadata = { title: "Was CRM" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);

  let query = supabase
    .from("projects")
    .select("*, installation_forms(public_token)")
    .eq("is_archived", false)
    .order("is_favorited", { ascending: false })
    .order("created_at", { ascending: false });

  if (!admin) {
    query = query.eq("user_id", user.id);
  }

  const { data: projects } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Projeler</h1>
          <p className="text-sm text-zinc-500">
            {admin ? "Tüm projeler (Admin)" : "Projeleriniz"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ArchiveLinkButton />
          <NewProjectButton />
        </div>
      </div>

      <DashboardProjects initialProjects={projects || []} isAdmin={admin} />
    </div>
  );
}
