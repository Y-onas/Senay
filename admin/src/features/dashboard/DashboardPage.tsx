import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Sparkles,
} from 'lucide-react'
import { overviewApi, type OverviewStats } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const statCards = [
  {
    label: 'Total requests',
    key: 'total' as const,
    icon: ClipboardList,
    accent: 'text-burgundy',
    iconBg: 'bg-burgundy/10 text-burgundy',
    bar: 'from-burgundy to-burgundy-light',
  },
  {
    label: 'New',
    key: 'newCount' as const,
    icon: Sparkles,
    accent: 'text-yellow-dark',
    iconBg: 'bg-yellow-brand/15 text-yellow-dark',
    bar: 'from-yellow-brand to-gold',
  },
  {
    label: 'In progress',
    key: 'inProgress' as const,
    icon: Activity,
    accent: 'text-green-brand',
    iconBg: 'bg-green-brand/12 text-green-brand',
    bar: 'from-green-brand to-green-brand',
  },
  {
    label: 'Completed',
    key: 'completed' as const,
    icon: CheckCircle2,
    accent: 'text-crimson',
    iconBg: 'bg-crimson/10 text-crimson',
    bar: 'from-crimson to-crimson-light',
  },
]

export function DashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    overviewApi
      .get()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (error) return <p className="text-destructive">{error}</p>

  const maxServiceCount = Math.max(1, ...(stats?.byService.map((row) => row.count) ?? [1]))

  return (
    <div className="animate-fade-in space-y-6">
      <div className="admin-hero px-6 py-7 sm:px-8 sm:py-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            background:
              'radial-gradient(600px 200px at 100% 0%, rgba(232,184,56,0.25), transparent 60%), radial-gradient(500px 220px at 0% 120%, rgba(147,31,29,0.35), transparent 60%)',
          }}
        />
        <div className="relative flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-yellow-brand/90">
            Welcome back
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Dashboard <span className="text-gradient-gold">Overview</span>
          </h1>
          <p className="max-w-xl text-sm text-cream/70">
            A snapshot of your website activity and incoming service requests.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="admin-stat-card group">
            <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', card.bar)} />
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-brown-muted">{card.label}</p>
                {loading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <p className={cn('font-display text-4xl font-bold leading-none', card.accent)}>
                    {stats?.[card.key] ?? 0}
                  </p>
                )}
              </div>
              <div
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105',
                  card.iconBg,
                )}
              >
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-burgundy/10 text-burgundy">
                <ClipboardList className="h-4 w-4" />
              </span>
              Requests by service
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : stats?.byService.length ? (
              <ul className="space-y-4">
                {stats.byService.map((row) => (
                  <li key={row.slug} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-brown">{row.service}</span>
                      <span className="text-sm font-bold text-burgundy">{row.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-yellow-brand to-gold transition-all duration-500"
                        style={{ width: `${Math.max(6, (row.count / maxServiceCount) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-brown-muted">No requests by service yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-brand/12 text-green-brand">
                <Activity className="h-4 w-4" />
              </span>
              Recent requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : stats?.recent.length ? (
              <ul className="-my-1 divide-y divide-border/60">
                {stats.recent.slice(0, 5).map((row) => (
                  <li
                    key={String(row.id)}
                    className="group flex items-center gap-3 rounded-lg px-1 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/requests/${row.id}`}
                        className="font-medium text-burgundy hover:underline"
                      >
                        {String(row.customerName || row.id)}
                      </Link>
                      <p className="text-xs text-brown-muted">
                        {formatDate(String(row.createdAt || ''))}
                      </p>
                    </div>
                    <span className="shrink-0 capitalize text-xs text-brown-muted">
                      {String(row.status || '')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-brown-muted">No recent requests</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
