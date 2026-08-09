import { Coffee, Flame, UtensilsCrossed, Wheat } from 'lucide-react'
import type { CategorySlug } from '@/types'
import { cn } from '@/lib/utils'

interface FoodVisualProps {
  /** When provided, a real image is rendered. Otherwise a branded placeholder. */
  image?: string
  name: string
  category?: CategorySlug | string
  className?: string
  imgClassName?: string
}

const categoryStyles: Record<
  CategorySlug,
  { gradient: string; Icon: typeof Coffee }
> = {
  food: {
    gradient: 'from-burgundy via-burgundy-light to-yellow-brand',
    Icon: UtensilsCrossed,
  },
  drinks: {
    gradient: 'from-yellow-brand via-gold-light to-burgundy-dark',
    Icon: Coffee,
  },
  products: {
    gradient: 'from-green-brand via-burgundy to-burgundy-dark',
    Icon: Wheat,
  },
}

function resolveCategory(category?: string): CategorySlug {
  if (category === 'food' || category === 'drinks' || category === 'products') {
    return category
  }
  const value = category?.toLowerCase() ?? ''
  if (value.includes('drink') || value.includes('beverage') || value.includes('tela') || value.includes('tej')) {
    return 'drinks'
  }
  if (value.includes('product') || value.includes('shop') || value.includes('spice')) {
    return 'products'
  }
  return 'food'
}

/**
 * Renders an item's photo when available, otherwise a premium brand-styled
 * placeholder. This keeps the UI cohesive with zero broken images and lets the
 * owner drop in real photos later by simply filling each item's `image` field.
 */
export default function FoodVisual({
  image,
  name,
  category = 'food',
  className,
  imgClassName,
}: FoodVisualProps) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        loading="lazy"
        className={cn('h-full w-full object-cover', imgClassName, className)}
      />
    )
  }

  const { gradient, Icon } = categoryStyles[resolveCategory(category)]

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br',
        gradient,
        className,
      )}
      role="img"
      aria-label={name}
    >
      {/* Decorative concentric rings echoing a clay-pot / mesob motif */}
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full border-2 border-white/40" />
        <div className="absolute -bottom-12 -left-8 h-52 w-52 rounded-full border border-white/30" />
        <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
      </div>
      <div className="relative flex flex-col items-center gap-3 px-4 text-center">
        <Icon className="h-10 w-10 text-white/90" strokeWidth={1.5} />
        <span className="font-display text-lg font-bold uppercase leading-tight tracking-wide text-white drop-shadow-sm">
          {name}
        </span>
        <Flame className="h-4 w-4 text-white/50" />
      </div>
    </div>
  )
}
