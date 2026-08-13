import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Cake,
  Calendar,
  Check,
  ChevronDown,
  Circle,
  Clock,
  Coffee,
  FileText,
  Leaf,
  Lock,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Printer,
  Truck,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import { requestsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatDate } from '@/lib/utils'
import { RequestStatusBadge } from '@/components/common/RequestStatusBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STATUSES = ['NEW', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED'] as const

type TabId = 'order' | 'pricing' | 'notes'
type IconTone = 'green' | 'pink' | 'gold' | 'brown' | 'burgundy' | 'blue' | 'teal' | 'orange' | 'sky'

const TONE_CLASS: Record<IconTone, string> = {
  green: 'bg-green-brand/15 text-green-brand',
  pink: 'bg-crimson/12 text-crimson-light',
  gold: 'bg-gold/25 text-gold-dark',
  brown: 'bg-[#8B5E3C]/12 text-[#8B5E3C]',
  burgundy: 'bg-burgundy/10 text-burgundy',
  blue: 'bg-sky-100 text-sky-600',
  teal: 'bg-teal-100 text-teal-700',
  orange: 'bg-yellow-brand/20 text-yellow-dark',
  sky: 'bg-sky-50 text-sky-600',
}

type LucideIcon = ComponentType<{ className?: string }>

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function str(value: unknown, fallback = '—') {
  if (value == null || value === '') return fallback
  return String(value)
}

function formatMoney(value: unknown, currency = 'ETB') {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return `${value} ${currency}`
  return `${n.toLocaleString()} ${currency}`
}

function formatShortDate(value: unknown) {
  if (!value) return '—'
  const raw = String(value)
  const dateOnly = /^\d{4}-\d{2}-\d{2}/.exec(raw)?.[0]
  const d = dateOnly
    ? new Date(`${dateOnly}T12:00:00+03:00`)
    : new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString('en-GB', {
    timeZone: 'Africa/Addis_Ababa',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function relativeFromNow(value: unknown) {
  if (!value) return ''
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return ''
  const days = Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function ColorIcon({
  icon: Icon,
  tone,
  size = 'md',
}: {
  icon: LucideIcon
  tone: IconTone
  size?: 'sm' | 'md'
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl',
        size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
        TONE_CLASS[tone],
      )}
    >
      <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
    </span>
  )
}

function EventField({
  icon,
  tone,
  label,
  value,
}: {
  icon: LucideIcon
  tone: IconTone
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <ColorIcon icon={icon} tone={tone} />
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-brown/45">{label}</p>
        <p className="text-sm font-semibold capitalize leading-snug text-brown break-words">{value}</p>
      </div>
    </div>
  )
}

function QuickStat({
  icon,
  tone,
  label,
  value,
}: {
  icon: LucideIcon
  tone: IconTone
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2">
      <ColorIcon icon={icon} tone={tone} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium leading-tight text-brown/45">{label}</p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-brown break-words capitalize">
          {value}
        </p>
      </div>
    </div>
  )
}

export function RequestDetailPage() {
  const { id = '' } = useParams()
  const [request, setRequest] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabId>('order')
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [followUpNote, setFollowUpNote] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingFollowUp, setSavingFollowUp] = useState(false)
  const [showFullHistory, setShowFullHistory] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = (await requestsApi.get(id)) as Record<string, unknown>
      setRequest(data)
      setStatus(String(data.status || 'NEW'))
      setFollowUpNote(String(data.followUpNote || ''))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const saveStatus = async () => {
    setSavingStatus(true)
    try {
      await requestsApi.updateStatus(id, { status, note: note || undefined })
      toast.success('Status updated')
      await load()
      setNote('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed')
    } finally {
      setSavingStatus(false)
    }
  }

  const saveFollowUp = async () => {
    setSavingFollowUp(true)
    try {
      await requestsApi.updateFollowUp(id, {
        followUpStatus: String(request?.followUpStatus || 'NONE'),
        followUpNote: followUpNote || undefined,
      })
      toast.success('Note saved')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed')
    } finally {
      setSavingFollowUp(false)
    }
  }

  const markCompleted = async () => {
    setSavingStatus(true)
    try {
      await requestsApi.updateStatus(id, { status: 'COMPLETED' })
      toast.success('Marked as completed')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed')
    } finally {
      setSavingStatus(false)
    }
  }

  const cancelRequest = async () => {
    setSavingStatus(true)
    try {
      await requestsApi.updateStatus(id, { status: 'CANCELLED', note: 'Cancelled from detail page' })
      toast.success('Request cancelled')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed')
    } finally {
      setSavingStatus(false)
    }
  }

  const payload = useMemo(() => asRecord(request?.payload), [request])

  if (loading) return <Skeleton className="h-96" />
  if (!request) return <p className="text-brown/60">Request not found.</p>

  const service = asRecord(request.service)
  const history = Array.isArray(request.history) ? request.history : []
  const currentStatus = String(request.status || 'NEW')
  const reference = str(request.reference || id)
  const customerName = str(request.customerName, 'Customer')
  const phone = str(request.phone, '')
  const currency = str(request.currency, 'ETB')
  const guests = str(payload.guests ?? request.guests, '—')
  const delivery = str(payload.deliveryMethod ?? request.deliveryMethod, '—')
  const location = str(payload.location ?? request.location, '—')
  const preferredDate = payload.date ?? request.preferredDate
  const preferredTime = str(payload.time ?? request.preferredTime, '—')
  const packageSummary = str(request.packageSummary ?? payload.packageId, '—')
  const totalAmount = request.totalAmount ?? payload.totalPrice
  const pricePerGuest = payload.pricePerGuest
  const mealType = str(payload.mealType, '—')
  const eventType = str(payload.eventType, '—')
  const packageId = str(payload.packageId, '—')
  const beverage = str(payload.beverageOption, '—')
  const specialInstructions = str(payload.specialInstructions ?? request.notes, '')
  const phoneDigits = phone.replace(/[^\d+]/g, '')

  const nextSteps = [
    { label: 'Review request details', done: true },
    { label: 'Confirm availability & pricing', done: currentStatus !== 'NEW' },
    { label: 'Contact customer', done: ['IN_PROGRESS', 'READY', 'COMPLETED'].includes(currentStatus) },
    { label: 'Send confirmation', done: ['READY', 'COMPLETED'].includes(currentStatus) },
  ]

  const tabs: { id: TabId; label: string }[] = [
    { id: 'order', label: 'Order Details' },
    { id: 'pricing', label: 'Package & Pricing' },
    { id: 'notes', label: 'Notes & Files' },
  ]

  const card =
    'rounded-2xl border border-border/70 bg-white shadow-[0_8px_28px_-18px_rgba(44,26,20,0.28)]'

  return (
    <div className="animate-fade-in space-y-4 pb-8">
      {/* Header */}
      <div className="space-y-3">
        <Link
          to="/requests"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-burgundy/80 hover:text-burgundy hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to requests
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-burgundy sm:text-[1.75rem]">
                Request {reference}
              </h1>
              <RequestStatusBadge status={currentStatus} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-brown/55">
              <span className="inline-flex items-center gap-1.5 font-medium text-brown">
                <UtensilsCrossed className="h-3.5 w-3.5 text-green-brand" />
                {str(service.name, 'Service')}
              </span>
              <span className="text-brown/25">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-sky-600" />
                Received on {formatDate(String(request.createdAt || ''))}
                {relativeFromNow(request.createdAt) ? (
                  <span className="text-brown/40">({relativeFromNow(request.createdAt)})</span>
                ) : null}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="gap-2 bg-white" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print / Share
            </Button>
            <Button type="button" variant="outline" className="gap-2 bg-white" disabled>
              Actions
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Top summary: Customer | Quick stats | Package+Total */}
      <div className="grid gap-3 lg:grid-cols-12">
        <div className={cn(card, 'p-4 lg:col-span-3')}>
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-burgundy font-display text-lg font-bold text-cream">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-display text-base font-bold text-burgundy">{customerName}</p>
                <span className="rounded-full bg-green-brand/15 px-2 py-0.5 text-[10px] font-semibold text-green-brand">
                  New Customer
                </span>
              </div>
              {phone ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-brown">{phone}</span>
                  <a
                    href={`tel:${phoneDigits}`}
                    className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
                  >
                    <Phone className="h-3 w-3" />
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${phoneDigits.replace(/^\+/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-green-brand/12 px-2 py-0.5 text-[11px] font-semibold text-green-brand hover:bg-green-brand/20"
                  >
                    <MessageCircle className="h-3 w-3" />
                    WhatsApp
                  </a>
                </div>
              ) : null}
              <p className="mt-2 text-xs text-brown/45">
                Created {formatDate(String(request.createdAt || ''))}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(card, 'py-1 lg:col-span-6')}>
          <div className="grid w-full grid-cols-1 divide-y divide-border/50 sm:grid-cols-2 sm:divide-y-0 md:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-border/60">
            <QuickStat icon={UtensilsCrossed} tone="green" label="Service" value={str(service.name)} />
            <QuickStat icon={Truck} tone="burgundy" label="Delivery" value={delivery} />
            <QuickStat
              icon={Calendar}
              tone="blue"
              label="Preferred Date"
              value={formatShortDate(preferredDate)}
            />
            <QuickStat icon={Clock} tone="teal" label="Preferred Time" value={preferredTime} />
            <QuickStat
              icon={Users}
              tone="gold"
              label="Guests"
              value={guests === '—' ? '—' : `${guests} people`}
            />
          </div>
        </div>

        <div className={cn(card, 'flex items-center justify-between gap-4 p-4 lg:col-span-3')}>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-brown/45">Package Summary</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-green-brand break-words">
              {packageSummary}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-medium text-brown/45">Total Amount</p>
            <p className="mt-0.5 font-display text-2xl font-bold text-green-brand">
              {formatMoney(totalAmount, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Main + sidebar */}
      <div className="grid items-start gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="flex flex-wrap gap-1 border-b border-border/70">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'relative px-3 py-2.5 text-sm font-semibold transition-colors',
                  tab === item.id ? 'text-burgundy' : 'text-brown/45 hover:text-brown',
                )}
              >
                {item.label}
                {tab === item.id ? (
                  <span className="absolute inset-x-1 -bottom-px h-[2px] rounded-full bg-burgundy" />
                ) : null}
              </button>
            ))}
          </div>

          {tab === 'order' ? (
            <div className="space-y-4">
              <div className={cn(card, 'p-5')}>
                <h2 className="mb-4 font-display text-lg font-bold text-burgundy">Event Information</h2>
                <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <EventField icon={Leaf} tone="green" label="Meal Type" value={mealType} />
                  <EventField icon={Cake} tone="pink" label="Event Type" value={eventType} />
                  <EventField icon={Package} tone="gold" label="Package ID" value={packageId} />
                  <EventField icon={Coffee} tone="brown" label="Beverage Option" value={beverage} />
                  <EventField icon={Truck} tone="burgundy" label="Delivery Method" value={delivery} />
                  <EventField icon={MapPin} tone="blue" label="Location" value={location} />
                  <EventField icon={Calendar} tone="sky" label="Date" value={formatShortDate(preferredDate)} />
                  <EventField icon={Clock} tone="teal" label="Time" value={preferredTime} />
                  <EventField
                    icon={Users}
                    tone="blue"
                    label="Guests"
                    value={guests === '—' ? '—' : `${guests} people`}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className={cn(card, 'p-5')}>
                  <h3 className="mb-4 font-display text-base font-bold text-burgundy">Pricing Details</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[11px] text-brown/45">Price Per Guest</p>
                      <p className="mt-1 text-sm font-semibold text-brown">
                        {formatMoney(pricePerGuest, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-brown/45">Guests</p>
                      <p className="mt-1 text-sm font-semibold text-brown">{guests}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-brown/45">Total Price</p>
                      <p className="mt-1 text-sm font-bold text-green-brand">
                        {formatMoney(totalAmount, currency)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-yellow-brand/35 bg-yellow-brand/10 p-5 shadow-[0_8px_28px_-18px_rgba(44,26,20,0.18)]">
                  <h3 className="mb-2 flex items-center gap-2 font-display text-base font-bold text-burgundy">
                    <ColorIcon icon={FileText} tone="orange" size="sm" />
                    Special Instructions
                  </h3>
                  <p className="text-sm leading-relaxed text-brown">
                    {specialInstructions || 'No special instructions.'}
                  </p>
                </div>
              </div>

              <div className={cn(card, 'p-5')}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-burgundy">Status Timeline</h3>
                  {history.length > 2 ? (
                    <button
                      type="button"
                      className="text-sm font-semibold text-burgundy hover:underline"
                      onClick={() => setShowFullHistory((v) => !v)}
                    >
                      {showFullHistory ? 'Hide' : 'View full history'}
                    </button>
                  ) : null}
                </div>
                <div className="space-y-3">
                  {(showFullHistory ? history : history.slice(0, 3)).map((event, index) => {
                    const row = asRecord(event)
                    return (
                      <div key={str(row.id, String(index))} className="flex gap-3">
                        <div className="flex flex-col items-center pt-1">
                          <span
                            className={cn(
                              'h-2.5 w-2.5 rounded-full',
                              index === 0 ? 'bg-green-brand' : 'bg-burgundy/40',
                            )}
                          />
                          {index <
                          (showFullHistory ? history.length : Math.min(history.length, 3)) - 1 ? (
                            <span className="mt-1 w-px flex-1 bg-border" />
                          ) : null}
                        </div>
                        <div className="pb-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-brown">
                              {str(row.status).replace(/_/g, ' ')}
                            </p>
                            {index === 0 ? (
                              <span className="rounded-full bg-green-brand/15 px-2 py-0.5 text-[10px] font-semibold text-green-brand">
                                Current
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-brown/45">
                            {formatDate(String(row.createdAt || ''))}
                          </p>
                          {row.note ? (
                            <p className="mt-1 text-xs text-brown/70">{str(row.note)}</p>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                  {!history.length ? <p className="text-sm text-brown/50">No history yet.</p> : null}
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'pricing' ? (
            <div className={cn(card, 'p-5')}>
              <h2 className="mb-4 font-display text-lg font-bold text-burgundy">Package & Pricing</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <EventField icon={Package} tone="gold" label="Package Summary" value={packageSummary} />
                <EventField icon={Package} tone="brown" label="Package ID" value={packageId} />
                <EventField icon={Leaf} tone="green" label="Meal Type" value={mealType} />
                <EventField icon={Coffee} tone="orange" label="Beverage Option" value={beverage} />
                <EventField
                  icon={Users}
                  tone="blue"
                  label="Price Per Guest"
                  value={formatMoney(pricePerGuest, currency)}
                />
                <EventField icon={Users} tone="teal" label="Guests" value={guests} />
              </div>
              <div className="mt-5 rounded-xl bg-green-brand/10 px-4 py-3">
                <p className="text-xs font-medium text-brown/50">Total</p>
                <p className="font-display text-2xl font-bold text-green-brand">
                  {formatMoney(totalAmount, currency)}
                </p>
              </div>
            </div>
          ) : null}

          {tab === 'notes' ? (
            <div className={cn(card, 'p-5')}>
              <h2 className="mb-3 font-display text-lg font-bold text-burgundy">Notes & Files</h2>
              <p className="text-sm text-brown/75">
                {specialInstructions || str(request.notes, 'No notes attached to this request.')}
              </p>
              <p className="mt-4 text-xs text-brown/40">File attachments are not available yet.</p>
            </div>
          ) : null}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4 lg:col-span-4">
          <div className={cn(card, 'p-4')}>
            <h3 className="font-display text-base font-bold text-burgundy">Status & Next Step</h3>
            <div className="mt-3 rounded-xl bg-yellow-brand/15 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-yellow-dark">
                Current Status
              </p>
              <p className="mt-0.5 text-sm font-bold text-brown">
                {currentStatus.replace(/_/g, ' ')} — Request received
              </p>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brown/40">
              What needs to be done next?
            </p>
            <ul className="mt-2.5 space-y-2.5">
              {nextSteps.map((step) => (
                <li key={step.label} className="flex items-center gap-2.5 text-sm">
                  {step.done ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-burgundy text-cream">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-brown/25" />
                  )}
                  <span className={step.done ? 'font-medium text-brown' : 'text-brown/60'}>
                    {step.label}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 rounded-lg border border-yellow-brand/30 bg-yellow-brand/10 px-3 py-2 text-xs text-yellow-dark">
              Tip: Confirm guest count and delivery location before marking as confirmed.
            </div>
          </div>

          <div className={cn(card, 'p-4')}>
            <h3 className="font-display text-base font-bold text-burgundy">Update Status</h3>
            <div className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Internal note (optional)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note for status history"
                  className="min-h-[84px]"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingStatus}
                  onClick={() => {
                    setStatus(currentStatus)
                    setNote('')
                  }}
                >
                  Reset
                </Button>
                <Button onClick={saveStatus} disabled={savingStatus}>
                  {savingStatus ? 'Updating…' : 'Update Status'}
                </Button>
              </div>
            </div>
          </div>

          <div className={cn(card, 'p-4')}>
            <h3 className="font-display text-base font-bold text-burgundy">Follow-up / Internal Note</h3>
            <Textarea
              value={followUpNote}
              onChange={(e) => setFollowUpNote(e.target.value)}
              placeholder="Write internal note here…"
              className="mt-3 min-h-[110px]"
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-[11px] text-brown/45">
                <Lock className="h-3 w-3" />
                Visible only to admin team
              </p>
              <Button size="sm" onClick={saveFollowUp} disabled={savingFollowUp}>
                {savingFollowUp ? 'Saving…' : 'Save Note'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/requests"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-burgundy hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to requests
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-crimson/40 text-crimson hover:bg-crimson/10"
            disabled={savingStatus || currentStatus === 'CANCELLED'}
            onClick={cancelRequest}
          >
            Cancel Request
          </Button>
          <Button
            type="button"
            className="gap-2"
            disabled={savingStatus || currentStatus === 'COMPLETED'}
            onClick={markCompleted}
          >
            <Check className="h-4 w-4" />
            Mark as Completed
          </Button>
        </div>
      </div>
    </div>
  )
}
