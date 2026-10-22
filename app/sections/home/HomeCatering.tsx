import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import type { CategorySlug } from '@/types'
import FoodVisual from '@/components/common/FoodVisual'
import { useEnabledServices } from '@/hooks/useEnabledServices'
import { useHomeSection } from '@/hooks/useHomeSection'

type CateringDish = {
  label: string
  name: string
  description: string
  image?: string
  category?: CategorySlug
}

function revealOnMount(delay = 0) {
  return {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
  } as const
}

export default function HomeCatering() {
  const { content, loading } = useHomeSection<{
    eyebrow?: string
    title?: string
    description?: string
    buttonText?: string
    buttonLink?: string
    dishes?: CateringDish[]
  }>('catering')

  const { isHrefEnabled } = useEnabledServices()
  const cateringLink = content?.buttonLink ?? '/catering'
  const showCateringLink = isHrefEnabled(cateringLink)

  const dishes =
    content?.dishes
      ?.map((dish) => ({
        label: String(dish.label ?? ''),
        name: String(dish.name ?? ''),
        description: String(dish.description ?? ''),
        image: dish.image,
        category: (dish.category as CategorySlug) || 'food',
      }))
      .filter((dish) => dish.label.trim() || dish.name.trim() || dish.description.trim()) ?? []

  const hasSectionText = Boolean(
    String(content?.eyebrow ?? '').trim() ||
      String(content?.title ?? '').trim() ||
      String(content?.description ?? '').trim(),
  )

  if (!loading && !hasSectionText && !dishes.length) return null
  if (!showCateringLink && !dishes.length && !hasSectionText) return null

  return (
    <section id="catering" className="bg-cream py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-10 flex flex-col sm:mb-14 lg:flex-row lg:items-end lg:justify-between"
          {...revealOnMount()}
        >
          <div>
            {content?.eyebrow ? (
              <div className="section-label text-burgundy">
                <span className="text-xs sm:text-sm">{content.eyebrow}</span>
              </div>
            ) : null}
            {content?.title ? (
              <h2 className="heading-display text-3xl uppercase text-gray-900 sm:text-4xl lg:text-5xl">
                {content.title}
              </h2>
            ) : null}
            {content?.description ? (
              <p className="mt-4 max-w-xl text-sm text-gray-500 sm:text-base">
                {content.description}
              </p>
            ) : null}
          </div>
          {showCateringLink && content?.buttonText ? (
            <Link to={cateringLink} className="btn-primary mt-6 self-start lg:mt-0">
              {content.buttonText}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          ) : null}
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {dishes.map((dish, i) => (
            <motion.div
              key={`catering-dish-${i}`}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
              {...revealOnMount(0.1 * i)}
            >
              <div className="aspect-[4/3] overflow-hidden bg-cream-warm">
                {dish.image ? (
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <FoodVisual name={dish.name} category={dish.category} />
                )}
              </div>
              <div className="p-5">
                {dish.label ? (
                  <p className="text-xs font-bold uppercase tracking-wider text-yellow-dark">
                    {dish.label}
                  </p>
                ) : null}
                {dish.name ? (
                  <h3 className="mt-1 font-display text-xl font-bold uppercase text-burgundy">
                    {dish.name}
                  </h3>
                ) : null}
                {dish.description ? (
                  <p className="mt-2 text-sm text-gray-500">{dish.description}</p>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
