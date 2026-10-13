import { deleteRoadmapSnapshot } from "@/lib/roadmap/snapshotsApi";

export async function DELETE(request, { params }) {
  const { snapshotId } = await params;
  return deleteRoadmapSnapshot({ snapshotId });
}
