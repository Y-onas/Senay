import { Link, useLocation } from 'react-router'
import { CheckCircle2, Clock, Phone } from 'lucide-react'
import type { CateringRequest, Order } from '@/types'
import type { AgelgilPackageLine } from '@/data/agelgilCatalog'
import { formatComboLabel } from '@/data/agelgilCatalog'
import { formatPrice } from '@/lib/format'
import { restaurant } from '@/data/restaurant'
import { isTelegramWebApp } from '@/lib/telegramWebApp'

type AgelgilConfirmation = {
  reference: string
  mealType: string
  packageKind: string
  guests: number
  combo: AgelgilPackageLine[]
  coveredGuests: number
  grandTotal: number
  deliveryMethod: string
  date: string
  time: string
  location: string
}

type BaltinaConfirmation = {
  reference: string
  items: {
    id: string
    name: string
    qty: number
    unit: string
    unitPrice: number
    lineTotal: number
  }[]
  grandTotal: number
  deliveryMethod: string
  date: string
  location: string
}

type FestivalConfirmation = {
  reference: string
  packageId: string
  packageName: string
  qty: number
  unitPrice: number
  grandTotal: number
  drinkChoice?: string
  includedItems: string[]
  deliveryMethod: string
  date: string
  location: string
}

type ConfirmationState =
  | { kind: 'order'; order: Order }
  | { kind: 'catering'; request: CateringRequest }
  | { kind: 'agelgil'; request: AgelgilConfirmation }
  | { kind: 'baltina'; request: BaltinaConfirmation }
  | { kind: 'drinks'; request: BaltinaConfirmation }
  | { kind: 'festival'; request: FestivalConfirmation }
  | undefined

export default function ConfirmationPage() {
  const { state, search } = useLocation()
  const data = state as ConfirmationState
  const telegram = isTelegramWebApp(search)

  if (!data) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-cream px-4 pt-20">
        <div className="text-center">
          <h1 className="heading-display text-3xl uppercase text-gray-900">
            Nothing to confirm
          </h1>
          <p className="mt-3 text-gray-500">
            This page appears after you place an order or booking request.
          </p>
          {!telegram && <Link to="/" className="btn-primary mt-6">Back to home</Link>}
        </div>
      </section>
    )
  }

  const isOrder = data.kind === 'order'
  const isAgelgil = data.kind === 'agelgil'
  const isBaltina = data.kind === 'baltina'
  const isDrinks = data.kind === 'drinks'
  const isFestival = data.kind === 'festival'
  const reference = isOrder
    ? data.order.reference
    : data.request.reference

  const secondaryTo = isOrder
    ? '/traditional-drinks'
    : isAgelgil
      ? '/agelgil'
      : isBaltina
        ? '/baltina'
        : isDrinks
          ? '/traditional-drinks'
          : isFestival
            ? '/festival-package'
            : '/catering'
  const secondaryLabel = isOrder
    ? 'Continue shopping'
    : isAgelgil
      ? 'Back to Agelgil'
      : isBaltina
        ? 'Back to Baltina'
        : isDrinks
          ? 'Back to Drinks'
          : isFestival
            ? 'Back to Festival'
            : 'Back to catering'
  const preservedSearch = new URLSearchParams(search).toString()
  const secondaryHref = telegram && preservedSearch ? `${secondaryTo}?${preservedSearch}` : secondaryTo

  return (
    <section className="flex min-h-screen items-center justify-center bg-burgundy px-4 pb-16 pt-28">
      <div className="w-full max-w-xl rounded-[2rem] bg-cream p-8 text-center shadow-2xl sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-brand/15">
          <CheckCircle2 className="h-11 w-11 text-green-brand" />
        </div>

        <h1 className="heading-display mt-6 text-3xl uppercase text-gray-900 sm:text-4xl">
          {isOrder ? 'Order received!' : 'Request received!'}
        </h1>

        <p className="mt-3 text-gray-500">
          {isOrder
            ? 'Thank you for your order. Our kitchen is already on it.'
            : isAgelgil
              ? 'Thank you! Your Agelgil order is in. We’ll confirm shortly.'
              : isBaltina
                ? 'Thank you! Your Baltina order is in. We’ll confirm shortly.'
                : isDrinks
                  ? 'Thank you! Your drinks order is in. We’ll confirm shortly.'
                  : isFestival
                    ? 'Thank you! Your Festival package order is in. We’ll confirm shortly.'
                    : 'Thank you! Your catering request is in. Our team will reach out shortly to plan the details.'}
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm shadow-sm">
          <span className="text-gray-400">Reference</span>
          <span className="font-display text-base font-bold text-burgundy">
            {reference}
          </span>
        </div>

        {(data.kind === 'baltina' || data.kind === 'drinks') && (
          <div className="mt-8 space-y-3 rounded-2xl bg-white p-6 text-left text-sm shadow-sm">
            {data.request.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3">
                <span className="text-gray-500">
                  {item.name} × {item.qty} {item.unit}
                </span>
                <span className="font-medium text-gray-900">
                  {formatPrice(item.lineTotal)}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-gray-100 pt-3">
              <span className="text-gray-500">Total</span>
              <span className="font-display text-lg font-bold text-gray-900">
                {formatPrice(data.request.grandTotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fulfillment</span>
              <span className="font-medium capitalize text-gray-900">
                {data.request.deliveryMethod}
              </span>
            </div>
          </div>
        )}

        {data.kind === 'festival' && (
          <div className="mt-8 space-y-3 rounded-2xl bg-white p-6 text-left text-sm shadow-sm">
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Package</span>
              <span className="text-right font-medium text-gray-900">
                {data.request.packageName}
                {data.request.qty > 1 ? ` × ${data.request.qty}` : ''}
              </span>
            </div>
            {data.request.drinkChoice && (
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Drink</span>
                <span className="font-medium capitalize text-gray-900">
                  {data.request.drinkChoice}
                </span>
              </div>
            )}
            <ul className="space-y-1 border-t border-gray-100 pt-3 text-gray-500">
              {data.request.includedItems.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-gray-100 pt-3">
              <span className="text-gray-500">Total</span>
              <span className="font-display text-lg font-bold text-gray-900">
                {formatPrice(data.request.grandTotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fulfillment</span>
              <span className="font-medium capitalize text-gray-900">
                {data.request.deliveryMethod}
              </span>
            </div>
          </div>
        )}

        {data.kind === 'agelgil' && (
          <div className="mt-8 space-y-3 rounded-2xl bg-white p-6 text-left text-sm shadow-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Guests</span>
              <span className="font-medium text-gray-900">{data.request.guests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Packages</span>
              <span className="max-w-[60%] text-right font-medium text-gray-900">
                {formatComboLabel(data.request.combo)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-display text-lg font-bold text-gray-900">
                {formatPrice(data.request.grandTotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fulfillment</span>
              <span className="font-medium capitalize text-gray-900">
                {data.request.deliveryMethod}
              </span>
            </div>
          </div>
        )}

        {data.kind === 'catering' && (
          <div className="mt-8 space-y-3 rounded-2xl bg-white p-6 text-left text-sm shadow-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Guests</span>
              <span className="font-medium text-gray-900">{data.request.guests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-display text-lg font-bold text-gray-900">
                {formatPrice(data.request.totalPrice)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fulfillment</span>
              <span className="font-medium capitalize text-gray-900">
                {data.request.deliveryMethod}
              </span>
            </div>
          </div>
        )}

        {isOrder && (
          <div className="mt-8 space-y-3 rounded-2xl bg-white p-6 text-left text-sm shadow-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-display text-lg font-bold text-gray-900">
                {formatPrice(data.order.total, data.order.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fulfillment</span>
              <span className="font-medium capitalize text-gray-900">
                {data.order.fulfillment}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment</span>
              <span className="font-medium text-gray-900">
                {data.order.payment === 'chapa' ? 'Chapa' : 'Bank transfer'}
              </span>
            </div>
            {data.order.paymentStatus === 'pending_verification' && (
              <p className="flex items-center gap-2 rounded-xl bg-yellow-brand/15 px-3 py-2 text-xs text-yellow-dark">
                <Clock className="h-4 w-4" />
                Payment pending verification — we&apos;ll confirm once your transfer
                is received.
              </p>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <a
            href={`tel:${restaurant.phone}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-burgundy hover:underline"
          >
            <Phone className="h-4 w-4" />
            Questions? Call us at {restaurant.phone}
          </a>
          <div className="flex flex-wrap justify-center gap-3">
            {!telegram && <Link to="/" className="btn-primary">Back to home</Link>}
            <Link
              to={secondaryHref}
              className="inline-flex items-center gap-2 rounded-full border border-burgundy/30 px-8 py-3.5 font-semibold text-burgundy transition-colors hover:bg-burgundy/5"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
