import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { restaurant } from '@/data/restaurant'
import type { OpeningHour } from '@/types'
import FoodVisual from '@/components/common/FoodVisual'
import { getRestaurantInfo } from '@/services/contentService'
import { useHomeSection } from '@/hooks/useHomeSection'

function revealOnMount(delay = 0, axis: 'x' | 'y' = 'y', offset = 30) {
  const initial =
    axis === 'x' ? { opacity: 0, x: offset } : { opacity: 0, y: offset }
  const animate = axis === 'x' ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 }
  return {
    initial,
    animate,
    transition: { duration: 0.7, delay },
  } as const
}

export default function HomeStory() {
  const { content, loading } = useHomeSection<{
    eyebrow?: string
    title?: string
    description?: string
    image?: string
    buttonText?: string
    buttonLink?: string
  }>('story')
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>(restaurant.openingHours)

  useEffect(() => {
    getRestaurantInfo()
      .then((info) => setOpeningHours(info.openingHours))
      .catch(() => {})
  }, [])

  const hasSectionText = Boolean(
    String(content?.eyebrow ?? '').trim() ||
      String(content?.title ?? '').trim() ||
      String(content?.description ?? '').trim(),
  )

  if (!loading && !hasSectionText && !content?.image) return null

  return (
    <section id="about" className="bg-cream py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div className="relative" {...revealOnMount(0, 'x', -40)}>
            <div className="relative mx-auto w-full max-w-md">
              <div className="relative overflow-hidden rounded-b-3xl rounded-t-[200px] bg-burgundy">
                <div className="absolute left-1/2 top-4 z-10 h-12 w-px -translate-x-1/2 bg-white/20" />
                <div className="h-[400px] w-full sm:h-[500px]">
                  {content?.image ? (
                    <img
                      src={content.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FoodVisual name="Coffee Ceremony" category="drinks" />
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div {...revealOnMount(0.2, 'x', 40)}>
            {content?.eyebrow ? (
              <div className="section-label text-burgundy">
                <span className="text-xs sm:text-sm">{content.eyebrow}</span>
              </div>
            ) : null}
            {content?.title ? (
              <h2 className="heading-display text-3xl uppercase leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
                {content.title}
              </h2>
            ) : null}
            {content?.description ? (
              <p className="mt-4 text-sm leading-relaxed text-gray-500 sm:text-base">
                {content.description}
              </p>
            ) : null}

            <div className="mt-8">
              <h4 className="font-display text-lg font-bold uppercase tracking-wide text-gray-900">
                Opening Hours
              </h4>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                {openingHours.map((h, i) => (
                  <p key={h.day || `hours-${i}`}>
                    {h.day}: {h.hours}
                  </p>
                ))}
              </div>
            </div>

            {content?.buttonText && content?.buttonLink ? (
              <Link to={content.buttonLink} className="btn-primary mt-8">
                {content.buttonText}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : null}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
