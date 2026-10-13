/**
 * Roadmap snapshot storage upload — hedef projede logoGenerationsServer'a bağımlı olmadan çalışır.
 * Host uygulamada aynı isimli helper varsa onlar da kullanılabilir.
 */
export const ROADMAP_SNAPSHOTS_BUCKET = "crm-roadmap-snapshots";

export async function uploadBufferToPublicBucket({ supabase, bucket, buffer, path, contentType }) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: contentType || "image/png",
    upsert: true,
  });
  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  if (!urlData?.publicUrl) throw new Error("Public URL alınamadı");

  return { publicUrl: urlData.publicUrl, storagePath: data.path };
}

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
