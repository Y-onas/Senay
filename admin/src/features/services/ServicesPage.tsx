import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ClipboardList, Package, Plus, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { servicesApi, type Service } from '@/lib/api'
import { slugifyCatalog } from '@/features/services/service-helpers'
import { ServiceImage } from '@/features/services/components/ServiceImage'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ slug: '', name: '', description: '' })

  const reload = async () => {
    setLoading(true)
    try {
      setServices(await servicesApi.list())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const create = async () => {
    if (!draft.slug.trim() || !draft.name.trim()) {
      toast.error('Slug and name are required')
      return
    }
    setCreating(true)
    try {
      await servicesApi.create({
        slug: draft.slug.trim(),
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        enabled: true,
        sortOrder: services.length + 1,
      })
      setDraft({ slug: '', name: '', description: '' })
      toast.success('Service created')
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Services"
        description="Manage Baltina, Drinks, Festival, Agelgil, Catering and others."
        icon={<Package className="h-5 w-5" />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-brand/15 text-yellow-dark">
              <Plus className="h-4 w-4" />
            </span>
            Create a new service
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-3">
            <Label className="mb-1.5 block text-xs text-brown-muted">Slug</Label>
            <Input
              placeholder="e.g. catering"
              value={draft.slug}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  slug: slugifyCatalog(e.target.value),
                }))
              }
            />
          </div>
          <div className="md:col-span-3">
            <Label className="mb-1.5 block text-xs text-brown-muted">Name</Label>
            <Input
              placeholder="Display name"
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="md:col-span-4">
            <Label className="mb-1.5 block text-xs text-brown-muted">Description</Label>
            <Input
              placeholder="Short description"
              value={draft.description}
              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="flex items-end md:col-span-2">
            <Button disabled={creating} onClick={create} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-brown-muted">Loading services…</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-white/95 shadow-[0_8px_28px_-14px_rgba(44,26,20,0.22)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_-18px_rgba(44,26,20,0.32)]"
            >
              <div className="relative">
                <ServiceImage
                  slug={service.slug}
                  image={service.image}
                  name={service.name}
                  className="h-36 w-full"
                />
                <div className="absolute right-3 top-3">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset backdrop-blur-sm',
                      service.enabled
                        ? 'bg-green-brand/90 text-cream ring-green-brand'
                        : 'bg-white/85 text-brown-muted ring-border',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        service.enabled ? 'bg-cream' : 'bg-brown-muted',
                      )}
                    />
                    {service.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-burgundy">{service.name}</h3>
                  <span className="rounded-md bg-muted/70 px-1.5 py-0.5 font-mono text-[11px] text-brown-muted">
                    {service.slug}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm text-brown-muted">
                  {service.description || 'No description yet.'}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-brand/10 px-2.5 py-1 text-xs font-semibold text-yellow-dark">
                    <Package className="h-3.5 w-3.5" />
                    {service._count?.catalogItems ?? 0} items
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-burgundy/5 px-2.5 py-1 text-xs font-semibold text-burgundy">
                    <ClipboardList className="h-3.5 w-3.5" />
                    {service._count?.requests ?? 0} requests
                  </span>
                </div>
                <div className="mt-5 flex items-center justify-end border-t border-border/60 pt-4">
                  <Link
                    to={`/services/${service.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-burgundy px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-burgundy-light"
                  >
                    <Settings2 className="h-4 w-4" />
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
