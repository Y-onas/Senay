import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, Users } from 'lucide-react'
import type { CateringDeliveryMethod, MealType } from '@/types'
import {
  AGELGIL_SIZES,
  agelgilMenus,
  combineAgelgilPackages,
  coveredGuests,
  formatComboLabel,
  getAgelgilPrices,
  getPackagePrice,
  sumAgelgilTotal,
  type AgelgilPackageKind,
  type AgelgilSize,
} from '@/data/agelgilCatalog'
import PageHero from '@/components/common/PageHero'
import { usePageContent } from '@/hooks/usePageContent'
import { useServiceEnabled } from '@/hooks/useServiceEnabled'
import QuantityStepper from '@/components/common/QuantityStepper'
import { TextField } from '@/components/common/FormField'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function AgelgilPage() {
  const navigate = useNavigate()
  const page = usePageContent('agelgil')
  const { allowed, loading: serviceLoading } = useServiceEnabled('agelgil')
  const [prices, setPrices] = useState(() => getAgelgilPrices())
  const [menus, setMenus] = useState(agelgilMenus)

  useEffect(() => {
    import('@/services/catalogApi').then(({ getAgelgilConfigFromApi }) =>
      getAgelgilConfigFromApi().then((config) => {
        setPrices(config.priceTable)
        setMenus(config.menus)
      }),
    )
  }, [])

  const [mealType, setMealType] = useState<MealType | null>(null)
  const [packageKind, setPackageKind] = useState<AgelgilPackageKind | null>(null)
  const [preferredSize, setPreferredSize] = useState<AgelgilSize | null>(null)
  const [guests, setGuests] = useState(10)
  const [guestsConfirmed, setGuestsConfirmed] = useState(false)
  const [deliveryMethod, setDeliveryMethod] =
    useState<CateringDeliveryMethod | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const kindRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef<HTMLDivElement>(null)
  const guestsRef = useRef<HTMLDivElement>(null)
  const deliveryRef = useRef<HTMLDivElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  const mealDone = !!mealType
  const kindDone = !!packageKind
  const sizeDone = !!preferredSize
  const guestsDone = sizeDone && guestsConfirmed && guests >= 10
  const deliveryDone =
    !!deliveryMethod &&
    !!date &&
    !!time &&
    (deliveryMethod === 'pickup' || location.trim().length > 0)

  const combo = useMemo(() => {
    if (!mealType || !packageKind || guests < 1) return []
    return combineAgelgilPackages(guests, mealType, packageKind, prices)
  }, [guests, mealType, packageKind, prices])

  const grandTotal = sumAgelgilTotal(combo)
  const covered = coveredGuests(combo)

  useEffect(() => {
    if (mealDone) scrollTo(kindRef)
  }, [mealDone])
  useEffect(() => {
    if (kindDone) scrollTo(sizeRef)
  }, [kindDone])
  useEffect(() => {
    if (sizeDone) scrollTo(guestsRef)
  }, [sizeDone])
  useEffect(() => {
    if (guestsDone) scrollTo(deliveryRef)
  }, [guestsDone])
  useEffect(() => {
    if (deliveryDone) scrollTo(summaryRef)
  }, [deliveryDone])

  const selectMeal = (type: MealType) => {
    setMealType(type)
    setPackageKind(null)
    setPreferredSize(null)
    setGuestsConfirmed(false)
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!mealType) next.mealType = 'Select meal type.'
    if (!packageKind) next.packageKind = 'Select Regular or Special.'
    if (!preferredSize) next.size = 'Choose a package size.'
    if (guests < 10) next.guests = 'Minimum 10 people.'
    if (!deliveryMethod) next.delivery = 'Choose pickup or delivery.'
    if (!date) next.date = 'Choose a date.'
    if (!time) next.time = 'Choose a time.'
    if (deliveryMethod === 'delivery' && !location.trim()) {
      next.location = 'Enter a delivery address.'
    }
    if (!name.trim()) next.name = 'Your name is required.'
    if (!phone.trim()) next.phone = 'Phone number is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !mealType || !packageKind || !deliveryMethod) return

    setSubmitting(true)
    try {
      const { submitServiceRequest, toApiDelivery } = await import(
        '@/services/requestService'
      )
      const payload = {
        mealType,
        packageKind,
        preferredSize,
        guests,
        combo,
        coveredGuests: covered,
        grandTotal,
        deliveryMethod,
        date,
        time,
        location:
          deliveryMethod === 'delivery'
            ? location.trim()
            : 'Pickup at Senay Tela',
        contact: { name: name.trim(), phone: phone.trim() },
      }
      const created = await submitServiceRequest({
        serviceSlug: 'agelgil',
        customerName: name.trim(),
        phone: phone.trim(),
        deliveryMethod: toApiDelivery(deliveryMethod),
        location: payload.location,
        preferredDate: date,
        preferredTime: time,
        guests,
        packageSummary: `${mealType} ${packageKind} · ${guests} guests`,
        totalAmount: grandTotal,
        payload,
      })
      navigate('/confirmation', {
        state: {
          kind: 'agelgil',
          request: { reference: created.reference, ...payload },
        },
      })
    } catch (err) {
      setErrors({
        phone: err instanceof Error ? err.message : 'Could not submit request.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (serviceLoading) return null
  if (!allowed) return <Navigate to="/" replace />

  return (
    <>
      <PageHero
        eyebrow={page.eyebrow || 'Agelgil'}
        title={page.title || 'Order your Agelgil set'}
        description={
          page.description ||
          'Fixed package sizes — not per-person pricing. Choose fasting or non-fasting, then we combine packages to match your guest count.'
        }
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Agelgil' }]}
      />

      <section className="bg-cream pb-28 pt-10 sm:py-16 lg:pb-16">
        <form
          onSubmit={handleSubmit}
          className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8"
        >
          <div className="min-w-0 space-y-6">
            {/* 1 — Meal type */}
            <SectionCard
              step={1}
              title="Select Meal Type"
              description="This determines which package contents you see."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <RadioCard
                  active={mealType === 'fasting'}
                  title="Fasting"
                  subtitle="ጾም"
                  description="Vegan Agelgil baskets for fasting days."
                  onClick={() => selectMeal('fasting')}
                />
                <RadioCard
                  active={mealType === 'non-fasting'}
                  title="Non-Fasting"
                  subtitle="ፍስክ"
                  description="Meat and mixed Agelgil baskets."
                  onClick={() => selectMeal('non-fasting')}
                />
              </div>
              {errors.mealType && (
                <p className="mt-2 text-sm text-destructive">{errors.mealType}</p>
              )}
            </SectionCard>

            {/* 2 — Regular / Special */}
            <Reveal show={mealDone} sectionRef={kindRef}>
              <SectionCard
                step={2}
                title="Package Type"
                description="Special adds extra items on top of Regular."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {(['regular', 'special'] as AgelgilPackageKind[]).map((kind) => {
                    const info = mealType ? menus[mealType][kind] : null
                    return (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => {
                          setPackageKind(kind)
                          setPreferredSize(null)
                          setGuestsConfirmed(false)
                        }}
                        className={cn(
                          'rounded-2xl border p-5 text-left transition-all',
                          packageKind === kind
                            ? 'border-[#E8B838] bg-[#2C1A14] text-[#FAF5EE] ring-2 ring-[#E8B838]/40'
                            : 'border-[#2C1A14]/15 bg-[#FAF5EE] hover:border-[#E8B838]/60',
                        )}
                      >
                        <p className="font-display text-lg font-bold uppercase">
                          {kind === 'regular' ? 'Regular' : 'Special'}
                        </p>
                        <p
                          className={cn(
                            'mt-1 text-sm',
                            packageKind === kind
                              ? 'text-[#FAF5EE]/70'
                              : 'text-[#2C1A14]/55',
                          )}
                        >
                          {kind === 'special' && mealType === 'fasting'
                            ? 'Regular + Sambusa + አነባብሮ (Anebabro)'
                            : kind === 'special'
                              ? 'Regular + Kitfo + አይብ (Cheese) + Kocho'
                              : 'Core basket items'}
                        </p>
                        {info && (
                          <ul
                            className={cn(
                              'mt-3 max-h-36 space-y-1 overflow-y-auto border-t pt-3 text-[11px]',
                              packageKind === kind
                                ? 'border-[#FAF5EE]/20'
                                : 'border-[#2C1A14]/10',
                            )}
                          >
                            {info.dishes.map((d) => (
                              <li key={d} className="flex gap-1.5">
                                <Check
                                  className={cn(
                                    'mt-0.5 h-3 w-3 shrink-0',
                                    packageKind === kind
                                      ? 'text-[#E8B838]'
                                      : 'text-[#931F1D]',
                                  )}
                                />
                                {d}
                              </li>
                            ))}
                          </ul>
                        )}
                      </button>
                    )
                  })}
                </div>
              </SectionCard>
            </Reveal>

            {/* 3 — Package size (price reference) */}
            <Reveal show={kindDone} sectionRef={sizeRef}>
              <SectionCard
                step={3}
                title="Package Size"
                description="Each size has a fixed price. We’ll combine sizes if you need more guests."
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {AGELGIL_SIZES.map((size) => {
                    const price =
                      mealType && packageKind
                        ? getPackagePrice(mealType, packageKind, size, prices)
                        : 0
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setPreferredSize(size)
                          setGuests(size)
                          setGuestsConfirmed(false)
                        }}
                        className={cn(
                          'rounded-2xl border p-4 text-center transition-all',
                          preferredSize === size
                            ? 'border-[#E8B838] bg-[#2C1A14] text-[#FAF5EE]'
                            : 'border-[#2C1A14]/15 bg-[#FAF5EE] hover:border-[#E8B838]/50',
                        )}
                      >
                        <p className="font-display text-xl font-bold">{size}</p>
                        <p
                          className={cn(
                            'text-[10px] uppercase tracking-wider',
                            preferredSize === size
                              ? 'text-[#FAF5EE]/55'
                              : 'text-[#2C1A14]/45',
                          )}
                        >
                          people
                        </p>
                        <p
                          className={cn(
                            'mt-2 font-display text-lg font-bold',
                            preferredSize === size
                              ? 'text-[#E8B838]'
                              : 'text-[#931F1D]',
                          )}
                        >
                          {formatPrice(price)}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </SectionCard>
            </Reveal>

            {/* 4 — Guests + auto combo */}
            <Reveal show={sizeDone} sectionRef={guestsRef}>
              <SectionCard
                step={4}
                title="How many people are you serving?"
                description="We’ll build the best package combination automatically."
              >
                <div className="flex flex-wrap items-center gap-3">
                  <QuantityStepper
                    value={guests}
                    min={10}
                    step={5}
                    onChange={(v) => {
                      setGuests(v)
                      setGuestsConfirmed(false)
                    }}
                  />
                  <span className="flex items-center gap-1.5 text-sm text-[#2C1A14]/55">
                    <Users className="h-4 w-4" /> people
                  </span>
                </div>

                {combo.length > 0 && (
                  <div className="mt-5 rounded-2xl border border-[#E8B838]/35 bg-[#2C1A14] p-4 text-[#FAF5EE]">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#E8B838]">
                      Recommended combination
                    </p>
                    <p className="mt-1 font-display text-lg font-bold">
                      {formatComboLabel(combo)}
                    </p>
                    <p className="mt-1 text-xs text-[#FAF5EE]/60">
                      Covers {covered} people ·{' '}
                      {combo.reduce((n, l) => n + l.quantity, 0)} package(s)
                    </p>
                    <ul className="mt-3 space-y-1.5 border-t border-[#FAF5EE]/15 pt-3 text-sm">
                      {combo.map((line) => (
                        <li
                          key={line.size}
                          className="flex justify-between gap-3"
                        >
                          <span>
                            {line.quantity} × {line.size}-person (
                            {formatPrice(line.unitPrice)} each)
                          </span>
                          <span className="font-semibold text-[#E8B838]">
                            {formatPrice(line.lineTotal)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 flex justify-between border-t border-[#FAF5EE]/15 pt-3 font-display text-xl font-bold">
                      <span>Total</span>
                      <span className="text-[#E8B838]">{formatPrice(grandTotal)}</span>
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setGuestsConfirmed(true)}
                  disabled={guests < 10 || !combo.length}
                  className="btn-primary mt-5 justify-center disabled:opacity-50"
                >
                  Continue with this combination
                </button>
              </SectionCard>
            </Reveal>

            {/* 5 — Delivery */}
            <Reveal show={guestsDone} sectionRef={deliveryRef}>
              <SectionCard step={5} title="How would you like to receive your order?">
                <div className="mb-4 flex flex-wrap gap-2">
                  <Chip
                    active={deliveryMethod === 'pickup'}
                    onClick={() => setDeliveryMethod('pickup')}
                  >
                    Pickup
                  </Chip>
                  <Chip
                    active={deliveryMethod === 'delivery'}
                    onClick={() => setDeliveryMethod('delivery')}
                  >
                    Delivery
                  </Chip>
                </div>

                {deliveryMethod && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label={
                        deliveryMethod === 'delivery' ? 'Delivery date' : 'Pickup date'
                      }
                      name="date"
                      type="date"
                      required
                      value={date}
                      error={errors.date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                    <TextField
                      label={
                        deliveryMethod === 'delivery' ? 'Delivery time' : 'Pickup time'
                      }
                      name="time"
                      type="time"
                      required
                      value={time}
                      error={errors.time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                    {deliveryMethod === 'delivery' && (
                      <TextField
                        label="Delivery address"
                        name="location"
                        required
                        value={location}
                        error={errors.location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Address in Addis Ababa"
                        className="sm:col-span-2"
                      />
                    )}
                  </div>
                )}
              </SectionCard>
            </Reveal>

            {/* 6 — Summary */}
            <Reveal show={deliveryDone} sectionRef={summaryRef}>
              <SectionCard step={6} title="Order Summary">
                {mealType && packageKind && deliveryMethod && (
                  <dl className="mb-6 space-y-3 rounded-2xl bg-[#2C1A14]/[0.04] p-5 text-sm">
                    <Row
                      label="Meal Type"
                      value={mealType === 'fasting' ? 'Fasting (ጾም)' : 'Non-Fasting (ፍስክ)'}
                    />
                    <Row
                      label="Package Type"
                      value={packageKind === 'regular' ? 'Regular' : 'Special'}
                    />
                    <Row label="Package Combination" value={formatComboLabel(combo)} />
                    <Row label="Total Guests" value={`${guests} (covers ${covered})`} />
                    {combo.map((line) => (
                      <Row
                        key={line.size}
                        label={`${line.quantity} × ${line.size}-person`}
                        value={formatPrice(line.lineTotal)}
                      />
                    ))}
                    <Row label="Grand Total" value={formatPrice(grandTotal)} highlight />
                    <Row
                      label="Fulfillment"
                      value={deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}
                    />
                    <Row label="Date" value={date} />
                    <Row label="Time" value={time} />
                    {deliveryMethod === 'delivery' && (
                      <Row label="Address" value={location} />
                    )}
                  </dl>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Your name"
                    name="name"
                    required
                    value={name}
                    error={errors.name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <TextField
                    label="Phone number"
                    name="phone"
                    type="tel"
                    required
                    value={phone}
                    error={errors.phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 …"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary mt-6 w-full justify-center disabled:opacity-50 sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Confirming…
                    </>
                  ) : (
                    'Confirm Agelgil Order'
                  )}
                </button>
              </SectionCard>
            </Reveal>
          </div>

          {/* Sticky estimate */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 z-30">
              <div className="rounded-3xl border border-[#E8B838]/35 bg-[#2C1A14] p-6 text-[#FAF5EE] shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#E8B838]">
                  Your estimate
                </p>
                <p className="mt-1 text-sm text-[#FAF5EE]/65">
                  Fixed package prices — not per person
                </p>
                <div className="mt-5 space-y-2 border-b border-[#FAF5EE]/15 pb-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#FAF5EE]/70">Guests</span>
                    <span>{guestsDone ? guests : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#FAF5EE]/70">Combo</span>
                    <span className="max-w-[55%] text-right">
                      {combo.length ? formatComboLabel(combo) : '—'}
                    </span>
                  </div>
                </div>
                <p className="mt-5 font-display text-3xl font-bold text-[#E8B838]">
                  {combo.length ? formatPrice(grandTotal) : '—'}
                </p>
              </div>
            </div>
          </aside>
        </form>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2C1A14]/15 bg-[#2C1A14] p-4 lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#E8B838]">
                Your estimate
              </p>
              <p className="text-xs text-[#FAF5EE]/70">
                {combo.length ? formatComboLabel(combo) : 'Select options to see total'}
              </p>
            </div>
            <p className="font-display text-2xl font-bold text-[#E8B838]">
              {combo.length ? formatPrice(grandTotal) : '—'}
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

function scrollTo(ref: React.RefObject<HTMLDivElement | null>) {
  requestAnimationFrame(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function Reveal({
  show,
  sectionRef,
  children,
}: {
  show: boolean
  sectionRef: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="scroll-mt-28"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SectionCard({
  step,
  title,
  description,
  children,
}: {
  step: number
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-3xl border border-[#2C1A14]/10 bg-[#FAF5EE] p-6 shadow-sm sm:p-8">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8B838] text-sm font-bold text-[#2C1A14]">
          {step}
        </span>
        <div>
          <h2 className="font-display text-xl font-bold uppercase leading-tight text-[#2C1A14]">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-[#2C1A14]/60">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

function RadioCard({
  active,
  title,
  subtitle,
  description,
  onClick,
}: {
  active: boolean
  title: string
  subtitle: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-5 text-left transition-all',
        active
          ? 'border-[#E8B838] bg-[#2C1A14] text-[#FAF5EE] ring-2 ring-[#E8B838]/40'
          : 'border-[#2C1A14]/15 bg-[#FAF5EE] hover:border-[#E8B838]/50',
      )}
    >
      <p className="font-display text-lg font-bold uppercase">{title}</p>
      <p className={cn('text-sm font-medium', active ? 'text-[#E8B838]' : 'text-[#931F1D]')}>
        {subtitle}
      </p>
      <p className={cn('mt-2 text-sm', active ? 'text-[#FAF5EE]/70' : 'text-[#2C1A14]/55')}>
        {description}
      </p>
    </button>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-[#2C1A14] bg-[#2C1A14] text-[#FAF5EE]'
          : 'border-[#2C1A14]/20 bg-white text-[#2C1A14]/70 hover:border-[#E8B838]',
      )}
    >
      {children}
    </button>
  )
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[#2C1A14]/55">{label}</dt>
      <dd
        className={cn(
          'text-right font-medium text-[#2C1A14]',
          highlight && 'font-display text-base font-bold text-[#931F1D]',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
