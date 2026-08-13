import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Building2,
  CreditCard,
  Loader2,
  ShoppingBag,
  Truck,
  Store,
  Upload,
} from 'lucide-react'
import type {
  FulfillmentMethod,
  OrderDraft,
  OrderLine,
  PaymentMethod,
} from '@/types'
import { createOrder } from '@/services'
import { CURRENCY, restaurant } from '@/data/restaurant'
import { useCart } from '@/hooks/useCart'
import { formatPrice, formatQuantity } from '@/lib/format'
import PageHero from '@/components/common/PageHero'
import FoodVisual from '@/components/common/FoodVisual'
import { TextField, TextAreaField } from '@/components/common/FormField'
import { DeliveryFeeNotice } from '@/components/common/DeliveryFeeNotice'
import { PickupLocationPicker } from '@/components/common/PickupLocationPicker'
import { cn } from '@/lib/utils'

const DELIVERY_FEE = 150

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, clear } = useCart()

  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>('delivery')
  const [pickupLocationId, setPickupLocationId] = useState<string | null>(null)
  const [pickupLocationLabel, setPickupLocationLabel] = useState('')
  const [payment, setPayment] = useState<PaymentMethod>('chapa')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    notes: '',
  })
  const [proofName, setProofName] = useState<string>('')
  const [proofData, setProofData] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const deliveryFee = fulfillment === 'delivery' ? DELIVERY_FEE : 0
  const total = subtotal + deliveryFee

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleProof = (file?: File) => {
    if (!file) return
    setProofName(file.name)
    const reader = new FileReader()
    reader.onload = () => setProofData(String(reader.result))
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'Please enter your name.'
    if (!form.phone.trim()) next.phone = 'A phone number is required.'
    if (fulfillment === 'delivery' && !form.address.trim())
      next.address = 'A delivery address is required.'
    if (fulfillment === 'pickup' && !pickupLocationId)
      next.pickupLocation = 'Please choose a pickup location.'
    if (payment === 'bank_transfer' && !proofData)
      next.proof = 'Please upload your transfer receipt.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0 || !validate()) return

    const lines: OrderLine[] = items.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      unit: product.unit,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity,
    }))

    const draft: OrderDraft = {
      customer: {
        name: form.name,
        phone: form.phone,
        address:
          fulfillment === 'delivery' ? form.address : pickupLocationLabel || undefined,
        email: form.email || undefined,
        notes: form.notes || undefined,
      },
      fulfillment,
      payment,
      items: lines,
      subtotal,
      deliveryFee,
      total,
      currency: CURRENCY,
      paymentProof: payment === 'bank_transfer' ? proofData : undefined,
    }

    setSubmitting(true)
    try {
      const order = await createOrder(draft)
      clear()
      navigate('/confirmation', { state: { kind: 'order', order } })
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <>
        <PageHero
          eyebrow="Checkout"
          title="Your cart is empty"
          crumbs={[{ label: 'Home', to: '/' }, { label: 'Checkout' }]}
        />
        <section className="bg-cream py-20">
          <div className="mx-auto max-w-md px-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-burgundy/10">
              <ShoppingBag className="h-7 w-7 text-burgundy" />
            </div>
            <p className="mt-5 text-gray-500">
              Add some products before heading to checkout.
            </p>
            <Link to="/shop" className="btn-primary mt-6">
              Browse the Shop
            </Link>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHero
        eyebrow="Checkout"
        title="Complete your order"
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Shop', to: '/shop' },
          { label: 'Checkout' },
        ]}
      />

      <section className="bg-cream py-12 sm:py-16">
        <form
          onSubmit={handleSubmit}
          className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8"
        >
          {/* Left: details */}
          <div className="space-y-8 lg:col-span-2">
            {/* Fulfillment */}
            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="font-display text-xl font-bold uppercase text-gray-900">
                1. Delivery or self pickup
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FulfillmentOption
                  active={fulfillment === 'delivery'}
                  onClick={() => setFulfillment('delivery')}
                  Icon={Truck}
                  title="Delivery"
                  desc="We bring it to you"
                />
                <FulfillmentOption
                  active={fulfillment === 'pickup'}
                  onClick={() => setFulfillment('pickup')}
                  Icon={Store}
                  title="Self Pickup"
                  desc="Collect at a Senay Tela location · Free"
                />
              </div>
              {fulfillment === 'pickup' && (
                <PickupLocationPicker
                  className="mt-5"
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
              {fulfillment === 'delivery' && (
                <DeliveryFeeNotice className="mt-5" />
              )}
            </div>

            {/* Customer info */}
            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="font-display text-xl font-bold uppercase text-gray-900">
                2. Your details
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Full name"
                  name="name"
                  required
                  value={form.name}
                  error={errors.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Abebe Bekele"
                />
                <TextField
                  label="Phone number"
                  name="phone"
                  required
                  type="tel"
                  value={form.phone}
                  error={errors.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+251 ..."
                />
                <TextField
                  label="Email (optional)"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com"
                  className="sm:col-span-2"
                />
                {fulfillment === 'delivery' && (
                  <TextAreaField
                    label="Delivery address"
                    name="address"
                    required
                    rows={2}
                    value={form.address}
                    error={errors.address}
                    onChange={(e) => update('address', e.target.value)}
                    placeholder="Sub-city, woreda, building, landmark…"
                    className="sm:col-span-2"
                  />
                )}
                <TextAreaField
                  label="Order notes (optional)"
                  name="notes"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  placeholder="Any preferences for your order"
                  className="sm:col-span-2"
                />
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="font-display text-xl font-bold uppercase text-gray-900">
                3. Payment
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FulfillmentOption
                  active={payment === 'chapa'}
                  onClick={() => setPayment('chapa')}
                  Icon={CreditCard}
                  title="Pay with Chapa"
                  desc="Card, telebirr & mobile money"
                />
                <FulfillmentOption
                  active={payment === 'bank_transfer'}
                  onClick={() => setPayment('bank_transfer')}
                  Icon={Building2}
                  title="Bank transfer"
                  desc="Transfer & upload your receipt"
                />
              </div>

              {payment === 'chapa' && (
                <div className="mt-5 rounded-2xl border border-dashed border-burgundy/30 bg-cream p-5 text-sm text-gray-600">
                  You&apos;ll be redirected to Chapa&apos;s secure checkout to
                  complete payment after placing your order.
                  <span className="mt-1 block text-xs text-gray-400">
                    (Chapa integration placeholder — connect your public key in
                    the order service.)
                  </span>
                </div>
              )}

              {payment === 'bank_transfer' && (
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-cream p-5 text-sm">
                    <p className="font-semibold text-gray-900">
                      Transfer to:
                    </p>
                    <dl className="mt-2 space-y-1 text-gray-600">
                      <div className="flex justify-between gap-4">
                        <dt>Bank</dt>
                        <dd className="font-medium text-gray-900">
                          {restaurant.bankAccount.bankName}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt>Account name</dt>
                        <dd className="font-medium text-gray-900">
                          {restaurant.bankAccount.accountName}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt>Account number</dt>
                        <dd className="font-medium text-gray-900">
                          {restaurant.bankAccount.accountNumber}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-5 transition-colors',
                      errors.proof
                        ? 'border-destructive bg-destructive/5'
                        : 'border-burgundy/30 hover:bg-cream',
                    )}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-burgundy/10 text-burgundy">
                      <Upload className="h-5 w-5" />
                    </span>
                    <span className="flex-1 text-sm">
                      <span className="block font-semibold text-gray-900">
                        {proofName || 'Upload payment screenshot'}
                      </span>
                      <span className="text-gray-400">
                        PNG or JPG of your transfer confirmation
                      </span>
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleProof(e.target.files?.[0])}
                    />
                  </label>
                  {errors.proof && (
                    <p className="text-xs text-destructive">{errors.proof}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Your payment will show as <strong>pending verification</strong>{' '}
                    until our team confirms the transfer.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: summary */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="font-display text-xl font-bold uppercase text-gray-900">
                Order summary
              </h2>
              <ul className="mt-5 space-y-4">
                {items.map(({ product, quantity }) => (
                  <li key={product.id} className="flex gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      <FoodVisual
                        image={product.image}
                        name={product.name}
                        category={product.category}
                      />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-gray-400">
                        {formatQuantity(quantity, product.unit)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(product.price * quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-2 border-t border-burgundy/10 pt-4 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>{fulfillment === 'delivery' ? 'Delivery' : 'Self Pickup'}</span>
                  <span>{deliveryFee ? formatPrice(deliveryFee) : 'Free'}</span>
                </div>
                <div className="flex justify-between border-t border-burgundy/10 pt-2 font-display text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary mt-6 w-full justify-center disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Placing order…
                  </>
                ) : (
                  <>Place order · {formatPrice(total)}</>
                )}
              </button>
            </div>
          </aside>
        </form>
      </section>
    </>
  )
}

function FulfillmentOption({
  active,
  onClick,
  Icon,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  Icon: typeof Truck
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
        active
          ? 'border-burgundy bg-burgundy/5 ring-2 ring-burgundy/20'
          : 'border-burgundy/15 hover:border-burgundy/40',
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
          active ? 'bg-burgundy text-white' : 'bg-burgundy/10 text-burgundy',
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-display text-base font-bold uppercase text-gray-900">
          {title}
        </span>
        <span className="text-xs text-gray-500">{desc}</span>
      </span>
    </button>
  )
}
