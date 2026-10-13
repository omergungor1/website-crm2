import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/isAdmin";
import DashboardHeader from "@/components/DashboardHeader";
import { DashboardChromeProvider } from "@/components/DashboardChrome";
import { DeepWorkSessionProvider } from "@/components/deep-work/DeepWorkSessionProvider";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);

  if (!user) {
    redirect("/login");
  }

  return (
    <DeepWorkSessionProvider>
      <DashboardChromeProvider>
        <DashboardHeader user={user} admin={admin} />
        <main className="mx-auto w-full max-w-[1600px] px-3 py-6 transition-[margin,width] duration-200 sm:px-6 md:ml-[var(--dashboard-sidebar-width)] md:w-[calc(100%_-_var(--dashboard-sidebar-width))]">
          {children}
        </main>
      </DashboardChromeProvider>
    </DeepWorkSessionProvider>
  );
}
