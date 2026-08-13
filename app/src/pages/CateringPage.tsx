import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, Users } from 'lucide-react'
import type {
  CateringBeverageOption,
  CateringDeliveryMethod,
  CateringRequestDraft,
  MealType,
} from '@/types'
import { submitCateringRequest } from '@/services'
import {
  beverageOptions as defaultBeverageOptions,
  CATERING_MIN_GUESTS,
  cateringOccasions as defaultCateringOccasions,
  fastingPackage,
  getPricePerGuest,
  nonFastingPackages,
  type CateringCatalogPackage,
} from '@/data/cateringCatalog'
import {
  getCateringBeveragesFromApi,
  getCateringOccasionsFromApi,
  getCateringPackagesFromApi,
  type CateringBeverageOptionItem,
  type CateringOccasionOption,
} from '@/services/catalogApi'
import { usePageContent } from '@/hooks/usePageContent'
import { useLanguage } from '@/hooks/useLanguage'
import { useServiceEnabled } from '@/hooks/useServiceEnabled'
import PageHero from '@/components/common/PageHero'
import QuantityStepper from '@/components/common/QuantityStepper'
import { TextField, TextAreaField } from '@/components/common/FormField'
import { PickupLocationPicker } from '@/components/common/PickupLocationPicker'
import { formatFulfillmentLabel } from '@/lib/fulfillment'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { withTelegramSearch } from '@/lib/telegramWebApp'
import { useAddisNow } from '@/hooks/useAddisNow'
import { useFormCopy, fillCopy } from '@/hooks/useFormCopy'
import {
  addisDateError,
  addisDateInputMin,
  addisTimeError,
  addisTimeInputMin,
} from '@/lib/addisTime'

const CATERING_CHIP_KEYS = [
  'chipNoSalt',
  'chipLessSpicy',
  'chipNoBerbere',
  'chipExtraVegan',
  'chipMildForKids',
  'chipNoButter',
  'chipSeparatePlates',
] as const

export default function CateringPage() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const { locale } = useLanguage()
  const copy = useFormCopy('catering')
  const instructionChips = CATERING_CHIP_KEYS.map((key) => copy[key])
  const addisNow = useAddisNow()
  const page = usePageContent('catering')
  const { allowed, loading: serviceLoading } = useServiceEnabled('catering')
  const [catalog, setCatalog] = useState<CateringCatalogPackage[]>([
    fastingPackage,
    ...nonFastingPackages,
  ])
  const [occasions, setOccasions] = useState<CateringOccasionOption[]>(
    defaultCateringOccasions.map((o) => ({
      value: o.value,
      label: o.label,
      emoji: o.emoji,
    })),
  )
  const [beverages, setBeverages] = useState<CateringBeverageOptionItem[]>(
    defaultBeverageOptions.map((o) => ({ value: o.value, label: o.label })),
  )

  useEffect(() => {
    getCateringPackagesFromApi().then(setCatalog)
  }, [])

  useEffect(() => {
    getCateringOccasionsFromApi().then(setOccasions)
    getCateringBeveragesFromApi().then(setBeverages)
  }, [locale])

  const getOccasionLabel = (value: string, customOccasion?: string) => {
    if (value === 'other' && customOccasion?.trim()) return customOccasion.trim()
    return occasions.find((o) => o.value === value)?.label ?? value
  }

  const getBeverageLabel = (value: string) =>
    beverages.find((b) => b.value === value)?.label ?? value

  const getPackageById = (id: string) => catalog.find((p) => p.id === id)
  const fastingPkgs = catalog.filter((p) => p.mealType === 'fasting')
  const nonFastingPkgs = catalog.filter((p) => p.mealType === 'non-fasting')
  const defaultFasting = fastingPkgs[0]

  const [guests, setGuests] = useState(CATERING_MIN_GUESTS)
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const [eventType, setEventType] = useState<string | null>(null)
  const [customOccasion, setCustomOccasion] = useState('')
  const [mealType, setMealType] = useState<MealType | null>(null)
  const [packageId, setPackageId] = useState<string | null>(null)
  const [beverageOption, setBeverageOption] =
    useState<CateringBeverageOption>('food-only')
  const [deliveryMethod, setDeliveryMethod] =
    useState<CateringDeliveryMethod | null>(null)
  const [pickupLocationId, setPickupLocationId] = useState<string | null>(null)
  const [pickupLocationLabel, setPickupLocationLabel] = useState('')
  const [time, setTime] = useState('')
  const [instructions, setInstructions] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const occasionRef = useRef<HTMLDivElement>(null)
  const mealRef = useRef<HTMLDivElement>(null)
  const packageRef = useRef<HTMLDivElement>(null)
  const beverageRef = useRef<HTMLDivElement>(null)
  const deliveryRef = useRef<HTMLDivElement>(null)
  const requestsRef = useRef<HTMLDivElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  const selectedPackage = packageId ? getPackageById(packageId) : undefined

  const pricePerGuest = useMemo(() => {
    if (!selectedPackage) return 0
    return getPricePerGuest(selectedPackage, beverageOption)
  }, [selectedPackage, beverageOption])

  const totalPrice = pricePerGuest * guests

  const essentialsDone =
    guests >= CATERING_MIN_GUESTS &&
    !!date &&
    location.trim().length > 0 &&
    name.trim().length > 0 &&
    phone.trim().length > 0

  const occasionDone =
    !!eventType && (eventType !== 'other' || customOccasion.trim().length > 0)
  const mealDone = !!mealType
  const packageDone = !!packageId
  const beverageDone = packageDone && !!beverageOption
  const deliveryDone =
    !!deliveryMethod &&
    !!time &&
    (deliveryMethod === 'delivery' || !!pickupLocationId)
  const showSummary = deliveryDone

  useEffect(() => {
    if (essentialsDone) scrollToSection(occasionRef)
  }, [essentialsDone])

  useEffect(() => {
    if (occasionDone) scrollToSection(mealRef)
  }, [occasionDone])

  useEffect(() => {
    if (mealDone) scrollToSection(packageRef)
  }, [mealDone])

  useEffect(() => {
    if (packageDone) scrollToSection(beverageRef)
  }, [packageDone])

  useEffect(() => {
    if (beverageDone) scrollToSection(deliveryRef)
  }, [beverageDone])

  useEffect(() => {
    if (deliveryDone) scrollToSection(requestsRef)
  }, [deliveryDone])

  const selectMealType = (type: MealType) => {
    setMealType(type)
    setBeverageOption('food-only')
    if (type === 'fasting' && defaultFasting) setPackageId(defaultFasting.id)
    else setPackageId(null)
  }

  const toggleInstruction = (chip: string) => {
    setInstructions((prev) => {
      const lower = prev.toLowerCase()
      const chipLower = chip.toLowerCase()
      if (lower.includes(chipLower)) {
        return prev
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.toLowerCase() !== chipLower)
          .join(', ')
      }
      return prev ? `${prev}, ${chip}` : chip
    })
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (guests < CATERING_MIN_GUESTS) {
      next.guests = fillCopy(copy.errorMinGuests, { count: CATERING_MIN_GUESTS })
    }
    if (!date) next.date = copy.errorDate
    else {
      const dateErr = addisDateError(date, addisNow)
      if (dateErr) next.date = dateErr
    }
    if (!location.trim()) next.location = copy.errorLocation
    if (!name.trim()) next.name = copy.errorName
    if (!phone.trim()) next.phone = copy.errorPhone
    if (!eventType) next.eventType = copy.errorOccasion
    if (eventType === 'other' && !customOccasion.trim()) {
      next.customOccasion = copy.errorCustomOccasion
    }
    if (!mealType) next.mealType = copy.errorMealType
    if (!packageId) next.packageId = copy.errorPackage
    if (!beverageOption) next.beverage = copy.errorBeverage
    if (!deliveryMethod) next.deliveryMethod = copy.errorDeliveryMethod
    if (deliveryMethod === 'pickup' && !pickupLocationId) {
      next.pickupLocation = copy.errorPickupLocation
    }
    if (!time) next.time = copy.errorTime
    else {
      const timeErr = addisTimeError(date, time, addisNow)
      if (timeErr) next.time = timeErr
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !eventType || !mealType || !packageId || !deliveryMethod) {
      return
    }

    const draft: CateringRequestDraft = {
      guests,
      eventType,
      customOccasion: eventType === 'other' ? customOccasion.trim() : undefined,
      mealType,
      packageId,
      beverageOption,
      pricePerGuest,
      totalPrice,
      deliveryMethod,
      date,
      time,
      location: location.trim(),
      pickupLocationId: deliveryMethod === 'pickup' ? pickupLocationId ?? undefined : undefined,
      pickupLocation: deliveryMethod === 'pickup' ? pickupLocationLabel || undefined : undefined,
      contact: { name: name.trim(), phone: phone.trim() },
      specialInstructions: instructions.trim() || undefined,
    }

    setSubmitting(true)
    try {
      const request = await submitCateringRequest(draft)
      navigate(withTelegramSearch('/confirmation', search), { state: { kind: 'catering', request } })
    } finally {
      setSubmitting(false)
    }
  }

  if (serviceLoading) return null
  if (!allowed) return <Navigate to="/" replace />

  return (
    <>
      <PageHero
        eyebrow={page.eyebrow || 'Catering'}
        title={page.title || 'Book your celebration feast'}
        description={
          page.description ||
          'Start with the essentials — each next step appears as you complete the one before.'
        }
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Catering' }]}
      />

      <section className="bg-cream pb-28 pt-10 sm:py-16 lg:pb-16">
        <form
          onSubmit={handleSubmit}
          className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8"
        >
          <div className="min-w-0 space-y-6">
            {/* 1 — Essentials (guests + date + place + name + phone) */}
            <SectionCard
              step={1}
              title={copy.essentialsTitle}
              description={copy.essentialsDescription}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {copy.guestsLabel}<span className="ml-0.5 text-burgundy">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <QuantityStepper
                      value={guests}
                      min={CATERING_MIN_GUESTS}
                      step={1}
                      onChange={setGuests}
                    />
                    <span className="flex items-center gap-1 text-sm text-gray-400">
                      <Users className="h-4 w-4" /> {copy.peopleSuffix}
                    </span>
                  </div>
                  {guests < CATERING_MIN_GUESTS && (
                    <p className="mt-1 text-xs text-destructive">
                      {fillCopy(copy.guestsMinHint, { count: CATERING_MIN_GUESTS })}
                    </p>
                  )}
                </div>

                <TextField
                  label={copy.eventDate}
                  name="date"
                  type="date"
                  required
                  min={addisDateInputMin(addisNow)}
                  value={date}
                  error={errors.date}
                  onChange={(e) => {
                    const nextDate = e.target.value
                    setDate(nextDate)
                    if (time && addisTimeError(nextDate, time, addisNow)) setTime('')
                  }}
                />

                <TextField
                  label={copy.eventLocation}
                  name="location"
                  required
                  value={location}
                  error={errors.location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={copy.eventLocationPlaceholder}
                  className="sm:col-span-2"
                />

                <TextField
                  label={copy.yourName}
                  name="name"
                  required
                  value={name}
                  error={errors.name}
                  onChange={(e) => setName(e.target.value)}
                />

                <TextField
                  label={copy.phoneNumber}
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  error={errors.phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 …"
                />
              </div>

              {!essentialsDone && (
                <p className="mt-4 text-sm text-gray-500">
                  {copy.essentialsHint}
                </p>
              )}
            </SectionCard>

            {/* 2 — Occasion (pops in) */}
            <Reveal show={essentialsDone} sectionRef={occasionRef}>
              <SectionCard step={2} title={copy.occasionTitle}>
                <div className="flex flex-wrap gap-2">
                  {occasions.map((o) => (
                    <ChoiceChip
                      key={o.value}
                      active={eventType === o.value}
                      onClick={() => setEventType(o.value)}
                    >
                      <span className="mr-1">{o.emoji}</span>
                      {o.label}
                    </ChoiceChip>
                  ))}
                </div>
                {eventType === 'other' && (
                  <TextField
                    className="mt-4"
                    label={copy.customOccasionLabel}
                    name="customOccasion"
                    value={customOccasion}
                    onChange={(e) => setCustomOccasion(e.target.value)}
                    placeholder={copy.customOccasionPlaceholder}
                    error={errors.customOccasion}
                  />
                )}
              </SectionCard>
            </Reveal>

            {/* 3 — Meal type */}
            <Reveal show={occasionDone} sectionRef={mealRef}>
              <SectionCard
                step={3}
                title={copy.mealTypeTitle}
                description={copy.mealTypeDescription}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <RadioCard
                    active={mealType === 'fasting'}
                    title={copy.fastingTitle}
                    subtitle={copy.fastingSubtitle}
                    description={copy.fastingDescription}
                    onClick={() => selectMealType('fasting')}
                  />
                  <RadioCard
                    active={mealType === 'non-fasting'}
                    title={copy.nonFastingTitle}
                    subtitle={copy.nonFastingSubtitle}
                    description={copy.nonFastingDescription}
                    onClick={() => selectMealType('non-fasting')}
                  />
                </div>
              </SectionCard>
            </Reveal>

            {/* 4 — Package */}
            <Reveal show={mealDone} sectionRef={packageRef}>
              <SectionCard
                step={4}
                title={
                  mealType === 'fasting'
                    ? copy.packageTitleFasting
                    : copy.packageTitleNonFasting
                }
                description={copy.packageDescription}
              >
                {mealType === 'fasting' && defaultFasting && (
                  <div className="mx-auto w-full max-w-md sm:max-w-sm">
                    <PackageCard
                      copy={copy}
                      pkg={defaultFasting}
                      active
                      featured
                      onSelect={() => setPackageId(defaultFasting.id)}
                    />
                  </div>
                )}
                {mealType === 'non-fasting' && (
                  <div className="flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    {nonFastingPkgs.map((pkg) => (
                      <PackageCard
                        copy={copy}
                        key={pkg.id}
                        pkg={pkg}
                        active={packageId === pkg.id}
                        featured={pkg.tier === 'platinum'}
                        onSelect={() => setPackageId(pkg.id)}
                      />
                    ))}
                  </div>
                )}
              </SectionCard>
            </Reveal>

            {/* 5 — Beverages */}
            <Reveal show={packageDone} sectionRef={beverageRef}>
              <SectionCard
                step={5}
                title={copy.beveragesTitle}
                description={copy.beveragesDescription}
              >
                <div className="space-y-2">
                  {beverages.map((opt) => {
                    const pp = selectedPackage
                      ? getPricePerGuest(selectedPackage, opt.value as CateringBeverageOption)
                      : 0
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setBeverageOption(opt.value as CateringBeverageOption)
                        }
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all',
                          beverageOption === opt.value
                            ? 'border-burgundy bg-burgundy/[0.06] ring-2 ring-burgundy/20'
                            : 'border-burgundy/15 hover:border-burgundy/40',
                        )}
                      >
                        <span className="font-medium text-gray-900">{opt.label}</span>
                        <span className="shrink-0 font-display text-lg font-bold text-burgundy">
                          {formatPrice(pp)}
                          <span className="ml-1 text-xs font-normal text-gray-400">
                            {copy.perPerson}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </SectionCard>
            </Reveal>

            {/* 6 — Self Pickup / Delivery + time */}
            <Reveal show={beverageDone} sectionRef={deliveryRef}>
              <SectionCard
                step={6}
                title={copy.fulfillmentTitle}
                description={fillCopy(copy.fulfillmentMeta, {
                  date: date || '—',
                  place: location || '—',
                })}
              >
                <div className="mb-5 flex flex-wrap gap-2">
                  <ChoiceChip
                    active={deliveryMethod === 'pickup'}
                    onClick={() => setDeliveryMethod('pickup')}
                  >
                    {copy.selfPickup}
                  </ChoiceChip>
                  <ChoiceChip
                    active={deliveryMethod === 'delivery'}
                    onClick={() => setDeliveryMethod('delivery')}
                  >
                    {copy.delivery}
                  </ChoiceChip>
                </div>

                {deliveryMethod === 'pickup' && (
                  <PickupLocationPicker
                    className="mb-4"
                    value={pickupLocationId}
                    onChange={(loc) => {
                      setPickupLocationId(loc.id)
                      setPickupLocationLabel(
                        loc.area ? `${loc.name} · ${loc.area}` : loc.name,
                      )
                      setErrors((prev) => {
                        const next = { ...prev }
                        delete next.pickupLocation
                        return next
                      })
                    }}
                    error={errors.pickupLocation}
                  />
                )}

                {deliveryMethod && (
                  <TextField
                    label={
                      deliveryMethod === 'delivery' ? copy.deliveryTime : copy.pickupTime
                    }
                    name="time"
                    type="time"
                    required
                    min={addisTimeInputMin(date, addisNow)}
                    value={time}
                    error={errors.time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                )}
              </SectionCard>
            </Reveal>

            {/* 7 — Special requests (own section with chips) */}
            <Reveal show={deliveryDone} sectionRef={requestsRef}>
              <SectionCard
                step={7}
                title={copy.specialRequestsTitle}
                description={copy.specialRequestsDescription}
              >
                <TextAreaField
                  label={copy.specialRequestsLabel}
                  name="instructions"
                  rows={4}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={copy.specialRequestsPlaceholder}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {instructionChips.map((chip) => {
                    const active = instructions
                      .toLowerCase()
                      .includes(chip.toLowerCase())
                    return (
                      <ChoiceChip
                        key={chip}
                        active={active}
                        onClick={() => toggleInstruction(chip)}
                      >
                        {active ? chip : `+ ${chip}`}
                      </ChoiceChip>
                    )
                  })}
                </div>
              </SectionCard>
            </Reveal>

            {/* 8 — Summary + confirm */}
            <Reveal show={showSummary} sectionRef={summaryRef}>
              <SectionCard step={8} title={copy.orderSummary}>
                {selectedPackage && eventType && mealType && deliveryMethod && (
                  <dl className="mb-6 space-y-3 rounded-2xl bg-cream-warm p-5 text-sm">
                    <SummaryRow label={copy.summaryGuests} value={String(guests)} />
                    <SummaryRow
                      label={copy.summaryOccasion}
                      value={getOccasionLabel(eventType, customOccasion)}
                    />
                    <SummaryRow
                      label={copy.summaryMealType}
                      value={
                        mealType === 'fasting' ? copy.mealTypeFastingValue : copy.mealTypeNonFastingValue
                      }
                    />
                    <SummaryRow
                      label={copy.summaryPackage}
                      value={`${selectedPackage.nameAm} · ${selectedPackage.name}`}
                    />
                    <SummaryRow
                      label={copy.summaryBeverage}
                      value={getBeverageLabel(beverageOption)}
                    />
                    <SummaryRow
                      label={copy.summaryPricePerPerson}
                      value={formatPrice(pricePerGuest)}
                    />
                    <SummaryRow
                      label={copy.summaryTotal}
                      value={`${guests} × ${formatPrice(pricePerGuest)} = ${formatPrice(totalPrice)}`}
                      highlight
                    />
                    <SummaryRow
                      label={copy.summaryFulfillment}
                      value={formatFulfillmentLabel(deliveryMethod, {
                        pickup: copy.selfPickup,
                        delivery: copy.delivery,
                      })}
                    />
                    {deliveryMethod === 'pickup' && pickupLocationLabel ? (
                      <SummaryRow label={copy.pickupLocation} value={pickupLocationLabel} />
                    ) : null}
                    <SummaryRow label={copy.summaryDate} value={date} />
                    <SummaryRow label={copy.summaryTime} value={time} />
                    <SummaryRow label={copy.summaryPlace} value={location} />
                    <SummaryRow label={copy.summaryContact} value={`${name} · ${phone}`} />
                    {instructions.trim() && (
                      <SummaryRow label={copy.summarySpecialRequests} value={instructions} />
                    )}
                  </dl>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full justify-center disabled:opacity-50 sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {copy.confirming}
                    </>
                  ) : (
                    copy.confirmBooking
                  )}
                </button>
              </SectionCard>
            </Reveal>
          </div>

          {/* Sticky estimate — follows scroll on desktop; fixed bar on mobile */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 z-30">
              <EstimatePanel
                copy={copy}
                guests={guests}
                selectedPackage={selectedPackage}
                beverageLabel={
                  selectedPackage ? getBeverageLabel(beverageOption) : '—'
                }
                pricePerGuest={pricePerGuest}
                totalPrice={totalPrice}
              />
            </div>
          </aside>
        </form>

        {/* Mobile floating estimate */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2C1A14]/15 bg-[#2C1A14] p-4 shadow-[0_-8px_30px_rgba(44,26,20,0.25)] lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#E8B838]">
                {copy.yourEstimate}
              </p>
              <p className="text-xs text-[#FAF5EE]/70">
                {selectedPackage
                  ? `${guests} × ${formatPrice(pricePerGuest)}`
                  : copy.fillFormToSeeTotal}
              </p>
            </div>
            <p className="font-display text-2xl font-bold text-[#E8B838]">
              {selectedPackage ? formatPrice(totalPrice) : '—'}
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

function scrollToSection(ref: React.RefObject<HTMLDivElement | null>) {
  requestAnimationFrame(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function EstimatePanel({
  copy,
  guests,
  selectedPackage,
  beverageLabel,
  pricePerGuest,
  totalPrice,
}: {
  copy: Record<string, string>
  guests: number
  selectedPackage: CateringCatalogPackage | undefined
  beverageLabel: string
  pricePerGuest: number
  totalPrice: number
}) {
  return (
    <div className="rounded-3xl border border-[#E8B838]/35 bg-[#2C1A14] p-6 text-[#FAF5EE] shadow-xl shadow-[#2C1A14]/30">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#E8B838]">
        {copy.yourEstimate}
      </p>
      <p className="mt-1 text-sm text-[#FAF5EE]/65">{copy.estimateFormula}</p>

      <div className="mt-5 space-y-2 border-b border-[#FAF5EE]/15 pb-5 text-sm">
        <div className="flex justify-between text-[#FAF5EE]/70">
          <span>{copy.summaryGuests}</span>
          <span className="font-medium text-[#FAF5EE]">{guests}</span>
        </div>
        <div className="flex justify-between text-[#FAF5EE]/70">
          <span>{copy.summaryPackage}</span>
          <span className="max-w-[55%] text-right font-medium text-[#FAF5EE]">
            {selectedPackage?.nameAm ?? '—'}
          </span>
        </div>
        <div className="flex justify-between text-[#FAF5EE]/70">
          <span>{copy.summaryBeverage}</span>
          <span className="font-medium text-[#FAF5EE]">
            {selectedPackage ? beverageLabel : '—'}
          </span>
        </div>
        <div className="flex justify-between text-[#FAF5EE]/70">
          <span>{copy.estimatePerPerson}</span>
          <span className="font-medium text-[#FAF5EE]">
            {pricePerGuest ? formatPrice(pricePerGuest) : '—'}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs text-[#FAF5EE]/55">
          {selectedPackage
            ? `${guests} × ${formatPrice(pricePerGuest)}`
            : copy.completeStepsToSeeTotal}
        </p>
        <p className="mt-1 font-display text-3xl font-bold text-[#E8B838]">
          {selectedPackage ? formatPrice(totalPrice) : '—'}
        </p>
      </div>
    </div>
  )
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

function ChoiceChip({
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
          ? 'border-burgundy bg-burgundy text-white'
          : 'border-burgundy/20 bg-white text-gray-600 hover:border-burgundy/50 hover:text-burgundy',
      )}
    >
      {children}
    </button>
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
          ? 'border-burgundy bg-burgundy/[0.06] ring-2 ring-burgundy/20'
          : 'border-burgundy/15 hover:border-burgundy/40',
      )}
    >
      <p className="font-display text-lg font-bold uppercase text-gray-900">{title}</p>
      <p className="text-sm font-medium text-burgundy">{subtitle}</p>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </button>
  )
}

function PackageCard({
  copy,
  pkg,
  active,
  featured,
  onSelect,
}: {
  copy: Record<string, string>
  pkg: CateringCatalogPackage
  active: boolean
  featured?: boolean
  onSelect: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const basePrice =
    pkg.beveragePricing?.['food-only'] ?? pkg.fixedPricePerGuest ?? 0

  return (
    <>
      {/* ── Mobile: full-width compact card ── */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border sm:hidden',
          active
            ? 'border-[#E8B838] bg-[#2C1A14] text-[#FAF5EE] shadow-lg shadow-[#2C1A14]/30'
            : featured
              ? 'border-[#E8B838]/70 bg-[#FAF5EE]'
              : 'border-[#2C1A14]/12 bg-[#FAF5EE]',
        )}
      >
        {featured && !active && (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-[#E8B838] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2C1A14]">
            {copy.popular}
          </span>
        )}

        <button
          type="button"
          onClick={onSelect}
          className="flex w-full gap-3 p-3 text-left"
        >
          {pkg.image && (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
              <img
                src={pkg.image}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div
                className={cn(
                  'absolute inset-0',
                  active ? 'bg-[#2C1A14]/30' : 'bg-[#2C1A14]/10',
                )}
              />
            </div>
          )}

          <div className="min-w-0 flex-1 py-0.5">
            <div className="flex items-start gap-1.5">
              {pkg.badge && <span className="text-base leading-none">{pkg.badge}</span>}
              <div className="min-w-0">
                <h3
                  className={cn(
                    'font-display text-base font-bold uppercase leading-tight',
                    active ? 'text-[#FAF5EE]' : 'text-[#2C1A14]',
                  )}
                >
                  {pkg.nameAm}
                </h3>
                <p
                  className={cn(
                    'truncate text-[11px]',
                    active ? 'text-[#FAF5EE]/65' : 'text-[#2C1A14]/50',
                  )}
                >
                  {pkg.name}
                </p>
              </div>
            </div>

            <p
              className={cn(
                'mt-2 font-display text-2xl font-bold tracking-tight',
                active ? 'text-[#E8B838]' : 'text-[#931F1D]',
              )}
            >
              {formatPrice(basePrice)}
              <span
                className={cn(
                  'ml-1 text-[10px] font-normal uppercase tracking-wider',
                  active ? 'text-[#FAF5EE]/50' : 'text-[#2C1A14]/40',
                )}
              >
                {copy.perPerson}
              </span>
            </p>

            <span
              className={cn(
                'mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                active
                  ? 'bg-[#E8B838] text-[#2C1A14]'
                  : 'bg-[#2C1A14] text-[#FAF5EE]',
              )}
            >
              {active ? copy.selected : copy.tapToSelect}
            </span>
          </div>
        </button>

        <div
          className={cn(
            'border-t px-3',
            active ? 'border-[#FAF5EE]/15' : 'border-[#2C1A14]/10',
          )}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              'flex w-full items-center justify-between py-2.5 text-xs font-semibold uppercase tracking-wide',
              active ? 'text-[#E8B838]' : 'text-[#2C1A14]/70',
            )}
          >
            <span>{menuOpen ? copy.hideMenu : fillCopy(copy.seeMenu, { count: pkg.dishes.length })}</span>
            <span className="text-sm">{menuOpen ? '−' : '+'}</span>
          </button>

          {menuOpen && (
            <ul
              className={cn(
                'max-h-48 space-y-1 overflow-y-auto pb-3 text-left text-[11px] leading-snug',
              )}
            >
              {pkg.dishes.map((dish) => (
                <li key={dish} className="flex items-start gap-1.5">
                  <Check
                    className={cn(
                      'mt-0.5 h-3 w-3 shrink-0',
                      active ? 'text-[#E8B838]' : 'text-[#931F1D]',
                    )}
                  />
                  <span className={active ? 'text-[#FAF5EE]/90' : 'text-[#2C1A14]/80'}>
                    {dish}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Desktop: vertical pricing column ── */}
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'relative hidden h-full w-full flex-col overflow-hidden rounded-3xl border text-left transition-all sm:flex',
          active
            ? 'border-[#E8B838] bg-[#2C1A14] text-[#FAF5EE] shadow-xl shadow-[#2C1A14]/35 ring-2 ring-[#E8B838]/50'
            : featured
              ? 'border-[#E8B838]/60 bg-[#FAF5EE] hover:border-[#E8B838]'
              : 'border-[#2C1A14]/15 bg-[#FAF5EE] hover:border-[#931F1D]/40 hover:shadow-md',
        )}
      >
        {featured && !active && (
          <span className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-[#E8B838] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2C1A14] shadow">
            {copy.popular}
          </span>
        )}

        {pkg.image && (
          <div className="relative h-32 w-full shrink-0 overflow-hidden">
            <img
              src={pkg.image}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div
              className={cn(
                'absolute inset-0',
                active
                  ? 'bg-[#2C1A14]/45'
                  : 'bg-gradient-to-t from-[#2C1A14]/45 to-transparent',
              )}
            />
          </div>
        )}

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 text-center">
            {pkg.badge && <span className="text-xl">{pkg.badge}</span>}
            <h3
              className={cn(
                'mt-0.5 font-display text-lg font-bold uppercase leading-tight',
                active ? 'text-[#FAF5EE]' : 'text-[#2C1A14]',
              )}
            >
              {pkg.nameAm}
            </h3>
            <p
              className={cn(
                'text-xs font-medium',
                active ? 'text-[#FAF5EE]/70' : 'text-[#2C1A14]/55',
              )}
            >
              {pkg.name}
            </p>
          </div>

          <div className="mb-3 text-center">
            <p
              className={cn(
                'font-display text-3xl font-bold tracking-tight',
                active ? 'text-[#E8B838]' : 'text-[#931F1D]',
              )}
            >
              {formatPrice(basePrice)}
            </p>
            <p
              className={cn(
                'mt-0.5 text-xs uppercase tracking-wider',
                active ? 'text-[#FAF5EE]/55' : 'text-[#2C1A14]/40',
              )}
            >
              {copy.estimatePerPerson}
            </p>
          </div>

          <ul
            className={cn(
              'mt-auto max-h-52 space-y-1 overflow-y-auto border-t pt-3 text-left text-[11px] leading-snug',
              active ? 'border-[#FAF5EE]/20' : 'border-[#2C1A14]/10',
            )}
          >
            {pkg.dishes.map((dish) => (
              <li key={dish} className="flex items-start gap-1.5">
                <Check
                  className={cn(
                    'mt-0.5 h-3 w-3 shrink-0',
                    active ? 'text-[#E8B838]' : 'text-[#931F1D]',
                  )}
                />
                <span className={active ? 'text-[#FAF5EE]/90' : 'text-[#2C1A14]/80'}>
                  {dish}
                </span>
              </li>
            ))}
          </ul>

          <span
            className={cn(
              'mt-4 block rounded-full py-2.5 text-center text-sm font-semibold transition-colors',
              active
                ? 'bg-[#E8B838] text-[#2C1A14]'
                : 'bg-[#2C1A14] text-[#FAF5EE]',
            )}
          >
            {active ? copy.selected : copy.selectPackage}
          </span>
        </div>
      </button>
    </>
  )
}

function SummaryRow({
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
      <dt className="text-gray-500">{label}</dt>
      <dd
        className={cn(
          'text-right font-medium text-gray-900',
          highlight && 'font-display text-base font-bold text-burgundy',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
