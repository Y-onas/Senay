import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { CMS_BASE } from '@/config/cms'
import { cmsApi } from '@/services/cmsApi'

const STATUSES = [
  'NEW',
  'CONFIRMED',
  'IN_PROGRESS',
  'READY',
  'COMPLETED',
  'CANCELLED',
] as const

const FOLLOW_UP = [
  'NONE',
  'SATISFIED',
  'WAITING_FEEDBACK',
  'FOLLOW_UP_REQUIRED',
  'ISSUE_REPORTED',
] as const

export default function CmsRequestDetailPage() {
  const { id } = useParams()
  const [row, setRow] = useState<Record<string, unknown> | null>(null)
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [followUpStatus, setFollowUpStatus] = useState('NONE')
  const [followUpNote, setFollowUpNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    if (!id) return
    cmsApi
      .request(id)
      .then((data) => {
        setRow(data)
        setStatus(String(data.status))
        setFollowUpStatus(String(data.followUpStatus ?? 'NONE'))
        setFollowUpNote(String(data.followUpNote ?? ''))
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Not found'))
  }

  useEffect(load, [id])

  const save = async () => {
    if (!id) return
    setSaving(true)
    try {
      await cmsApi.updateStatus(id, status, note || undefined)
      setNote('')
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const saveFollowUp = async () => {
    if (!id) return
    setSaving(true)
    try {
      await cmsApi.updateFollowUp(id, followUpStatus, followUpNote || undefined)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (error && !row) return <p className="text-red-600">{error}</p>
  if (!row) return <p className="text-gray-500">Loading…</p>

  const payload = (row.payload ?? {}) as Record<string, unknown>
  const history = (row.history as Array<Record<string, unknown>>) ?? []
  const service = row.service as { name?: string } | undefined

  return (
    <div className="space-y-6">
      <div>
        <Link to={`${CMS_BASE}/requests`} className="text-sm text-burgundy">
          ← Back to requests
        </Link>
        <h1 className="mt-2 font-display text-3xl uppercase">{String(row.reference)}</h1>
        <p className="text-sm text-gray-500">
          {String(row.customerName)} · {String(row.phone)} · {service?.name}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-burgundy/10 bg-white p-5">
          <h2 className="font-display text-lg uppercase">Details</h2>
          <dl className="grid gap-2 text-sm">
            <Row label="Status" value={String(row.status)} />
            <Row label="Delivery" value={String(row.deliveryMethod ?? '—')} />
            <Row label="Location" value={String(row.location ?? '—')} />
            <Row label="Date" value={String(row.preferredDate ?? '—')} />
            <Row label="Time" value={String(row.preferredTime ?? '—')} />
            <Row label="Guests" value={String(row.guests ?? '—')} />
            <Row label="Package" value={String(row.packageSummary ?? '—')} />
            <Row label="Total" value={row.totalAmount != null ? `${row.totalAmount} ETB` : '—'} />
            <Row label="Notes" value={String(row.notes ?? '—')} />
          </dl>

          <h3 className="pt-2 text-xs font-semibold uppercase text-gray-500">
            Form payload
          </h3>
          <pre className="max-h-80 overflow-auto rounded-xl bg-gray-50 p-3 text-xs">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-burgundy/10 bg-white p-5">
            <h2 className="font-display text-lg uppercase">Update status</h2>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
              className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              rows={3}
            />
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="btn-primary mt-3 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save status'}
            </button>
          </div>

          <div className="rounded-2xl border border-burgundy/10 bg-white p-5">
            <h2 className="font-display text-lg uppercase">Customer follow-up</h2>
            <select
              value={followUpStatus}
              onChange={(e) => setFollowUpStatus(e.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              {FOLLOW_UP.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <textarea
              value={followUpNote}
              onChange={(e) => setFollowUpNote(e.target.value)}
              placeholder="Follow-up notes"
              className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              rows={3}
            />
            <button
              type="button"
              onClick={saveFollowUp}
              disabled={saving}
              className="btn-primary mt-3 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save follow-up'}
            </button>
          </div>

          <div className="rounded-2xl border border-burgundy/10 bg-white p-5">
            <h2 className="font-display text-lg uppercase">History</h2>
            <ul className="mt-3 space-y-3">
              {history.map((h) => (
                <li key={String(h.id)} className="border-l-2 border-burgundy/30 pl-3 text-sm">
                  <p className="font-medium">{String(h.status)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(String(h.createdAt)).toLocaleString()}
                    {(h.byAdmin as { name?: string } | undefined)?.name
                      ? ` · ${(h.byAdmin as { name: string }).name}`
                      : ''}
                  </p>
                  {h.note ? <p className="text-xs text-gray-600">{String(h.note)}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-burgundy/5 py-1.5">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
