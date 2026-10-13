import { createRoadmapSnapshotsHandlers } from "@/lib/roadmap/snapshotsApi";

const handlers = createRoadmapSnapshotsHandlers();

export const GET = handlers.GET;
export const POST = handlers.POST;
