import DeepWorkShell from "@/components/deep-work/DeepWorkShell";

export const metadata = { title: "Deep Work — Was CRM" };

export default function DeepWorkPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Deep Work</h1>
          <p className="text-sm text-zinc-500">Proje todolarını güne planla · günlük hedef 2 saat</p>
        </div>
      </div>
      <DeepWorkShell />
    </div>
  );
}
