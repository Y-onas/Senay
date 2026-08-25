export type VideoPlatform = "youtube" | "tiktok";

export function detectVideoPlatform(url: string): VideoPlatform | null {
  const lower = url.toLowerCase();
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  return null;
}

export function getTikTokVideoId(url: string): string | null {
  const match = url.trim().match(/\/video\/(\d+)/);
  return match?.[1] ?? null;
}

export function getYoutubeVideoId(url: string): string | null {
  const input = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

  try {
    const parsed = new URL(input);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] || null;
    }
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
        return parts[1] || null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function isSupportedVideoUrl(url: string): boolean {
  const trimmed = url.trim();
  const platform = detectVideoPlatform(trimmed);
  if (!platform) return false;
  if (platform === "youtube") return getYoutubeVideoId(trimmed) !== null;
  return getTikTokVideoId(trimmed) !== null;
}
