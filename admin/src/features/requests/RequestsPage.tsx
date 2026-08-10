import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ClipboardList, Filter, Phone, Search } from 'lucide-react'
import { requestsApi, servicesApi, type RequestItem, type Service } from '@/lib/api'
import {
  REQUEST_STATUS_OPTIONS,
  RequestStatusBadge,
} from '@/components/common/RequestStatusBadge'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/utils'

export function RequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [service, setService] = useState('ALL')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const timer = setTimeout(() => setLoading(true), 300)
    try {
      const [rows, serviceRows] = await Promise.all([
        requestsApi.list({
          q: query || undefined,
          status: status !== 'ALL' ? status : undefined,
          service: service !== 'ALL' ? service : undefined,
        }),
        servicesApi.list(),
      ])
      setItems(rows)
      setServices(serviceRows)
    } finally {
      clearTimeout(timer)
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const serviceSlugs = useMemo(() => services.map((row) => row.slug), [services])

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Requests"
        description="Track customer requests, status, and source type."
        icon={<ClipboardList className="h-5 w-5" />}
        actions={
          loading ? null : (
            <span className="rounded-full border border-border/70 bg-white/80 px-3 py-1.5 text-sm font-semibold text-brown">
              {items.length} {items.length === 1 ? 'request' : 'requests'}
            </span>
          )
        }
      />

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 pt-6 md:grid-cols-12">
          <div className="md:col-span-5">
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs text-brown-muted">
              <Search className="h-3.5 w-3.5" />
              Search
            </Label>
            <Input
              placeholder="Search name, phone, reference..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
          </div>
          <div className="md:col-span-3">
            <Label className="mb-1.5 block text-xs text-brown-muted">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === 'ALL' ? 'All statuses' : option.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="mb-1.5 block text-xs text-brown-muted">Service</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All services</SelectItem>
                {serviceSlugs.map((slug) => (
                  <SelectItem key={slug} value={slug}>
                    {slug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end md:col-span-2">
            <Button onClick={load} className="w-full gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-brown-muted/60">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-burgundy">No requests found</p>
              <p className="text-sm text-brown-muted">Try adjusting your search or filters.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/requests/${item.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-white/90 p-4 shadow-[0_6px_20px_-12px_rgba(44,26,20,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:border-yellow-brand/40 hover:shadow-[0_14px_34px_-16px_rgba(44,26,20,0.3)]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cream-warm to-beige font-display text-lg font-bold text-burgundy">
                {(item.customerName || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-base font-bold text-burgundy">
                    {item.reference || item.id}
                  </p>
                  <RequestStatusBadge status={item.status} />
                </div>
                <p className="mt-0.5 truncate text-sm font-medium text-brown">
                  {item.customerName || 'Unknown customer'}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brown-muted">
                  {item.phone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {item.phone}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 font-medium">
                    {item.service?.name ?? item.serviceSlug ?? '—'}
                  </span>
                  {item.source ? (
                    <span className="rounded-full bg-burgundy/5 px-2 py-0.5 font-medium text-burgundy/70">
                      {item.source}
                    </span>
                  ) : null}
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
              <span className="hidden shrink-0 items-center gap-2 rounded-full bg-burgundy px-4 py-2 text-sm font-semibold text-cream transition-colors group-hover:bg-burgundy-light sm:inline-flex">
                <ArrowRight className="h-4 w-4" />
                View
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
