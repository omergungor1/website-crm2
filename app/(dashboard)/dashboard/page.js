import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import NewProjectButton from "@/components/NewProjectButton";
import ProjectList from "@/components/ProjectList";

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
