export function getSnapshotFileName(snapshot) {
  const safeName = (snapshot?.name || "roadmap-snapshot")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 80);
  return `${safeName}.png`;
}

export async function downloadSnapshotPng(snapshot) {
  if (!snapshot?.image_url) return;

  const filename = getSnapshotFileName(snapshot);

  try {
    const res = await fetch(snapshot.image_url);
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch {
    const link = document.createElement("a");
    link.href = snapshot.image_url;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
