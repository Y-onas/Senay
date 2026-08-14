import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, CalendarHeart } from 'lucide-react'
import type { CategorySlug } from '@/types'
import FoodVisual from '@/components/common/FoodVisual'
import { useEnabledServices } from '@/hooks/useEnabledServices'
import { useHomeSection } from '@/hooks/useHomeSection'

export default function HomeCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { content } = useHomeSection<{
    title?: string
    description?: string
    primaryText?: string
    primaryLink?: string
    secondaryText?: string
    secondaryLink?: string
  }>('cta')

  const { isHrefEnabled } = useEnabledServices()
  const secondaryLink = content?.secondaryLink ?? '/catering'
  const showCateringLink = isHrefEnabled(secondaryLink)

  const side: { name: string; category: CategorySlug }[] = [
    { name: 'Tibs', category: 'food' },
    { name: 'House Tela', category: 'drinks' },
  ]

  return (
    <section id="cta" className="relative overflow-hidden bg-yellow-brand" ref={ref}>
      <div className="absolute inset-0 overflow-hidden">
        <svg className="absolute h-full w-full" viewBox="0 0 1200 400" fill="none" preserveAspectRatio="none">
          {[0, 200, 400, 600, 800].map((x) => (
            <line key={x} x1={x} y1="400" x2={x + 400} y2="0" stroke="white" strokeWidth="3" opacity="0.3" />
          ))}
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-3">
          <motion.div
            className="hidden justify-center lg:flex"
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="h-56 w-56 overflow-hidden rounded-[2rem] shadow-xl">
              <FoodVisual {...side[0]} />
            </div>
          </motion.div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="heading-display text-3xl uppercase leading-tight text-burgundy sm:text-4xl lg:text-5xl">
              {content?.title ?? (
                <>
                  Hungry for Something
                  <br />
                  Truly Ethiopian?
                </>
              )}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-gray-800 sm:text-base">
              {content?.description ??
                'Order your favourites for delivery, or let us cater your next celebration. Either way, the clay pots are ready.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to={content?.primaryLink ?? '/shop'} className="btn-primary">
                {content?.primaryText ?? 'Order Now'}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              {showCateringLink ? (
                <Link
                  to={secondaryLink}
                  className="inline-flex items-center gap-2 rounded-full border border-burgundy/30 px-8 py-3.5 font-semibold text-burgundy transition-colors hover:bg-burgundy/5"
                >
                  <CalendarHeart className="h-4 w-4" />
                  {content?.secondaryText ?? 'Book Catering'}
                </Link>
              ) : null}
            </div>
          </motion.div>

          <motion.div
            className="hidden justify-center lg:flex"
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="h-56 w-56 overflow-hidden rounded-[2rem] shadow-xl">
              <FoodVisual {...side[1]} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
