export function parseYoutubeVideoId(url) {
  const raw = String(url || "").trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      const match = parsed.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/);
      if (match) return match[2];
    }
  } catch {
    return null;
  }

  return null;
}

export function getYoutubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

export function getYoutubeThumbnailUrl(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYoutubeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
