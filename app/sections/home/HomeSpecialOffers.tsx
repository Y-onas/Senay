import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { Flame } from 'lucide-react'
import { useEnabledServices } from '@/hooks/useEnabledServices'
import { useHomeSection } from '@/hooks/useHomeSection'

type OfferCard = {
  id: string
  label?: string
  title: string
  subtitle?: string
  image?: string
  link: string
  linkText: string
  variant?: 'yellow' | 'green' | 'burgundy'
  tall?: boolean
}

const variantClass: Record<string, string> = {
  yellow: 'bg-gradient-to-br from-yellow-dark to-orange-brand',
  green: 'bg-green-brand',
  burgundy: 'bg-burgundy',
}


function revealOnMount(delay = 0) {
  return {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
  } as const
}

export default function HomeSpecialOffers() {
  const { content, loading } = useHomeSection<{
    eyebrow?: string
    title?: string
    description?: string
    cards?: OfferCard[]
  }>('offers')

  const { isHrefEnabled } = useEnabledServices()

  const cards = (content?.cards ?? []).filter(
    (card) => card.link && isHrefEnabled(card.link),
  )

  const [left, right, bottom] = [
    cards.find((c) => !c.tall && c.variant === 'yellow') ?? cards[0],
    cards.find((c) => c.tall) ?? cards[1],
    cards.find((c) => !c.tall && c.variant === 'burgundy') ?? cards[2],
  ]

  const hasSectionText = Boolean(
    String(content?.eyebrow ?? '').trim() ||
      String(content?.title ?? '').trim() ||
      String(content?.description ?? '').trim(),
  )

  if (!loading && !hasSectionText && !cards.length) return null

  return (
    <section id="offers" className="bg-cream py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="mb-10 text-center sm:mb-14" {...revealOnMount()}>
          {content?.eyebrow ? (
            <div className="section-label justify-center text-burgundy">
              <span className="text-xs sm:text-sm">{content.eyebrow}</span>
            </div>
          ) : null}
          {content?.title ? (
            <h2 className="heading-display text-3xl uppercase text-gray-900 sm:text-4xl lg:text-5xl">
              {content.title}
            </h2>
          ) : null}
          {content?.description ? (
            <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-500 sm:text-base">
              {content.description}
            </p>
          ) : null}
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {left && <OfferCardView card={left} delay={0.1} />}
          {right && <OfferCardView card={right} delay={0.2} tall />}
          {bottom && <OfferCardView card={bottom} delay={0.3} />}
        </div>
      </div>
    </section>
  )
}

function OfferCardView({
  card,
  delay,
  tall,
}: {
  card: OfferCard
  delay: number
  tall?: boolean
}) {
  const bg = variantClass[card.variant ?? 'yellow'] ?? variantClass.yellow

  return (
    <motion.div
      className={`relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-3xl p-6 sm:min-h-[320px] sm:p-8 ${bg} ${
        tall ? 'min-h-[420px] sm:min-h-[500px] lg:row-span-2 lg:min-h-[640px]' : ''
      }`}
      {...revealOnMount(delay)}
    >
      {card.image && (
        <>
          <img
            src={card.image}
            alt={card.title}
            loading="lazy"
            className="absolute inset-0 z-0 h-full w-full object-cover object-center"
          />
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-green-brand/80 via-transparent to-green-brand/75"
            aria-hidden
          />
        </>
      )}

      <div className="relative z-10">
        {card.label && (
          <span className="text-sm font-medium text-white/90">{card.label}</span>
        )}
        <h3
          className={`heading-display mt-2 uppercase leading-tight text-white ${
            tall ? 'text-2xl sm:text-3xl' : 'max-w-[220px] text-2xl sm:text-3xl'
          }`}
        >
          {card.title}
        </h3>
        {card.subtitle && (
          <p className="mt-1 font-display text-lg uppercase text-white/90 drop-shadow-sm">
            {card.subtitle}
          </p>
        )}
      </div>

      <div className="relative z-10">
        <Link
          to={card.link}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
        >
          {card.linkText}
          <Flame className="h-4 w-4 text-orange-500" />
        </Link>
      </div>
    </motion.div>
  )
}
