import { createRoadmapSnapshotsHandlers } from "@/lib/roadmap/snapshotsApi";

export async function GET(request, { params }) {
  const { id: projectId } = await params;
  const handlers = createRoadmapSnapshotsHandlers({ projectId });
  return handlers.GET();
}

export async function POST(request, { params }) {
  const { id: projectId } = await params;
  const handlers = createRoadmapSnapshotsHandlers({ projectId });
  return handlers.POST(request);
}
