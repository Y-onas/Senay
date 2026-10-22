import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { CMS_BASE } from '@/config/cms'
import { cmsApi } from '@/services/cmsApi'

export default function CmsOverviewPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    cmsApi
      .overview()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [])

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <p className="text-gray-500">Loading overview…</p>

  const cards = [
    { label: 'Total requests', value: data.total },
    { label: 'New', value: data.newCount },
    { label: 'In progress', value: data.inProgress },
    { label: 'Completed', value: data.completed },
    { label: 'Cancelled', value: data.cancelled },
  ]

  const recent = (data.recent as Array<Record<string, unknown>>) ?? []

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-burgundy/60">Dashboard</p>
        <h1 className="font-display text-3xl uppercase">Overview</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-burgundy/10 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">{c.label}</p>
            <p className="mt-2 font-display text-3xl text-burgundy">{String(c.value ?? 0)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-burgundy/10 bg-white">
        <div className="flex items-center justify-between border-b border-burgundy/5 px-5 py-4">
          <h2 className="font-display text-lg uppercase">Recent requests</h2>
          <Link to={`${CMS_BASE}/requests`} className="text-sm text-burgundy">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-burgundy/5">
          {recent.map((r) => (
            <li key={String(r.id)}>
              <Link
                to={`${CMS_BASE}/requests/${r.id}`}
                className="flex items-center justify-between px-5 py-3 text-sm hover:bg-burgundy/[0.03]"
              >
                <div>
                  <p className="font-medium">{String(r.customerName)}</p>
                  <p className="text-xs text-gray-500">
                    {String(r.reference)} ·{' '}
                    {String((r.service as { name?: string } | undefined)?.name ?? '')}
                  </p>
                </div>
                <span className="rounded-full bg-burgundy/10 px-2.5 py-0.5 text-xs text-burgundy">
                  {String(r.status)}
                </span>
              </Link>
            </li>
          ))}
          {!recent.length && (
            <li className="px-5 py-8 text-center text-sm text-gray-500">No requests yet</li>
          )}
        </ul>
      </div>
    </div>
  )
}
