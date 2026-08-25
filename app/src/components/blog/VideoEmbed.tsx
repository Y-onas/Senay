import {
  getVideoEmbedUrl,
  getVideoFrameClass,
  resolveVideoPlatform,
  type VideoPlatform,
} from '@/lib/video-url'

interface VideoEmbedProps {
  url: string
  platform?: VideoPlatform | string
  title?: string
  layout?: 'grid' | 'list' | 'article'
  className?: string
}

export default function VideoEmbed({
  url,
  platform: platformProp,
  title = 'Embedded video',
  layout = 'article',
  className = '',
}: VideoEmbedProps) {
  const platform = resolveVideoPlatform(url, platformProp)
  const embedUrl = getVideoEmbedUrl(url, platform)

  if (!embedUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium text-burgundy underline underline-offset-4"
      >
        Watch on {platform === 'tiktok' ? 'TikTok' : 'YouTube'}
      </a>
    )
  }

  const frameClass = `${getVideoFrameClass(platform, layout)} ${className}`.trim()

  return (
    <div className={frameClass}>
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}
