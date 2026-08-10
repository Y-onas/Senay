import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useHomeSection } from '@/hooks/useHomeSection'
import { useLanguage } from '@/hooks/useLanguage'
import { resolveImageSrc } from '@/lib/image-url'

const desktopIngredients = [
  { emoji: '🌶️', left: '5%', top: '14%', delay: 0, size: 'text-3xl' },
  { emoji: '🌾', left: '10%', top: '32%', delay: 0.4, size: 'text-3xl' },
  { emoji: '🍯', left: '4%', top: '52%', delay: 0.8, size: 'text-2xl' },
  { emoji: '🫛', left: '3%', top: '38%', delay: 1.2, size: 'text-3xl' },
  { emoji: '🌶️', left: '92%', top: '16%', delay: 0.2, size: 'text-3xl' },
  { emoji: '🌾', left: '87%', top: '34%', delay: 0.6, size: 'text-3xl' },
  { emoji: '🐝', left: '94%', top: '54%', delay: 1, size: 'text-2xl' },
  { emoji: '🫛', left: '85%', top: '72%', delay: 1.4, size: 'text-2xl' },
]

const mobileIngredients = [
  { emoji: '🌶️', left: '4%', top: '22%', delay: 0, size: 'text-2xl' },
  { emoji: '🌾', left: '0%', top: '32%', delay: 0.35, size: 'text-xl' },
  { emoji: '🌶️', left: '88%', top: '20%', delay: 0.15, size: 'text-2xl' },
  { emoji: '🐝', left: '92%', top: '30%', delay: 0.5, size: 'text-xl' },
]

const defaultProducts = [
  { src: '/images/tela-clean.webp', alt: 'House Tela served from a traditional clay pot' },
  { src: '/images/shiro-clean.webp', alt: 'Shiro pea powder' },
  { src: '/images/senay-tej-cut.webp', alt: 'Classic Tej honey wine' },
  { src: '/images/berbere-clean.webp', alt: 'Berbere red pepper spice blend' },
]

// Three-peak FreshBox wave. Low y = cream peak · high y = valley.
const WAVE_A =
  'M0,50 L220,50 C300,50 370,312 450,315 C530,318 620,76 720,70 C820,74 900,262 1020,266 C1140,270 1300,208 1440,202 L1440,400 L0,400 Z'
const WAVE_B =
  'M0,44 L215,44 C295,44 365,306 450,308 C528,310 612,70 720,64 C828,68 895,256 1020,260 C1135,264 1290,202 1440,196 L1440,400 L0,400 Z'

// Mobile — steeper, horizontally tighter curves (same viewBox, rendered wider via scaleX)
const WAVE_MOBILE_A =
  'M0,38 L160,38 C220,38 290,338 380,340 C470,342 540,48 720,42 C900,46 970,295 1090,298 C1210,301 1330,218 1440,210 L1440,400 L0,400 Z'
const WAVE_MOBILE_B =
  'M0,32 L155,32 C215,32 285,332 375,334 C465,336 535,42 720,36 C905,40 965,288 1085,291 C1205,294 1325,212 1440,204 L1440,400 L0,400 Z'

function FloatingIngredients({
  items,
  className,
}: {
  items: typeof desktopIngredients
  className?: string
}) {
  return (
    <>
      {items.map((ing, i) => (
        <motion.span
          key={`${ing.emoji}-${ing.left}-${i}`}
          className={`pointer-events-none absolute z-[15] opacity-80 ${ing.size} ${className ?? ''}`}
          style={{ left: ing.left, top: ing.top }}
          animate={{ y: [0, -14, 0], x: [0, 6, 0], rotate: [0, 10, -8, 0] }}
          transition={{
            duration: 5 + i * 0.35,
            repeat: Infinity,
            delay: ing.delay,
            ease: 'easeInOut',
          }}
          aria-hidden
        >
          {ing.emoji}
        </motion.span>
      ))}
    </>
  )
}

function WaveSvg({
  className,
  paths,
  compress,
}: {
  className?: string
  paths?: [string, string]
  compress?: boolean
}) {
  const [pathA, pathB] = paths ?? [WAVE_A, WAVE_B]

  return (
    <motion.div
      className={`leading-none ${className ?? ''}`}
      style={compress ? { transform: 'scaleX(1.18)', transformOrigin: 'center bottom' } : undefined}
      animate={{ x: ['0%', compress ? '0.8%' : '1.2%', '0%'] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 1440 400" preserveAspectRatio="none" className="block h-full w-full">
        <motion.path
          className="fill-cream"
          initial={{ d: pathA }}
          animate={{ d: [pathA, pathB, pathA] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </motion.div>
  )
}

function ProductShowcase({
  track,
  active,
  s,
  groupShift,
  move,
  mobile,
  imgClassName,
}: {
  track: { src: string; alt: string; key: number }[]
  active: number
  s: number
  groupShift: number
  move: number
  mobile: boolean
  imgClassName: string
}) {
  return (
    <>
      {track.map((p) => {
        const pos = p.key - active
        const a = Math.abs(pos)

        const opacity = mobile
          ? a < 0.5
            ? 1
            : a < 1.5
              ? 0.95
              : a < 2.5
                ? 0.88
                : 0
          : a < 0.5
            ? 1
            : a < 1.5
              ? 0.9
              : a < 2.5
                ? 0.8
                : 0

        const scale = mobile
          ? a < 0.5
            ? 1.24
            : a < 1.5
              ? 0.82
              : a < 2.5
                ? 0.72
                : 0
          : a < 0.5
            ? 1.22
            : a < 1.5
              ? 0.72
              : 0.64

        const blur = mobile
          ? a < 0.5
            ? 0
            : a < 1.5
              ? 0.35
              : 0.85
          : a < 0.5
            ? 0
            : a < 1.5
              ? 1.1
              : 1.6

        if (opacity === 0) return null

        const isActive = a < 0.5
        const src = resolveImageSrc(p.src, mobile ? 640 : 960)

        return (
          <div
            key={p.key}
            className="absolute inset-x-0 bottom-4 top-0 flex items-end justify-center"
            style={{ zIndex: 100 - Math.round(a * 10) }}
          >
            <motion.img
              src={src}
              alt={p.alt}
              loading={isActive ? 'eager' : 'lazy'}
              fetchPriority={isActive ? 'high' : 'auto'}
              decoding="async"
              draggable={false}
              className={imgClassName}
              initial={false}
              animate={{
                x: pos * s + groupShift,
                scale,
                opacity,
                filter: `blur(${blur}px)`,
              }}
              transition={{
                x: { duration: move, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: move, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.5 },
                filter: { duration: move },
              }}
            />
          </div>
        )
      })}
    </>
  )
}

function Headline({
  className,
  eyebrow,
  headline,
  headlineLine1,
  headlineLine2,
  locale,
}: {
  className?: string
  eyebrow?: string
  headline?: string
  headlineLine1?: string
  headlineLine2?: string
  locale: 'en' | 'am'
}) {
  const eyebrowParts = (eyebrow || '')
    .split('•')
    .map((s) => s.trim())
    .filter(Boolean)

  const lines =
    headlineLine1 || headlineLine2
      ? [headlineLine1, headlineLine2].filter(
          (line): line is string => typeof line === 'string' && line.trim().length > 0,
        )
      : locale === 'am'
        ? (headline || '').split('\n').filter(Boolean)
        : (headline || '')
            .replace(/\s+of\s+/i, '\nof ')
            .split('\n')
            .filter(Boolean)

  return (
    <div className={className}>
      {eyebrowParts.length > 0 ? (
        <motion.p
          className="mb-1.5 text-[11px] font-medium tracking-widest text-white/90 sm:mb-4 sm:text-base"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {eyebrowParts.map((part, i) => (
            <span key={`eyebrow-${i}`}>
              {i > 0 && <span className="mx-2 text-yellow-brand">•</span>}
              <span className="text-white">{part}</span>
            </span>
          ))}
        </motion.p>
      ) : null}

      {lines.length > 0 ? (
        <motion.h1
          className="heading-display mx-auto max-w-4xl text-[1.65rem] uppercase leading-[1.05] text-white sm:text-5xl md:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {lines.map((line, i) => (
            <span key={`headline-${i}`} className="block">
              {line}
            </span>
          ))}
        </motion.h1>
      ) : null}

      <div
        className="mx-auto mt-2 h-px w-16 bg-gradient-to-r from-transparent via-gold-light/45 to-transparent sm:hidden"
        aria-hidden
      />
    </div>
  )
}

export default function HomeHero() {
  const { locale } = useLanguage()
  const [products, setProducts] = useState(defaultProducts)
  const n = products.length
  const [idx, setIdx] = useState(0)
  const [s, setS] = useState(360)
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640,
  )
  const [hero, setHero] = useState({
    eyebrow: '',
    headline: '',
    headlineLine1: undefined as string | undefined,
    headlineLine2: undefined as string | undefined,
  })

  const { content: heroContent } = useHomeSection<{
    eyebrow?: string
    headline?: string
    headlineLine1?: string
    headlineLine2?: string
    subcopy?: string
    slides?: { src: string; alt: string }[]
  }>('hero')

  useEffect(() => {
    if (!heroContent) return
    setHero({
      eyebrow: heroContent.eyebrow || '',
      headline: heroContent.headline || '',
      headlineLine1: heroContent.headlineLine1,
      headlineLine2: heroContent.headlineLine2,
    })
    if (heroContent.slides && heroContent.slides.length > 0) {
      const slidesWithSrc = heroContent.slides.filter((p) => p.src?.trim())
      if (slidesWithSrc.length > 0) {
        setProducts(slidesWithSrc)
      }
    }
  }, [heroContent])

  const track = useMemo(
    () => Array.from({ length: 3 * n }, (_, k) => ({ ...products[k % n], key: k })),
    [products, n],
  )
  const START = n
  const active = START + (idx % n)
  const isReverse = idx > 0 && idx % n === 0
  const move = isReverse ? 0.5 : 0.85

  useEffect(() => {
    const t = setTimeout(() => setIdx((i) => i + 1), 2300)
    return () => clearTimeout(t)
  }, [idx])

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      const isMobile = w < 640
      setMobile(isMobile)
      // Wide spacing on mobile crops side products to ~30–40% visible at edges
      setS(Math.round(Math.min(w * (isMobile ? 0.58 : 0.37), isMobile ? 280 : 520)))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const groupShift = mobile ? 0 : -Math.round(s * 0.04)

  const showcaseProps = {
    track,
    active,
    s,
    groupShift,
    move,
    mobile,
  }

  return (
    <section id="home" className="relative overflow-x-clip bg-burgundy">
      <FloatingIngredients items={desktopIngredients} className="hidden sm:block" />

      {/* ── Mobile: FreshBox scene — headline top, focal product overlaps wave + headline ── */}
      <div className="relative min-h-mobile-hero overflow-hidden sm:hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-[14%] z-[5] h-[28%] bg-[radial-gradient(ellipse_at_center,rgba(231,197,106,0.12)_0%,transparent_70%)]"
          aria-hidden
        />

        <FloatingIngredients items={mobileIngredients} />

        <Headline
          className="relative z-20 px-4 pb-2 pt-[4.75rem] text-center"
          eyebrow={hero.eyebrow}
          headline={hero.headline}
          headlineLine1={hero.headlineLine1}
          headlineLine2={hero.headlineLine2}
          locale={locale}
        />

        {/* Compressed wave — steeper curves, sits behind products */}
        <WaveSvg
          paths={[WAVE_MOBILE_A, WAVE_MOBILE_B]}
          compress
          className="absolute inset-x-[-6%] bottom-[-2px] z-10 h-[26vw] min-h-[6.75rem] max-h-[10rem] w-[112%]"
        />

        {/* Seal sub-pixel gap between wave SVG and Categories cream */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-[11] h-1 bg-cream" aria-hidden />
      </div>

      {/* Mobile products */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 h-[15rem] -translate-y-12 overflow-x-clip sm:hidden">
        <ProductShowcase
          {...showcaseProps}
          imgClassName="h-[11rem] w-auto max-w-[50vw] object-contain object-bottom drop-shadow-[0_24px_28px_rgba(0,0,0,0.5)]"
        />
      </div>

      {/* ── Desktop: full-height hero, products absolute at bottom ── */}
      <div className="relative hidden min-h-screen flex-col sm:flex">
        <Headline
          className="relative z-20 shrink-0 px-4 pb-4 pt-36 text-center lg:pt-40"
          eyebrow={hero.eyebrow}
          headline={hero.headline}
          headlineLine1={hero.headlineLine1}
          headlineLine2={hero.headlineLine2}
          locale={locale}
        />

        <div className="min-h-[12rem] flex-1" aria-hidden />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[340px] overflow-x-clip lg:h-[420px]">
          <ProductShowcase
            {...showcaseProps}
            imgClassName="h-64 w-auto max-w-none object-contain object-bottom drop-shadow-[0_30px_32px_rgba(0,0,0,0.5)] lg:h-80"
          />
        </div>

        <WaveSvg className="absolute bottom-0 left-[-5%] z-10 h-[40vh] max-h-[340px] w-[110%]" />

        {/* Seal sub-pixel gap between wave SVG and Categories cream */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-[11] h-1 bg-cream" aria-hidden />
      </div>
    </section>
  )
}
