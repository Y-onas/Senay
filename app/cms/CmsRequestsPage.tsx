import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Eye } from 'lucide-react'
import { CMS_BASE } from '@/config/cms'
import { cmsApi } from '@/services/cmsApi'
import { DataTable, StatusBadge, Toolbar } from './pages/cms-ui'

type Row = {
  id: string
  reference: string
  customerName: string
  phone: string
  status: string
  packageSummary?: string | null
  createdAt: string
  service?: { name: string; slug: string }
}

const STATUSES = ['', 'NEW', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED']

const statusVariant = (status: string) => {
  switch (status) {
    case 'NEW':
      return 'default'
    case 'CONFIRMED':
      return 'warning'
    case 'IN_PROGRESS':
      return 'warning'
    case 'READY':
      return 'warning'
    case 'COMPLETED':
      return 'success'
    case 'CANCELLED':
      return 'danger'
    default:
      return 'neutral'
  }
}

export default function CmsRequestsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [service, setService] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    cmsApi
      .requests({
        q: q || undefined,
        status: status || undefined,
        service: service || undefined,
      })
      .then((data) => setRows(data as Row[]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const services = useMemo(() => {
    const set = new Set(rows.map((r) => r.service?.slug).filter(Boolean))
    return Array.from(set) as string[]
  }, [rows])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-burgundy/60">Operations</p>
        <h1 className="font-display text-3xl uppercase">Requests</h1>
      </div>

      <Toolbar
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search name, phone, ref…"
      >
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s || 'all'} value={s}>
              {s || 'All statuses'}
            </option>
          ))}
        </select>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">All services</option>
          {['catering', 'baltina', 'agelgil', 'drinks', 'festival', ...services]
            .filter((v, i, a) => a.indexOf(v) === i)
            .map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
        </select>
        <button type="button" onClick={load} className="btn-primary">
          Filter
        </button>
      </Toolbar>

      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          {
            key: 'ref',
            header: 'Ref',
            width: '120px',
            cell: (r) => (
              <Link to={`${CMS_BASE}/requests/${r.id}`} className="font-medium text-burgundy hover:underline">
                {r.reference}
              </Link>
            ),
          },
          {
            key: 'customer',
            header: 'Customer',
            cell: (r) => (
              <div>
                <p className="font-medium">{r.customerName}</p>
                <p className="text-xs text-gray-500">{r.phone}</p>
              </div>
            ),
          },
          {
            key: 'service',
            header: 'Service',
            cell: (r) => <p>{r.service?.name ?? '—'}</p>,
          },
          {
            key: 'status',
            header: 'Status',
            width: '120px',
            cell: (r) => <StatusBadge variant={statusVariant(r.status)}>{r.status.replace(/_/g, ' ')}</StatusBadge>,
          },
          {
            key: 'created',
            header: 'Created',
            width: '160px',
            cell: (r) => <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</p>,
          },
        ]}
        action={(r) => (
          <Link
            to={`${CMS_BASE}/requests/${r.id}`}
            className="inline-flex items-center gap-1 rounded-full bg-burgundy px-3 py-1.5 text-xs text-white hover:bg-burgundy-light"
          >
            <Eye className="h-3.5 w-3.5" /> View
          </Link>
        )}
      />
    </div>
  )
}
