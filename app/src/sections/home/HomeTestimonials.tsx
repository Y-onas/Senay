import { AnimatePresence, motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Quote, Star, User } from 'lucide-react'
import type { CategorySlug } from '@/types'
import FoodVisual from '@/components/common/FoodVisual'
import { TextAreaField, TextField } from '@/components/common/FormField'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useHomeSection } from '@/hooks/useHomeSection'
import { useLanguage } from '@/hooks/useLanguage'
import {
  getTestimonials,
  submitTestimonial,
  type TestimonialItem,
} from '@/services/contentService'

const fallback: {
  quote: string
  name: string
  role: string
  dish: string
  category: CategorySlug
  rating: number
  imageUrl?: string | null
}[] = [
  {
    quote:
      'The doro wat tastes exactly like my grandmother used to make. And the tela — I have never had better outside a wedding.',
    name: 'Hiwot G.',
    role: 'Regular Guest',
    dish: 'Doro Wat',
    category: 'food',
    rating: 5,
  },
  {
    quote:
      'They catered our wedding for 200 people. The coffee ceremony brought everyone together. Flawless from start to finish.',
    name: 'Daniel & Sara',
    role: 'Wedding Clients',
    dish: 'Tej',
    category: 'drinks',
    rating: 5,
  },
  {
    quote:
      'I order their shiro and berbere every month. Restaurant-quality flavour at home, delivered on time, every time.',
    name: 'Marcus T.',
    role: 'Shop Customer',
    dish: 'Berbere',
    category: 'products',
    rating: 4,
  },
]

const emptyForm = {
  name: '',
  role: '',
  dish: '',
  quote: '',
  rating: 5,
}

export default function HomeTestimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [testimonials, setTestimonials] = useState(fallback)
  const { content } = useHomeSection<{ eyebrow?: string; title?: string }>('testimonials')
  const { t } = useLanguage()
  const headings = {
    eyebrow: content?.eyebrow ?? 'Testimonials',
    title: content?.title ?? 'What Our Guests Say',
  }

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    getTestimonials().then((items) => {
      if (items.length) {
        setTestimonials(
          items.map((tItem: TestimonialItem) => ({
            quote: tItem.quote,
            name: tItem.name,
            role: tItem.role ?? '',
            dish: tItem.dish ?? 'Doro Wat',
            category: (tItem.dishCategory as CategorySlug) || 'food',
            rating: tItem.rating ?? 5,
            imageUrl: tItem.imageUrl,
          })),
        )
      }
    })
  }, [])

  const next = () => setCurrentIndex((p) => (p + 1) % testimonials.length)
  const prev = () => setCurrentIndex((p) => (p - 1 + testimonials.length) % testimonials.length)
  const current = testimonials[currentIndex]

  const openForm = () => {
    setForm(emptyForm)
    setErrors({})
    setSent(false)
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = t('shareErrorName')
    if (form.quote.trim().length < 10) nextErrors.quote = t('shareErrorQuote')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      await submitTestimonial({
        name: form.name.trim(),
        quote: form.quote.trim(),
        role: form.role.trim() || undefined,
        dish: form.dish.trim() || undefined,
        rating: form.rating,
      })
      setSent(true)
      setForm(emptyForm)
    } catch (err) {
      setErrors({
        quote: err instanceof Error ? err.message : t('shareErrorSendFailed'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-burgundy py-16 sm:py-20 lg:py-24" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-10 flex flex-col sm:mb-14 sm:flex-row sm:items-end sm:justify-between"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <div className="section-label section-label-light text-white/90">
              <span className="text-xs sm:text-sm">{headings.eyebrow}</span>
            </div>
            <h2 className="heading-display text-3xl uppercase text-white sm:text-4xl lg:text-5xl">
              {headings.title}
            </h2>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-0 sm:justify-end">
            <button
              type="button"
              onClick={openForm}
              className="rounded-full border border-yellow-brand/40 bg-yellow-brand px-4 py-2.5 text-sm font-semibold text-burgundy transition-colors hover:bg-yellow-brand/90"
            >
              {t('shareExperience')}
            </button>
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 sm:h-12 sm:w-12"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 sm:h-12 sm:w-12"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="grid grid-cols-1 items-center gap-6 lg:grid-cols-5 lg:gap-10"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex justify-center lg:col-span-2">
              <div className="relative">
                <div className="flex h-56 w-48 items-center justify-center overflow-hidden rounded-3xl bg-orange-brand sm:h-72 sm:w-64">
                  {current.imageUrl ? (
                    <img
                      src={current.imageUrl}
                      alt={current.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-20 w-20 text-white/80" strokeWidth={1.2} />
                  )}
                </div>
                <div className="absolute -bottom-4 -right-4 h-20 w-20 overflow-hidden rounded-2xl border-4 border-burgundy shadow-xl sm:-right-8 sm:h-28 sm:w-24">
                  <FoodVisual name={current.dish} category={current.category} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="mb-4 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < (current.rating ?? 5)
                        ? 'fill-yellow-brand text-yellow-brand'
                        : 'text-white/25'
                    }`}
                  />
                ))}
              </div>
              <Quote className="mb-4 h-10 w-10 fill-yellow-brand text-yellow-brand sm:h-12 sm:w-12" />
              <p className="text-base leading-relaxed text-white/90 sm:text-lg lg:text-xl">
                “{current.quote}”
              </p>
              <div className="mt-6">
                <p className="font-display text-lg font-bold text-white">{current.name}</p>
                <p className="text-sm text-white/60">{current.role}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-burgundy/10 bg-cream sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl uppercase text-burgundy">
              {t('shareExperienceTitle')}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {t('shareExperienceHint')}
            </DialogDescription>
          </DialogHeader>

          {sent ? (
            <div className="flex flex-col items-center rounded-2xl bg-green-brand/10 p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-brand" />
              <p className="mt-4 font-display text-xl font-bold uppercase text-gray-900">
                {t('shareThanksTitle')}
              </p>
              <p className="mt-2 text-sm text-gray-500">{t('shareThanksBody')}</p>
              <button type="button" onClick={() => setOpen(false)} className="btn-primary mt-6">
                {t('shareClose')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <TextField
                label={t('shareName')}
                name="share-name"
                required
                value={form.name}
                error={errors.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <TextField
                label={t('shareRole')}
                name="share-role"
                value={form.role}
                placeholder={t('shareRolePlaceholder')}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
              <TextField
                label={t('shareDish')}
                name="share-dish"
                value={form.dish}
                onChange={(e) => setForm({ ...form, dish: e.target.value })}
              />
              <div>
                <p className="mb-1.5 text-sm font-medium text-gray-700">{t('shareRating')}</p>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const value = i + 1
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${value} stars`}
                        onClick={() => setForm({ ...form, rating: value })}
                        className="rounded p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            value <= form.rating
                              ? 'fill-yellow-brand text-yellow-brand'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
              <TextAreaField
                label={t('shareQuote')}
                name="share-quote"
                required
                rows={4}
                value={form.quote}
                error={errors.quote}
                placeholder={t('shareQuotePlaceholder')}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
              />
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('shareSubmitting')}
                  </>
                ) : (
                  t('shareSubmit')
                )}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
