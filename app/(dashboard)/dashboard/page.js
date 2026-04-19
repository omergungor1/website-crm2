import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getDashboardCounts } from "@/lib/dashboardCounts";
import NewProjectButton from "@/components/NewProjectButton";
import ProjectList from "@/components/ProjectList";
import DashboardFeatureGrid from "@/components/dashboard/DashboardFeatureGrid";

export const metadata = { title: "Dashboard — WebsiteAlSat CRM" };

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

  const counts = await getDashboardCounts(supabase, user?.id, admin);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Admin Sayfaları
        </h2>
        <DashboardFeatureGrid
          admin={admin}
          pendingUpdates={counts.pendingUpdates}
          pendingInstallations={counts.pendingInstallations}
          paymentPending={counts.paymentPending}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
