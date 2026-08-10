import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import type { CategorySlug } from '@/types'
import FoodVisual from '@/components/common/FoodVisual'
import { useHomeSection } from '@/hooks/useHomeSection'

type GallerySlot = {
  url?: string
  caption?: string
  category?: string
}

/** Fixed homepage gallery: 3 columns × 2 rows, alternating tall/short like the design. */
export const GALLERY_SLOT_TALL = [true, false, true, false, true, false] as const
export const GALLERY_COLUMNS = [[0, 3], [1, 4], [2, 5]] as const

const defaultSlots: GallerySlot[] = [
  { url: '/images/foodreference.png', caption: 'Doro Wat', category: 'food' },
  { url: '/images/tela-clean.png', caption: 'House Tela', category: 'drinks' },
  { url: '/images/shiro-clean.png', caption: 'Shiro Wat', category: 'food' },
  { url: '/images/tej-clean.png', caption: 'Classic Tej', category: 'drinks' },
  { url: '/images/senay-tej-cut.png', caption: 'Beyaynetu', category: 'food' },
  { url: '/images/berbere-clean.png', caption: 'Berbere', category: 'products' },
]

function slotClass(tall: boolean) {
  return tall
    ? 'aspect-[3/4] min-h-[280px] sm:min-h-[340px] lg:min-h-[420px]'
    : 'aspect-[4/3] min-h-[180px] sm:min-h-[210px]'
}

export default function HomeGallery() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { content } = useHomeSection<{
    eyebrow?: string
    title?: string
    description?: string
    slots?: GallerySlot[]
  }>('gallery')

  const headings = {
    eyebrow: content?.eyebrow ?? 'Gallery',
    title: content?.title ?? 'A Feast for the Eyes',
    description:
      content?.description ??
      'A glimpse of the dishes, drinks and traditions that fill our table every day.',
  }

  const slots = Array.from({ length: 6 }, (_, index) => {
    const fromCms = content?.slots?.[index]
    const fallback = defaultSlots[index]
    return {
      url: fromCms?.url || fallback?.url || '',
      caption: fromCms?.caption || fallback?.caption || 'Dish',
      category: (fromCms?.category || fallback?.category || 'food') as CategorySlug,
      tall: GALLERY_SLOT_TALL[index],
    }
  })

  return (
    <section className="bg-cream py-16 sm:py-20 lg:py-24" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-10 text-center sm:mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label justify-center text-burgundy">
            <span className="text-xs sm:text-sm">{headings.eyebrow}</span>
          </div>
          <h2 className="heading-display text-3xl uppercase text-gray-900 sm:text-4xl lg:text-5xl">
            {headings.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-500 sm:text-base">
            {headings.description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {GALLERY_COLUMNS.map((columnSlots, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-4 lg:gap-5">
              {columnSlots.map((slotIndex, rowIndex) => {
                const slot = slots[slotIndex]
                return (
                  <motion.div
                    key={slotIndex}
                    initial={{ opacity: 0, y: 24 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: columnIndex * 0.08 + rowIndex * 0.06 }}
                    className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
                  >
                    <div className={slotClass(slot.tall)}>
                      {slot.url ? (
                        <img
                          src={slot.url}
                          alt={slot.caption}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      ) : (
                        <FoodVisual
                          name={slot.caption}
                          category={slot.category}
                          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
