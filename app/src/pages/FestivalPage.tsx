import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import {
  Check,
  CircleDot,
  Drumstick,
  Droplets,
  Egg,
  Loader2,
  Milk,
  Wheat,
  Wine,
  type LucideIcon,
} from 'lucide-react'
import type { CateringDeliveryMethod } from '@/types'
import {
  festivalPackages as localFestivalPackages,
  getFestivalPrices,
  packageNeedsDrinkChoice,
  type FestivalItemIcon,
  type FestivalPackage,
  type FestivalPackageId,
} from '@/data/festivalCatalog'
import { getFestivalPackagesFromApi } from '@/services/catalogApi'
import { usePageContent } from '@/hooks/usePageContent'
import { useServiceEnabled } from '@/hooks/useServiceEnabled'
import PageHero from '@/components/common/PageHero'
import QuantityStepper from '@/components/common/QuantityStepper'
import { TextField, TextAreaField } from '@/components/common/FormField'
import { PickupLocationPicker } from '@/components/common/PickupLocationPicker'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { DeliveryFeeNotice } from '@/components/common/DeliveryFeeNotice'
import { useAddisNow } from '@/hooks/useAddisNow'
import { useFormCopy, fillCopy } from '@/hooks/useFormCopy'
import { addisDateError, addisDateInputMin } from '@/lib/addisTime'

const ITEM_ICONS: Record<FestivalItemIcon, LucideIcon> = {
  chicken: Drumstick,
  eggs: Egg,
  injera: CircleDot,
  bread: Wheat,
  cheese: Milk,
  oil: Droplets,
  drink: Wine,
}

type DrinkChoice = 'tej' | 'berz'

export default function FestivalPage() {
  const navigate = useNavigate()
  const page = usePageContent('festival')
  const addisNow = useAddisNow()
  const copy = useFormCopy('festival')
  const { allowed, loading: serviceLoading } = useServiceEnabled('festival')
  const [packages, setPackages] = useState<FestivalPackage[]>(localFestivalPackages)
  const [prices, setPrices] = useState(() => getFestivalPrices())

  const [selectedId, setSelectedId] = useState<FestivalPackageId | null>(null)
  const [qty, setQty] = useState(1)
  const [drinkChoice, setDrinkChoice] = useState<DrinkChoice | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [deliveryMethod, setDeliveryMethod] =
    useState<CateringDeliveryMethod>('delivery')
  const [pickupLocationId, setPickupLocationId] = useState<string | null>(null)
  const [pickupLocationLabel, setPickupLocationLabel] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getFestivalPackagesFromApi().then(({ packages: pkgs, prices: p }) => {
      setPackages(pkgs)
      setPrices(p)
    })
  }, [])

  const selected = selectedId
    ? packages.find((p) => p.id === selectedId) ?? null
    : null
  const unitPrice = selectedId ? prices[selectedId] : 0
  const grandTotal = selected ? unitPrice * qty : 0
  const needsDrink = selectedId ? packageNeedsDrinkChoice(selectedId) : false

  const selectPackage = (pkg: FestivalPackage) => {
    if (selectedId === pkg.id) {
      setSelectedId(null)
      setDrinkChoice(null)
      setQty(1)
      return
    }
    setSelectedId(pkg.id)
    setQty(1)
    if (!packageNeedsDrinkChoice(pkg.id)) setDrinkChoice(null)
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!selectedId) next.package = copy.errorPackage
    if (needsDrink && !drinkChoice) {
      next.drink = copy.errorDrink
    }
    if (!name.trim()) next.name = copy.errorName
    if (!phone.trim()) next.phone = copy.errorPhone
    if (!date) next.date = copy.errorDate
    else {
      const dateErr = addisDateError(date, addisNow)
      if (dateErr) next.date = dateErr
    }
    if (deliveryMethod === 'delivery' && !location.trim()) {
      next.location = copy.errorAddress
    }
    if (deliveryMethod === 'pickup' && !pickupLocationId) {
      next.pickupLocation = copy.errorPickupLocation
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !selected || !selectedId) {
      document
        .getElementById('festival-order')
        ?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    setSubmitting(true)
    try {
      const { submitServiceRequest, toApiDelivery } = await import(
        '@/services/requestService'
      )
      const includedItems = selected.items.map((i) =>
        i.choice && drinkChoice
          ? `2 L ${drinkChoice === 'tej' ? 'Tej' : 'Berz'}`
          : i.label,
      )
      const payload = {
        packageId: selectedId,
        packageName: selected.name,
        qty,
        unitPrice,
        grandTotal,
        drinkChoice: needsDrink ? drinkChoice : undefined,
        includedItems,
        deliveryMethod,
        date,
        location:
          deliveryMethod === 'delivery' ? location.trim() : pickupLocationLabel,
        pickupLocationId: deliveryMethod === 'pickup' ? pickupLocationId : undefined,
        pickupLocation: deliveryMethod === 'pickup' ? pickupLocationLabel : undefined,
        notes: notes.trim() || undefined,
        contact: { name: name.trim(), phone: phone.trim() },
      }
      const created = await submitServiceRequest({
        serviceSlug: 'festival',
        customerName: name.trim(),
        phone: phone.trim(),
        deliveryMethod: toApiDelivery(deliveryMethod),
        location: payload.location,
        preferredDate: date,
        notes: payload.notes,
        packageSummary: `${selected.name} × ${qty}`,
        totalAmount: grandTotal,
        payload,
      })
      navigate('/confirmation', {
        state: {
          kind: 'festival',
          request: { reference: created.reference, ...payload },
        },
      })
    } catch (err) {
      setErrors({
        name: err instanceof Error ? err.message : 'Could not submit request.',
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
        eyebrow={page.eyebrow || 'Festival'}
        title={page.title || 'Celebration packages for every feast'}
        description={
          page.description ||
          'Predefined holiday packages — from Grand to Basic — so you can compare what’s included and order with confidence.'
        }
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Festival' }]}
      />

      <section className="bg-cream pb-28 pt-10 sm:py-16 lg:pb-16">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8"
        >
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8B838] text-sm font-bold text-[#2C1A14]">
                1
              </span>
              <div>
                <h2 className="font-display text-xl font-bold uppercase text-[#2C1A14]">
                  {copy.choosePackage}
                </h2>
                <p className="text-sm text-[#2C1A14]/55">
                  {copy.choosePackageHint}
                </p>
              </div>
            </div>

            {errors.package && (
              <p className="mb-3 text-sm text-destructive">{errors.package}</p>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {packages.map((pkg) => {
                const isSelected = selectedId === pkg.id
                const price = prices[pkg.id]
                return (
                  <article
                    key={pkg.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => selectPackage(pkg)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        selectPackage(pkg)
                      }
                    }}
                    className={cn(
                      'relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-300',
                      isSelected
                        ? 'border-[#E8B838] ring-2 ring-[#E8B838]/40 shadow-lg'
                        : 'border-[#2C1A14]/10 hover:-translate-y-1 hover:border-[#E8B838]/45 hover:shadow-md',
                      pkg.badge && 'md:col-span-1',
                    )}
                  >
                    {pkg.badge && (
                      <span className="absolute right-4 top-4 z-10 rounded-full bg-[#E8B838] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2C1A14]">
                        {pkg.badge}
                      </span>
                    )}

                    <div
                      className={cn(
                        'border-b border-[#2C1A14]/8 px-5 pb-4 pt-5',
                        pkg.id === 'grand' ? 'bg-[#2C1A14] text-[#FAF5EE]' : 'bg-[#FAF5EE]',
                      )}
                    >
                      <p
                        className={cn(
                          'text-[10px] font-semibold uppercase tracking-[0.18em]',
                          pkg.id === 'grand'
                            ? 'text-[#E8B838]'
                            : 'text-[#2C1A14]/45',
                        )}
                      >
                        Festival
                      </p>
                      <h3
                        className={cn(
                          'mt-1 font-display text-xl font-bold uppercase leading-tight',
                          pkg.id === 'grand'
                            ? 'text-[#FAF5EE]'
                            : 'text-[#2C1A14]',
                        )}
                      >
                        {pkg.name.replace(/^Festival\s+/i, '')}
                      </h3>
                      <p
                        className={cn(
                          'mt-2 text-sm leading-relaxed',
                          pkg.id === 'grand'
                            ? 'text-[#FAF5EE]/70'
                            : 'text-[#2C1A14]/55',
                        )}
                      >
                        {pkg.tagline}
                      </p>
                      <p
                        className={cn(
                          'mt-4 font-display text-3xl font-bold',
                          pkg.id === 'grand'
                            ? 'text-[#E8B838]'
                            : 'text-[#931F1D]',
                        )}
                      >
                        {formatPrice(price)}
                      </p>
                    </div>

                    <ul className="flex flex-1 flex-col gap-2.5 px-5 py-5">
                      {pkg.items.map((item) => {
                        const Icon = ITEM_ICONS[item.icon]
                        return (
                          <li
                            key={item.id}
                            className="flex items-start gap-3 text-sm text-[#2C1A14]/80"
                          >
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FAF5EE] text-[#931F1D]">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="leading-snug">{item.label}</span>
                          </li>
                        )
                      })}
                    </ul>

                    <div className="border-t border-[#2C1A14]/8 px-5 py-4">
                      <span
                        className={cn(
                          'inline-flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold transition-colors',
                          isSelected
                            ? 'bg-[#E8B838] text-[#2C1A14]'
                            : 'bg-[#2C1A14] text-[#FAF5EE]',
                        )}
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            {copy.selected}
                          </>
                        ) : (
                          copy.selectPackage
                        )}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          {/* Order details */}
          <div
            id="festival-order"
            className="rounded-3xl border border-[#2C1A14]/10 bg-[#FAF5EE] p-6 shadow-sm sm:p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8B838] text-sm font-bold text-[#2C1A14]">
                2
              </span>
              <div>
                <h2 className="font-display text-xl font-bold uppercase text-[#2C1A14]">
                  {copy.orderDetailsTitle}
                </h2>
                <p className="text-sm text-[#2C1A14]/55">
                  {copy.detailsHint}
                </p>
              </div>
            </div>

            {selected ? (
              <div className="mb-6 rounded-2xl border border-[#E8B838]/40 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#2C1A14]/40">
                      {copy.selectedPackage}
                    </p>
                    <p className="font-display text-lg font-bold uppercase text-[#2C1A14]">
                      {selected.name}
                    </p>
                    <p className="mt-1 text-sm text-[#2C1A14]/55">
                      {fillCopy(copy.eachPrice, { price: formatPrice(unitPrice) })}
                    </p>
                  </div>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#2C1A14]/40">
                      {copy.quantity}
                    </p>
                    <QuantityStepper
                      value={qty}
                      min={1}
                      step={1}
                      size="sm"
                      onChange={setQty}
                    />
                  </div>
                </div>

                {needsDrink && (
                  <div className="mt-4 border-t border-[#2C1A14]/8 pt-4">
                    <p className="mb-2 text-sm font-medium text-[#2C1A14]">
                      {copy.chooseDrink}
                    </p>
                    {errors.drink && (
                      <p className="mb-2 text-sm text-destructive">{errors.drink}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {(['tej', 'berz'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setDrinkChoice(opt)}
                          className={cn(
                            'rounded-full border px-4 py-2 text-sm font-medium capitalize transition-colors',
                            drinkChoice === opt
                              ? 'border-[#2C1A14] bg-[#2C1A14] text-[#FAF5EE]'
                              : 'border-[#2C1A14]/20 bg-white text-[#2C1A14]/70',
                          )}
                        >
                          {opt === 'tej' ? copy.tej : copy.berz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-between border-t border-[#2C1A14]/8 pt-4">
                  <span className="text-sm text-[#2C1A14]/55">{copy.orderTotal}</span>
                  <span className="font-display text-2xl font-bold text-[#931F1D]">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mb-6 rounded-2xl border border-dashed border-[#2C1A14]/20 bg-white px-5 py-8 text-center text-sm text-[#2C1A14]/55">
                {copy.selectToContinue}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label={copy.customerName}
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

            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-[#2C1A14]">
                {copy.fulfillmentOr}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    deliveryMethod === 'pickup'
                      ? 'border-[#2C1A14] bg-[#2C1A14] text-[#FAF5EE]'
                      : 'border-[#2C1A14]/20 bg-white text-[#2C1A14]/70',
                  )}
                >
                  {copy.selfPickup}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('delivery')}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    deliveryMethod === 'delivery'
                      ? 'border-[#2C1A14] bg-[#2C1A14] text-[#FAF5EE]'
                      : 'border-[#2C1A14]/20 bg-white text-[#2C1A14]/70',
                  )}
                >
                  {copy.delivery}
                </button>
              </div>
              {deliveryMethod === 'pickup' && (
                <PickupLocationPicker
                  className="mt-3"
                  value={pickupLocationId}
                  onChange={(loc) => {
                    setPickupLocationId(loc.id)
                    setPickupLocationLabel(
                      loc.area ? `${loc.name} · ${loc.area}` : loc.name,
                    )
                  }}
                  error={errors.pickupLocation}
                />
              )}
              {deliveryMethod === 'delivery' && (
                <DeliveryFeeNotice className="mt-3" />
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {deliveryMethod === 'delivery' && (
                <TextField
                  label={copy.deliveryAddress}
                  name="location"
                  required
                  value={location}
                  error={errors.location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={copy.deliveryAddressPlaceholder}
                  className="sm:col-span-2"
                />
              )}
              <TextField
                label={copy.preferredDate}
                name="date"
                type="date"
                required
                min={addisDateInputMin(addisNow)}
                value={date}
                error={errors.date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <TextAreaField
              className="mt-4"
              label={copy.additionalNotes}
              name="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={copy.notesPlaceholder}
            />

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary mt-6 w-full justify-center disabled:opacity-50 sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {copy.submitting}
                </>
              ) : (
                copy.submitOrder
              )}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}
