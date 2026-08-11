import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { requestsApi } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STATUSES = ['NEW', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED'] as const
const FOLLOW_UP_STATUSES = [
  'NONE',
  'SATISFIED',
  'WAITING_FEEDBACK',
  'FOLLOW_UP_REQUIRED',
  'ISSUE_REPORTED',
] as const

const FOLLOW_UP_STYLES: Record<string, string> = {
  NONE: 'bg-muted text-brown-muted ring-border',
  SATISFIED: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  WAITING_FEEDBACK: 'bg-amber-100 text-amber-800 ring-amber-200',
  FOLLOW_UP_REQUIRED: 'bg-yellow-brand/15 text-yellow-dark ring-yellow-brand/30',
  ISSUE_REPORTED: 'bg-crimson/10 text-crimson ring-crimson/25',
}

function formatFollowUpStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function Field({ label, value }: { label: string; value: unknown }) {
  if (value == null || value === '') return null
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-brown/50">{label}</p>
      <p className="text-sm">{String(value)}</p>
    </div>
  )
}

function PayloadView({ payload }: { payload: unknown }) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload ? <p className="text-sm">{String(payload)}</p> : null
  }
  const entries = Object.entries(payload as Record<string, unknown>).filter(
    ([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0),
  )
  if (!entries.length) return null
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <Field
          key={key}
          label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
          value={
            typeof value === 'object'
              ? JSON.stringify(value, null, 2)
              : value
          }
        />
      ))}
    </div>
  )
}

export function RequestDetailPage() {
  const { id = '' } = useParams()
  const [request, setRequest] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [followUpStatus, setFollowUpStatus] = useState('NONE')
  const [followUpNote, setFollowUpNote] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingFollowUp, setSavingFollowUp] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = (await requestsApi.get(id)) as Record<string, unknown>
      setRequest(data)
      setStatus(String(data.status || 'NEW'))
      setFollowUpStatus(String(data.followUpStatus || 'NONE'))
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
        followUpStatus,
        followUpNote: followUpNote || undefined,
      })
      toast.success('Follow-up updated')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed')
    } finally {
      setSavingFollowUp(false)
    }
  }

  if (loading) return <Skeleton className="h-96" />
  if (!request) return <p className="text-brown/60">Request not found.</p>

  const service = request.service as Record<string, unknown> | undefined
  const history = Array.isArray(request.history) ? request.history : []
  const assignedTo = request.assignedTo as Record<string, unknown> | undefined

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={`Request ${String(request.reference || id)}`}
        description={service?.name ? String(service.name) : 'Service request details'}
      />
      <Link to="/requests" className="text-sm text-burgundy hover:underline">
        ← Back to requests
      </Link>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{String(request.status)}</Badge>
        {request.followUpStatus && request.followUpStatus !== 'NONE' ? (
          <Badge variant="secondary">{String(request.followUpStatus)}</Badge>
        ) : null}
        <Badge variant="outline">{String(request.source || 'WEBSITE')}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Field label="Name" value={request.customerName} />
            <Field label="Phone" value={request.phone} />
            <Field label="Email" value={request.email} />
            <Field label="Telegram" value={request.telegram} />
            <Field label="Created" value={formatDate(String(request.createdAt || ''))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Field label="Service" value={service?.name} />
            <Field label="Delivery method" value={request.deliveryMethod} />
            <Field label="Location" value={request.location} />
            <Field label="Preferred date" value={request.preferredDate ? formatDate(String(request.preferredDate)) : null} />
            <Field label="Preferred time" value={request.preferredTime} />
            <Field label="Guests" value={request.guests} />
            <Field label="Package summary" value={request.packageSummary} />
            <Field
              label="Total"
              value={
                request.totalAmount != null
                  ? `${request.totalAmount} ${request.currency || 'ETB'}`
                  : null
              }
            />
            <Field label="Notes" value={request.notes} />
            <Field label="Assigned to" value={assignedTo?.name} />
          </CardContent>
        </Card>
      </div>

      {request.payload ? (
        <Card>
          <CardHeader>
            <CardTitle>Additional details</CardTitle>
          </CardHeader>
          <CardContent>
            <PayloadView payload={request.payload} />
          </CardContent>
        </Card>
      ) : null}

      {history.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Status history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.map((event) => {
              const row = event as Record<string, unknown>
              const byAdmin = row.byAdmin as Record<string, unknown> | undefined
              return (
                <div key={String(row.id)} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{String(row.status)}</span>
                    <span className="text-xs text-brown/50">{formatDate(String(row.createdAt || ''))}</span>
                  </div>
                  {row.note ? <p className="mt-1 text-brown/70">{String(row.note)}</p> : null}
                  {byAdmin?.name ? <p className="mt-1 text-xs text-brown/50">By {String(byAdmin.name)}</p> : null}
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Update status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
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
            <div className="space-y-1.5 md:col-span-2">
              <Label>Internal note (optional)</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for status history" />
            </div>
          </div>
          <Button onClick={saveStatus} disabled={savingStatus}>
            {savingStatus ? 'Updating…' : 'Update status'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Follow-up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Label className="flex items-center gap-2">
              Follow-up status
              <span
                className={[
                  'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
                  FOLLOW_UP_STYLES[followUpStatus] ?? FOLLOW_UP_STYLES.NONE,
                ].join(' ')}
              >
                {formatFollowUpStatus(followUpStatus)}
              </span>
            </Label>
            <p className="text-xs text-brown/60">Set what happened and add a short internal note.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Select value={followUpStatus} onValueChange={setFollowUpStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLLOW_UP_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {formatFollowUpStatus(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Follow-up note</Label>
              <Textarea
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                placeholder="Example: Customer confirmed delivery, no issues reported."
                className="min-h-[120px]"
              />
              <p className="text-xs text-brown/60">Tip: keep it short—this is for tracking and internal follow-up.</p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={savingFollowUp}
              onClick={() => {
                setFollowUpStatus(String(request?.followUpStatus || 'NONE'))
                setFollowUpNote(String(request?.followUpNote || ''))
              }}
            >
              Reset
            </Button>

            <Button onClick={saveFollowUp} disabled={savingFollowUp}>
              {savingFollowUp ? 'Saving…' : 'Save follow-up'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
