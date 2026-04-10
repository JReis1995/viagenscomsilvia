export function getYoutubeVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return u.searchParams.get("v");
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function getYoutubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function isLikelyVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("vimeo.com")
  );
}
