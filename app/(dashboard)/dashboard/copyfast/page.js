import DashboardBackLink from "@/components/dashboard/DashboardBackLink";

export const metadata = { title: "CopyFast — Site CRM" };

export default function CopyFastPage() {
  return (
    <div>
      <DashboardBackLink />
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">CopyFast</h1>
      <p className="mt-1 text-sm text-zinc-500">Görüntüden prompt üreten SaaS özelliği burada olacak.</p>
      <div className="mt-10 rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500">İçerik yakında eklenecek.</p>
      </div>
    </div>
  );
}
