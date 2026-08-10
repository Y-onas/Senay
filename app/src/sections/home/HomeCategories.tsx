import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import FoodVisual from '@/components/common/FoodVisual'
import { useHomeSection } from '@/hooks/useHomeSection'
import { resolveImageSrc } from '@/lib/image-url'

type CategoryCard = {
  label: string
  image?: string
}

const fallbackCards: CategoryCard[] = [
  { label: 'Doro Wat', image: '/images/foodreference.webp' },
  { label: 'Tibs', image: '/images/cat-chicken.webp' },
  { label: 'Shiro Wat', image: '/images/shiro-clean.webp' },
  { label: 'House Tela', image: '/images/tela-clean.webp' },
  { label: 'Classic Tej', image: '/images/tej-clean.webp' },
  { label: 'Beyaynetu', image: '/images/foodreference.webp' },
  { label: 'Baltina', image: '/images/senay-shiro-cut.webp' },
  { label: 'Catering', image: '/images/catering-risotto.jpg' },
]

function CategoryCardMarquee({ label, image }: CategoryCard) {
  return (
    <div className="mx-4 w-52 flex-shrink-0 md:mx-5 md:w-60">
      <div className="flex flex-col items-center rounded-2xl bg-cream-warm p-5">
        <div className="h-32 w-32 overflow-hidden rounded-2xl md:h-36 md:w-36">
          {image ? (
            <img
              src={resolveImageSrc(image, 384)}
              alt={label}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <FoodVisual name={label} category="food" />
          )}
        </div>
        <p className="mt-3 text-center font-display text-base font-bold uppercase text-brown">
          {label}
        </p>
      </div>
    </div>
  )
}

function CategoryCardGrid({ label, image }: CategoryCard) {
  return (
    <div className="flex flex-col rounded-2xl bg-cream-warm p-2.5">
      <div className="aspect-square w-full overflow-hidden rounded-xl">
        {image ? (
          <img
            src={resolveImageSrc(image, 384)}
            alt={label}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <FoodVisual name={label} category="food" />
        )}
      </div>
      <p className="mt-2 text-center text-sm font-semibold text-brown">{label}</p>
    </div>
  )
}

export default function HomeCategories() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { content } = useHomeSection<{
    eyebrow?: string
    title?: string
    description?: string
    cards?: CategoryCard[]
  }>('categories')

  const cards =
    content?.cards
      ?.map((card) => ({
        label: typeof card.label === 'string' ? card.label : String(card.label ?? ''),
        image: card.image,
      }))
      .filter((card) => card.label.trim()) ?? fallbackCards

  const marqueeTrack = [...cards, ...cards]

  return (
    <section id="categories" className="overflow-hidden bg-cream pb-12 pt-6 sm:pb-16 sm:pt-8" ref={ref}>
      <motion.div
        className="mb-8 px-4 text-center sm:mb-10 sm:px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <div className="section-label justify-center text-burgundy">
          <span className="text-xs sm:text-sm">{content?.eyebrow ?? 'Explore'}</span>
        </div>
        <h2 className="heading-display text-2xl uppercase text-gray-900 sm:text-3xl lg:text-4xl">
          {content?.title ?? 'Categories'}
        </h2>
        {content?.description ? (
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-500 sm:text-base">
            {content.description}
          </p>
        ) : null}
      </motion.div>

      <div className="hidden md:block">
        <div className="animate-marquee-left flex w-max">
          {marqueeTrack.map((cat, i) => (
            <CategoryCardMarquee key={`category-marquee-${i}`} {...cat} />
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 sm:grid-cols-3 sm:px-6 md:hidden">
        {cards.map((cat, i) => (
          <CategoryCardGrid key={`category-grid-${i}`} {...cat} />
        ))}
      </div>
    </section>
  )
}
