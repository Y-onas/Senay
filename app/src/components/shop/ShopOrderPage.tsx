import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Loader2, Search, ShoppingBag, X } from 'lucide-react'
import type { CateringDeliveryMethod } from '@/types'
import PageHero from '@/components/common/PageHero'
import QuantityStepper from '@/components/common/QuantityStepper'
import { TextField, TextAreaField } from '@/components/common/FormField'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface ShopProduct {
  id: string
  name: string
  description: string
  price: number
  unit: string
  category: string
  image: string
  minQty: number
  step: number
}

export interface ShopCategory {
  value: string
  label: string
}

interface ShopOrderPageProps {
  /** Confirmation `kind` and order-reference prefix, e.g. 'baltina' / 'BAL'. */
  kind: string
  refPrefix: string
  hero: {
    eyebrow: string
    title: string
    description: string
    crumbLabel: string
  }
  products: ShopProduct[]
  /** Include an 'all' entry first. Chips are hidden when only 'all' exists. */
  categories: ShopCategory[]
  searchPlaceholder: string
  detailsHint: string
}

type Selection = Record<string, number>

export default function ShopOrderPage({
  kind,
  refPrefix: _refPrefix,
  hero,
  products,
  categories,
  searchPlaceholder,
  detailsHint,
}: ShopOrderPageProps) {
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [selection, setSelection] = useState<Selection>({})

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [deliveryMethod, setDeliveryMethod] =
    useState<CateringDeliveryMethod>('delivery')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const orderAnchorId = `${kind}-order`

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const catOk = category === 'all' || p.category === category
      const qOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      return catOk && qOk
    })
  }, [products, query, category])

  const lines = useMemo(() => {
    return Object.entries(selection)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const product = products.find((p) => p.id === id)!
        return {
          product,
          qty,
          lineTotal: product.price * qty,
        }
      })
  }, [products, selection])

  const grandTotal = lines.reduce((sum, l) => sum + l.lineTotal, 0)
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0)
  const mobileUnit = lines[0]?.product.unit ?? ''

  const setQty = (product: ShopProduct, qty: number) => {
    setSelection((prev) => {
      const next = { ...prev }
      if (qty <= 0) delete next[product.id]
      else next[product.id] = qty
      return next
    })
  }

  const toggleProduct = (product: ShopProduct) => {
    setSelection((prev) => {
      const next = { ...prev }
      if (next[product.id]) delete next[product.id]
      else next[product.id] = product.minQty
      return next
    })
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!lines.length) next.products = 'Select at least one product.'
    if (!name.trim()) next.name = 'Your name is required.'
    if (!phone.trim()) next.phone = 'Phone number is required.'
    if (!date) next.date = 'Choose a preferred date.'
    if (deliveryMethod === 'delivery' && !location.trim()) {
      next.location = 'Enter a delivery address.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      document
        .getElementById(orderAnchorId)
        ?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    setSubmitting(true)
    try {
      const { submitServiceRequest, toApiDelivery } = await import(
        '@/services/requestService'
      )
      const serviceSlug = kind === 'drinks' ? 'drinks' : 'baltina'
      const created = await submitServiceRequest({
        serviceSlug,
        customerName: name.trim(),
        phone: phone.trim(),
        deliveryMethod: toApiDelivery(deliveryMethod),
        location:
          deliveryMethod === 'delivery'
            ? location.trim()
            : 'Pickup at Senay Tela',
        preferredDate: date,
        notes: notes.trim() || undefined,
        packageSummary: lines.map((l) => `${l.product.name} × ${l.qty}`).join(', '),
        totalAmount: grandTotal,
        payload: {
          items: lines.map((l) => ({
            id: l.product.id,
            name: l.product.name,
            qty: l.qty,
            unit: l.product.unit,
            unitPrice: l.product.price,
            lineTotal: l.lineTotal,
          })),
          grandTotal,
          deliveryMethod,
          date,
          location:
            deliveryMethod === 'delivery'
              ? location.trim()
              : 'Pickup at Senay Tela',
          notes: notes.trim() || undefined,
          contact: { name: name.trim(), phone: phone.trim() },
        },
      })

      navigate('/confirmation', {
        state: {
          kind,
          request: {
            reference: created.reference,
            items: lines.map((l) => ({
              id: l.product.id,
              name: l.product.name,
              qty: l.qty,
              unit: l.product.unit,
              unitPrice: l.product.price,
              lineTotal: l.lineTotal,
            })),
            grandTotal,
            deliveryMethod,
            date,
            location:
              deliveryMethod === 'delivery'
                ? location.trim()
                : 'Pickup at Senay Tela',
            notes: notes.trim() || undefined,
            contact: { name: name.trim(), phone: phone.trim() },
          },
        },
      })
    } catch (err) {
      setErrors({
        products:
          err instanceof Error ? err.message : 'Could not submit request.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const showCategories = categories.length > 1

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        description={hero.description}
        crumbs={[{ label: 'Home', to: '/' }, { label: hero.crumbLabel }]}
      />

      <section className="bg-cream pb-28 pt-10 sm:py-16 lg:pb-16">
        <form
          onSubmit={handleSubmit}
          className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8"
        >
          <div className="min-w-0 space-y-8">
            {/* Shop toolbar */}
            <div className="rounded-3xl border border-[#2C1A14]/10 bg-[#FAF5EE] p-4 shadow-sm sm:p-5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2C1A14]/40" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-full border border-[#2C1A14]/15 bg-white py-3 pl-10 pr-4 text-sm text-[#2C1A14] outline-none transition-colors placeholder:text-[#2C1A14]/40 focus:border-[#E8B838]"
                />
              </div>
              {showCategories && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={cn(
                        'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                        category === c.value
                          ? 'border-[#2C1A14] bg-[#2C1A14] text-[#FAF5EE]'
                          : 'border-[#2C1A14]/15 bg-white text-[#2C1A14]/70 hover:border-[#E8B838]',
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8B838] text-sm font-bold text-[#2C1A14]">
                1
              </span>
              <div>
                <h2 className="font-display text-xl font-bold uppercase text-[#2C1A14]">
                  Choose your products
                </h2>
                <p className="text-sm text-[#2C1A14]/55">
                  Click a card to add it — click again to remove. You can also use the Add and Remove buttons.
                </p>
              </div>
            </div>

            {errors.products && (
              <p className="text-sm text-destructive">{errors.products}</p>
            )}

            {/* Product grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((product) => {
                const qty = selection[product.id] ?? 0
                const selected = qty > 0
                return (
                  <article
                    key={product.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    onClick={() => toggleProduct(product)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleProduct(product)
                      }
                    }}
                    className={cn(
                      'group flex cursor-pointer flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-300',
                      selected
                        ? 'border-[#E8B838] ring-2 ring-[#E8B838]/35 shadow-md'
                        : 'border-[#2C1A14]/10 hover:-translate-y-1 hover:border-[#E8B838]/50 hover:shadow-lg',
                    )}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-white">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="pointer-events-none h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                      />
                      {selected && (
                        <span className="absolute left-3 top-3 rounded-full bg-[#E8B838] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2C1A14]">
                          In order
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col border-t border-[#2C1A14]/8 bg-[#FAF5EE] p-4 sm:p-5">
                      <h3 className="font-display text-lg font-bold uppercase text-[#2C1A14]">
                        {product.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-[#2C1A14]/65">
                        {product.description}
                      </p>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="font-display text-2xl font-bold text-[#931F1D]">
                            {formatPrice(product.price)}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-[#2C1A14]/40">
                            per {product.unit}
                          </p>
                        </div>

                        {selected && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <QuantityStepper
                              value={qty}
                              min={product.minQty}
                              step={product.step}
                              size="sm"
                              suffix={product.unit}
                              onChange={(v) => setQty(product, v)}
                            />
                          </div>
                        )}
                      </div>

                      {selected ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setQty(product, 0)
                          }}
                          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[#931F1D]/30 bg-white py-2.5 text-xs font-semibold text-[#931F1D] transition-colors hover:bg-[#931F1D] hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setQty(product, product.minQty)
                          }}
                          className="mt-3 w-full rounded-full bg-[#2C1A14] py-2.5 text-xs font-semibold text-[#FAF5EE] transition-colors hover:bg-[#E8B838] hover:text-[#2C1A14]"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>

            {filtered.length === 0 && (
              <p className="rounded-2xl border border-dashed border-[#2C1A14]/20 bg-[#FAF5EE] px-6 py-10 text-center text-sm text-[#2C1A14]/55">
                No products match your search. Try another keyword or category.
              </p>
            )}

            {/* Order details form */}
            <div
              id={orderAnchorId}
              className="rounded-3xl border border-[#2C1A14]/10 bg-[#FAF5EE] p-6 shadow-sm sm:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8B838] text-sm font-bold text-[#2C1A14]">
                  2
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold uppercase text-[#2C1A14]">
                    Your order details
                  </h2>
                  <p className="text-sm text-[#2C1A14]/55">{detailsHint}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Customer name"
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

              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-[#2C1A14]">
                  Delivery or Pickup
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
                    Pickup
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
                    Delivery
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
                <TextField
                  label="Preferred delivery / pickup date"
                  name="date"
                  type="date"
                  required
                  value={date}
                  error={errors.date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <TextAreaField
                className="mt-4"
                label="Additional notes"
                name="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergies, packaging preferences, etc."
              />

              {/* Mobile summary inside form */}
              <div className="mt-6 rounded-2xl bg-[#2C1A14] p-5 text-[#FAF5EE] lg:hidden">
                <OrderSummaryLines
                  lines={lines}
                  grandTotal={grandTotal}
                  onRemove={(p) => setQty(p, 0)}
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
                    Submitting…
                  </>
                ) : (
                  'Submit Order'
                )}
              </button>
            </div>
          </div>

          {/* Sticky summary sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 z-30">
              <div className="rounded-3xl border border-[#E8B838]/35 bg-[#2C1A14] p-6 text-[#FAF5EE] shadow-xl">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-[#E8B838]" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#E8B838]">
                    Order summary
                  </p>
                </div>
                <OrderSummaryLines
                  lines={lines}
                  grandTotal={grandTotal}
                  onRemove={(p) => setQty(p, 0)}
                />
                <a
                  href={`#${orderAnchorId}`}
                  className="mt-5 block rounded-full bg-[#E8B838] py-3 text-center text-sm font-semibold text-[#2C1A14] transition-colors hover:bg-[#F0C85A]"
                >
                  Complete order details
                </a>
              </div>
            </div>
          </aside>
        </form>

        {/* Mobile floating total */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2C1A14]/15 bg-[#2C1A14] p-4 lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#E8B838]">
                {lines.length ? `${lines.length} product(s)` : 'No products yet'}
              </p>
              <p className="text-xs text-[#FAF5EE]/70">
                {itemCount
                  ? `${itemCount} ${mobileUnit} selected`
                  : 'Tap Add on a product'}
              </p>
            </div>
            <p className="font-display text-2xl font-bold text-[#E8B838]">
              {lines.length ? formatPrice(grandTotal) : '—'}
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

function OrderSummaryLines({
  lines,
  grandTotal,
  onRemove,
}: {
  lines: { product: ShopProduct; qty: number; lineTotal: number }[]
  grandTotal: number
  onRemove?: (product: ShopProduct) => void
}) {
  if (!lines.length) {
    return (
      <p className="mt-4 text-sm text-[#FAF5EE]/65">
        Select products from the shop to build your order.
      </p>
    )
  }

  return (
    <>
      <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto border-b border-[#FAF5EE]/15 pb-4 text-sm">
        {lines.map((l) => (
          <li key={l.product.id} className="flex items-center justify-between gap-2">
            <span className="min-w-0 text-[#FAF5EE]/85">
              {l.product.name}{' '}
              <span className="text-[#FAF5EE]/50">
                × {l.qty} {l.product.unit}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="font-semibold text-[#E8B838]">
                {formatPrice(l.lineTotal)}
              </span>
              <button
                type="button"
                onClick={() => onRemove?.(l.product)}
                aria-label={`Remove ${l.product.name}`}
                className="rounded-full p-1 text-[#FAF5EE]/50 transition-colors hover:bg-[#FAF5EE]/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between font-display text-xl font-bold">
        <span>Total</span>
        <span className="text-[#E8B838]">{formatPrice(grandTotal)}</span>
      </div>
    </>
  )
}
