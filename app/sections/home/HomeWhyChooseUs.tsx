import { motion } from 'framer-motion'
import { Coffee, Flame, HandHeart, Leaf } from 'lucide-react'
import { useHomeSection } from '@/hooks/useHomeSection'

const iconByIndex = [Flame, Coffee, HandHeart, Leaf]

function revealOnMount(delay = 0) {
  return {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
  } as const
}

export default function HomeWhyChooseUs() {
  const { content, loading } = useHomeSection<{
    eyebrow?: string
    title?: string
    description?: string
    features?: Array<{ title: string; description: string; icon?: string }>
  }>('whyChooseUs')

  const features =
    content?.features
      ?.map((feature, index) => ({
        icon: iconByIndex[index] ?? Flame,
        title: typeof feature.title === 'string' ? feature.title : String(feature.title ?? ''),
        description:
          typeof feature.description === 'string'
            ? feature.description
            : String(feature.description ?? ''),
      }))
      .filter((feature) => feature.title.trim() || feature.description.trim()) ?? []

  const hasSectionText = Boolean(
    String(content?.eyebrow ?? '').trim() ||
      String(content?.title ?? '').trim() ||
      String(content?.description ?? '').trim(),
  )

  if (!loading && !hasSectionText && !features.length) return null

  return (
    <section className="bg-burgundy py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="mb-10 text-center sm:mb-14" {...revealOnMount()}>
          {content?.eyebrow ? (
            <div className="section-label section-label-light justify-center text-white/90">
              <span className="text-xs sm:text-sm">{content.eyebrow}</span>
            </div>
          ) : null}
          {content?.title ? (
            <h2 className="heading-display text-3xl uppercase text-white sm:text-4xl lg:text-5xl">
              {content.title}
            </h2>
          ) : null}
          {content?.description ? (
            <p className="mx-auto mt-4 max-w-2xl text-sm text-white/70 sm:text-base">
              {content.description}
            </p>
          ) : null}
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={`why-feature-${i}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              {...revealOnMount(0.1 * i)}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-brand/20 text-yellow-brand">
                <feature.icon className="h-6 w-6" />
              </div>
              {feature.title ? (
                <h3 className="font-display text-lg font-bold uppercase text-white">
                  {feature.title}
                </h3>
              ) : null}
              {feature.description ? (
                <p className="mt-2 text-sm text-white/70">{feature.description}</p>
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
