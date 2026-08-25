export type VideoPlatform = 'youtube' | 'tiktok'

export function detectVideoPlatform(url: string): VideoPlatform | null {
  const lower = url.toLowerCase()
  if (lower.includes('tiktok.com')) return 'tiktok'
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
  return null
}

export function getTikTokVideoId(url: string): string | null {
  const match = url.trim().match(/\/video\/(\d+)/)
  return match?.[1] ?? null
}

export function getYoutubeEmbedUrl(url: string): string | null {
  const input = url.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return `https://www.youtube-nocookie.com/embed/${input}?rel=0&modestbranding=1&playsinline=1`
  }

  try {
    const parsed = new URL(input)
    const host = parsed.hostname.replace(/^www\./, '')
    let id: string | null = null

    if (host === 'youtu.be') {
      id = parsed.pathname.split('/').filter(Boolean)[0] || null
    } else if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      if (parsed.pathname === '/watch') {
        id = parsed.searchParams.get('v')
      } else {
        const parts = parsed.pathname.split('/').filter(Boolean)
        if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') {
          id = parts[1] || null
        }
      }
    }

    if (!id) return null
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`
  } catch {
    return null
  }
}

export function getTikTokEmbedUrl(url: string): string | null {
  const videoId = getTikTokVideoId(url)
  if (!videoId) return null
  return `https://www.tiktok.com/player/v1/${videoId}?music_info=0&description=0&rel=0`
}

export function resolveVideoPlatform(url: string, platform?: VideoPlatform | string): VideoPlatform {
  if (platform === 'tiktok' || platform === 'youtube') return platform
  return detectVideoPlatform(url) || 'youtube'
}

export function getVideoEmbedUrl(url: string, platform?: VideoPlatform | string): string | null {
  const resolved = resolveVideoPlatform(url, platform)
  if (resolved === 'tiktok') return getTikTokEmbedUrl(url)
  if (resolved === 'youtube') return getYoutubeEmbedUrl(url)
  return null
}

export function isSupportedVideoUrl(url: string): boolean {
  const trimmed = url.trim()
  return detectVideoPlatform(trimmed) !== null && getVideoEmbedUrl(trimmed) !== null
}

export function getVideoFrameClass(platform: VideoPlatform): string {
  if (platform === 'tiktok') {
    return 'relative mx-auto w-full max-w-[280px] overflow-hidden bg-black aspect-[9/16] rounded-xl'
  }
  return 'relative overflow-hidden aspect-video bg-black w-full rounded-xl'
}
