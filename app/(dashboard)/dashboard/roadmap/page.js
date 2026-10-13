import RoadmapShell from "@/components/roadmap/RoadmapShell";

export const metadata = { title: "Was Ekip — RoadMap" };

export default function RoadmapPage() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 top-[var(--dashboard-topbar-height)] z-20 bg-[var(--app-bg)] dark:bg-zinc-950 md:left-[var(--dashboard-sidebar-width)]"
      aria-label="RoadMap"
    >
      <RoadmapShell />
    </div>
  );
}
