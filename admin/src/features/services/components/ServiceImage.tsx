import {
  ChefHat,
  Package,
  PartyPopper,
  ShoppingBag,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ServiceTheme = {
  icon: LucideIcon
  gradient: string
  glow: string
}

const SERVICE_THEMES: Record<string, ServiceTheme> = {
  baltina: {
    icon: ShoppingBag,
    gradient: 'from-yellow-brand/25 via-gold/15 to-beige',
    glow: 'text-yellow-dark',
  },
  drinks: {
    icon: Wine,
    gradient: 'from-green-brand/25 via-green-brand/10 to-beige',
    glow: 'text-green-brand',
  },
  'traditional-drinks': {
    icon: Wine,
    gradient: 'from-green-brand/25 via-green-brand/10 to-beige',
    glow: 'text-green-brand',
  },
  festival: {
    icon: PartyPopper,
    gradient: 'from-crimson/25 via-crimson/10 to-beige',
    glow: 'text-crimson',
  },
  'festival-package': {
    icon: PartyPopper,
    gradient: 'from-crimson/25 via-crimson/10 to-beige',
    glow: 'text-crimson',
  },
  agelgil: {
    icon: UtensilsCrossed,
    gradient: 'from-burgundy/25 via-burgundy/10 to-beige',
    glow: 'text-burgundy',
  },
  catering: {
    icon: ChefHat,
    gradient: 'from-gold/30 via-yellow-brand/12 to-beige',
    glow: 'text-yellow-dark',
  },
}

const DEFAULT_THEME: ServiceTheme = {
  icon: Package,
  gradient: 'from-beige via-cream-warm to-beige',
  glow: 'text-brown-muted',
}

function getTheme(slug?: string | null) {
  if (!slug) return DEFAULT_THEME
  return SERVICE_THEMES[slug] ?? DEFAULT_THEME
}

export function ServiceImage({
  slug,
  image,
  name,
  className,
  iconClassName,
}: {
  slug?: string | null
  image?: string | null
  name?: string | null
  className?: string
  iconClassName?: string
}) {
  const theme = getTheme(slug)
  const Icon = theme.icon

  if (image) {
    return (
      <div className={cn('relative overflow-hidden bg-beige', className)}>
        <img
          src={image}
          alt={name ?? slug ?? 'Service'}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-burgundy/25 to-transparent" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-gradient-to-br',
        theme.gradient,
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.5), transparent 45%)',
        }}
      />
      <Icon className={cn('relative h-10 w-10', theme.glow, iconClassName)} strokeWidth={1.5} />
    </div>
  )
}
