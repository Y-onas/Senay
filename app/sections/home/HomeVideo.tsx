import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useHomeSection } from '@/hooks/useHomeSection'

function revealOnMount(delay = 0) {
  return {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay },
  } as const
}

export default function HomeVideo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const { content, loading } = useHomeSection<{
    url?: string
    title?: string
    subtitle?: string
  }>('video')

  const videoUrl = content?.url?.trim() || '/images/chef-video.mp4'
  const hasOverlay = Boolean(
    String(content?.title ?? '').trim() || String(content?.subtitle ?? '').trim(),
  )

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  if (!loading && !videoUrl && !hasOverlay) return null

  return (
    <section ref={containerRef} className="bg-cream py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="relative overflow-hidden rounded-3xl" {...revealOnMount()}>
          {shouldLoad ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="none"
              className="h-[250px] w-full object-cover sm:h-[350px] md:h-[450px] lg:h-[500px]"
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : (
            <div
              className="h-[250px] w-full bg-burgundy/10 sm:h-[350px] md:h-[450px] lg:h-[500px]"
              aria-hidden
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          {hasOverlay ? (
            <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8">
              {content?.title ? (
                <p className="font-display text-2xl font-bold uppercase text-white sm:text-3xl">
                  {content.title}
                </p>
              ) : null}
              {content?.subtitle ? (
                <p className="mt-1 text-sm text-white/80">{content.subtitle}</p>
              ) : null}
            </div>
          ) : null}
        </motion.div>
      </div>
    </section>
  )
}
