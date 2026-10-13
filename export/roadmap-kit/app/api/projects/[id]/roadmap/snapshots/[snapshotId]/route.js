import { deleteRoadmapSnapshot } from "@/lib/roadmap/snapshotsApi";

export async function DELETE(request, { params }) {
  const { id: projectId, snapshotId } = await params;
  return deleteRoadmapSnapshot({ snapshotId, projectId });
}
