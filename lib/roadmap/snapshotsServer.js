import { uploadBufferToPublicBucket } from "@/lib/logoGenerationsServer";

export const ROADMAP_SNAPSHOTS_BUCKET = "crm-roadmap-snapshots";

export async function uploadRoadmapSnapshot({
  supabase,
  userId,
  projectId,
  snapshotId,
  buffer,
  contentType = "image/png",
}) {
  const scope = projectId ? `projects/${projectId}` : `users/${userId}`;
  const path = `${scope}/${snapshotId}.png`;

  const { publicUrl, storagePath } = await uploadBufferToPublicBucket({
    supabase,
    bucket: ROADMAP_SNAPSHOTS_BUCKET,
    buffer,
    path,
    contentType,
  });

  return { publicUrl, storagePath };
}
