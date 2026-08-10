import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useLocation } from 'react-router'
import { isTelegramWebApp } from '@/lib/telegramWebApp'

interface Crumb {
  label: string
  to?: string
}

interface PageHeroProps {
  eyebrow?: string
  title: string
  description?: string
  crumbs?: Crumb[]
}

/** Compact branded header used at the top of every inner page. */
export default function PageHero({
  eyebrow,
  title,
  description,
  crumbs = [],
}: PageHeroProps) {
  const { search } = useLocation()
  const telegram = isTelegramWebApp(search)

  return (
    <section className={`relative overflow-hidden bg-burgundy ${telegram ? 'pb-8 pt-10 sm:pb-10 sm:pt-12' : 'pb-16 pt-28 sm:pb-20 sm:pt-32'}`}>
      {/* Decorative rings */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.12]">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-2 border-white" />
        <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full border border-white" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {!telegram && crumbs.length > 0 && (
          <nav className="mb-5 flex items-center gap-1.5 text-sm text-white/60">
            {crumbs.map((c, i) => (
              <span key={c.to || c.label || `crumb-${i}`} className="flex items-center gap-1.5">
                {c.to ? (
                  <Link to={c.to} className="transition-colors hover:text-white">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-white/90">{c.label}</span>
                )}
                {i < crumbs.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
              </span>
            ))}
          </nav>
        )}

        {eyebrow && (
          <div className="section-label section-label-light text-white/90">
            <span className="text-xs sm:text-sm">{eyebrow}</span>
          </div>
        )}

        <motion.h1
          className="heading-display max-w-3xl text-4xl uppercase leading-[1.05] text-white sm:text-5xl lg:text-6xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {title}
        </motion.h1>

        {description && (
          <motion.p
            className="mt-4 max-w-2xl text-base text-white/70"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {description}
          </motion.p>
        )}
      </div>
    </section>
  )
}
